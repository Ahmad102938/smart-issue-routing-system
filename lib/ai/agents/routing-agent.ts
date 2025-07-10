import { StateGraph, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { prisma } from '@/lib/prisma';
import { TicketPriority } from '@prisma/client';

interface RoutingState {
  ticketId: string;
  category: string;
  subcategory: string;
  priority: TicketPriority;
  storeLocation: { latitude: number; longitude: number };
  availableProviders: any[];
  selectedProvider?: string;
  routingScore?: number;
  reasoning?: string;
  error?: string;
}

interface ProviderScore {
  providerId: string;
  score: number;
  breakdown: {
    skillMatch: number;
    availability: number;
    proximity: number;
    performance: number;
  };
  reasoning: string;
}

export class RoutingAgent {
  private model: ChatOpenAI;
  private graph: StateGraph<RoutingState>;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.2,
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    this.graph = this.buildGraph();
  }

  private buildGraph(): StateGraph<RoutingState> {
    const graph = new StateGraph<RoutingState>({
      channels: {
        ticketId: null,
        category: null,
        subcategory: null,
        priority: null,
        storeLocation: null,
        availableProviders: null,
        selectedProvider: null,
        routingScore: null,
        reasoning: null,
        error: null
      }
    });

    // Score providers node
    graph.addNode('scoreProviders', async (state: RoutingState) => {
      try {
        if (!state.availableProviders.length) {
          return {
            ...state,
            error: 'No available providers found'
          };
        }

        const providerScores: ProviderScore[] = [];

        for (const provider of state.availableProviders) {
          const score = await this.calculateProviderScore(provider, state);
          providerScores.push(score);
        }

        // Sort by score (highest first)
        providerScores.sort((a, b) => b.score - a.score);

        const bestProvider = providerScores[0];

        return {
          ...state,
          selectedProvider: bestProvider.providerId,
          routingScore: bestProvider.score,
          reasoning: bestProvider.reasoning
        };
      } catch (error) {
        console.error('Provider scoring error:', error);
        return {
          ...state,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Assignment node
    graph.addNode('assignTicket', async (state: RoutingState) => {
      try {
        if (!state.selectedProvider) {
          throw new Error('No provider selected for assignment');
        }

        // Create ticket assignment
        await prisma.ticketAssignment.create({
          data: {
            ticket_id: state.ticketId,
            service_provider_id: state.selectedProvider,
            assignment_sequence: 1, // Will be calculated properly in production
            status: 'PROPOSED'
          }
        });

        // Update ticket status
        await prisma.ticket.update({
          where: { id: state.ticketId },
          data: {
            status: 'ASSIGNED',
            assigned_service_provider_id: state.selectedProvider,
            assigned_at: new Date()
          }
        });

        // Update provider load
        await prisma.serviceProvider.update({
          where: { id: state.selectedProvider },
          data: {
            current_load: {
              increment: 1
            }
          }
        });

        return state;
      } catch (error) {
        console.error('Assignment error:', error);
        return {
          ...state,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Set entry point and edges
    graph.setEntryPoint('scoreProviders');
    graph.addEdge('scoreProviders', 'assignTicket');
    graph.addEdge('assignTicket', END);

    return graph;
  }

  private async calculateProviderScore(provider: any, state: RoutingState): Promise<ProviderScore> {
    // Skill matching score (0-1)
    const skillMatch = this.calculateSkillMatch(provider.skills, state.category, state.subcategory);
    
    // Availability score (0-1)
    const availability = 1 - (provider.current_load / provider.capacity_per_day);
    
    // Proximity score (0-1) - closer is better
    const proximity = this.calculateProximityScore(provider.distance || 0);
    
    // Performance score (0-1) - based on historical data
    const performance = await this.calculatePerformanceScore(provider.id);

    // Weighted scoring
    const weights = {
      skillMatch: 0.4,
      availability: 0.2,
      proximity: 0.3,
      performance: 0.1
    };

    // Priority adjustments
    if (state.priority === 'HIGH') {
      weights.proximity += 0.1;
      weights.availability += 0.1;
      weights.skillMatch -= 0.1;
      weights.performance -= 0.1;
    }

    const totalScore = 
      skillMatch * weights.skillMatch +
      availability * weights.availability +
      proximity * weights.proximity +
      performance * weights.performance;

    const reasoning = `
Provider ${provider.company_name} scored ${(totalScore * 100).toFixed(1)}%:
- Skill Match: ${(skillMatch * 100).toFixed(1)}% (weight: ${weights.skillMatch})
- Availability: ${(availability * 100).toFixed(1)}% (${provider.current_load}/${provider.capacity_per_day} capacity)
- Proximity: ${(proximity * 100).toFixed(1)}% (${provider.distance?.toFixed(1)}km away)
- Performance: ${(performance * 100).toFixed(1)}% (historical average)
Priority: ${state.priority}
    `.trim();

    return {
      providerId: provider.id,
      score: totalScore,
      breakdown: {
        skillMatch,
        availability,
        proximity,
        performance
      },
      reasoning
    };
  }

  private calculateSkillMatch(providerSkills: string[], category: string, subcategory: string): number {
    const requiredSkills = this.getCategorySkills(category, subcategory);
    
    let matchScore = 0;
    let totalWeight = 0;

    for (const required of requiredSkills) {
      const weight = required.weight;
      totalWeight += weight;

      const hasSkill = providerSkills.some(skill => 
        skill.toLowerCase().includes(required.skill.toLowerCase()) ||
        required.skill.toLowerCase().includes(skill.toLowerCase())
      );

      if (hasSkill) {
        matchScore += weight;
      }
    }

    return totalWeight > 0 ? matchScore / totalWeight : 0;
  }

  private getCategorySkills(category: string, subcategory: string): Array<{skill: string, weight: number}> {
    const skillMap: Record<string, Array<{skill: string, weight: number}>> = {
      'Facilities_Cold Storage': [
        { skill: 'Refrigeration', weight: 1.0 },
        { skill: 'HVAC', weight: 0.7 },
        { skill: 'Electrical', weight: 0.3 }
      ],
      'Facilities_Electrical': [
        { skill: 'Electrical', weight: 1.0 },
        { skill: 'General Maintenance', weight: 0.5 }
      ],
      'Facilities_Plumbing': [
        { skill: 'Plumbing', weight: 1.0 },
        { skill: 'General Maintenance', weight: 0.5 }
      ],
      'Facilities_HVAC': [
        { skill: 'HVAC', weight: 1.0 },
        { skill: 'Electrical', weight: 0.4 }
      ],
      'IT_POS Systems': [
        { skill: 'POS Systems', weight: 1.0 },
        { skill: 'IT Support', weight: 0.8 },
        { skill: 'Electrical', weight: 0.3 }
      ],
      'IT_Network': [
        { skill: 'Network', weight: 1.0 },
        { skill: 'IT Support', weight: 0.8 }
      ],
      'Equipment_Shopping Carts': [
        { skill: 'General Maintenance', weight: 1.0 },
        { skill: 'Mechanical', weight: 0.7 }
      ]
    };

    const key = `${category}_${subcategory}`;
    return skillMap[key] || [{ skill: 'General Maintenance', weight: 1.0 }];
  }

  private calculateProximityScore(distance: number): number {
    // Score decreases with distance, max useful distance is 50km
    const maxDistance = 50;
    return Math.max(0, 1 - (distance / maxDistance));
  }

  private async calculatePerformanceScore(providerId: string): Promise<number> {
    try {
      // Get completed tickets for this provider in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const completedTickets = await prisma.ticket.findMany({
        where: {
          assigned_service_provider_id: providerId,
          status: 'COMPLETED',
          completed_at: {
            gte: thirtyDaysAgo
          }
        }
      });

      if (completedTickets.length === 0) {
        return 0.7; // Default score for new providers
      }

      // Calculate average resolution time vs SLA
      let slaCompliance = 0;
      for (const ticket of completedTickets) {
        if (ticket.completed_at && ticket.completed_at <= ticket.sla_deadline) {
          slaCompliance++;
        }
      }

      return slaCompliance / completedTickets.length;
    } catch (error) {
      console.error('Performance calculation error:', error);
      return 0.7; // Default score
    }
  }

  async routeTicket(
    ticketId: string,
    category: string,
    subcategory: string,
    priority: TicketPriority,
    storeLocation: { latitude: number; longitude: number },
    availableProviders: any[]
  ): Promise<{ providerId: string; score: number; reasoning: string }> {
    const compiled = this.graph.compile();
    
    const result = await compiled.invoke({
      ticketId,
      category,
      subcategory,
      priority,
      storeLocation,
      availableProviders
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      providerId: result.selectedProvider!,
      score: result.routingScore!,
      reasoning: result.reasoning!
    };
  }
}

// Singleton instance
export const routingAgent = new RoutingAgent();