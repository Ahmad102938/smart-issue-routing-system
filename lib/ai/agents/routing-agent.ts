import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { TicketPriority } from '@prisma/client';

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
  private model: GoogleGenerativeAI | null = null;
  private genModel: any = null;
  private useMock: boolean = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      try {
        this.model = new GoogleGenerativeAI(apiKey);
        this.genModel = this.model.getGenerativeModel({ model: 'gemini-1.5-flash' });
        this.useMock = false;
      } catch (error) {
        console.warn('Failed to initialize Gemini AI for routing, using standard routing:', error);
        this.useMock = true;
      }
    } else {
      console.warn('No Gemini API key provided for routing, using standard routing');
      this.useMock = true;
    }
  }

  private calculateSkillMatch(providerSkills: string[], category: string, subcategory: string): number {
    const requiredSkills = this.getCategorySkills(category, subcategory);
    let totalScore = 0;
    let totalWeight = 0;

    for (const { skill, weight } of requiredSkills) {
      const hasSkill = providerSkills.some(providerSkill => 
        providerSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(providerSkill.toLowerCase())
      );
      totalScore += hasSkill ? weight : 0;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private getCategorySkills(category: string, subcategory: string): Array<{skill: string, weight: number}> {
    const skillMap: Record<string, Array<{skill: string, weight: number}>> = {
      'Facilities_Cold Storage': [
        { skill: 'Refrigeration', weight: 0.8 },
        { skill: 'HVAC', weight: 0.6 },
        { skill: 'Electrical', weight: 0.4 }
      ],
      'Facilities_Electrical': [
        { skill: 'Electrical', weight: 0.9 },
        { skill: 'General Maintenance', weight: 0.3 }
      ],
      'Facilities_Plumbing': [
        { skill: 'Plumbing', weight: 0.9 },
        { skill: 'General Maintenance', weight: 0.3 }
      ],
      'Facilities_HVAC': [
        { skill: 'HVAC', weight: 0.9 },
        { skill: 'Electrical', weight: 0.4 }
      ],
      'IT_POS Systems': [
        { skill: 'POS Systems', weight: 0.8 },
        { skill: 'IT Support', weight: 0.7 }
      ],
      'IT_Network': [
        { skill: 'Network', weight: 0.9 },
        { skill: 'IT Support', weight: 0.6 }
      ],
      'IT_Computers': [
        { skill: 'IT Support', weight: 0.8 },
        { skill: 'Computer Repair', weight: 0.7 }
      ],
      'Equipment_Shopping Carts': [
        { skill: 'General Maintenance', weight: 0.7 }
      ],
      'Equipment_Shelving': [
        { skill: 'General Maintenance', weight: 0.8 }
      ],
      'General_Maintenance': [
        { skill: 'General Maintenance', weight: 0.9 }
      ]
    };

    const key = `${category}_${subcategory}`;
    return skillMap[key] || [{ skill: 'General Maintenance', weight: 0.9 }];
  }

  private calculateProximityScore(distance: number): number {
    // Closer is better, max distance of 50km
    const maxDistance = 50;
    return Math.max(0, 1 - (distance / maxDistance));
  }

  private async calculatePerformanceScore(providerId: string): Promise<number> {
    try {
      // Get historical performance data
      const completedTickets = await prisma.ticket.count({
        where: {
          assigned_service_provider_id: providerId,
          status: 'COMPLETED'
        }
      });

      const totalTickets = await prisma.ticket.count({
        where: {
          assigned_service_provider_id: providerId
        }
      });

      if (totalTickets === 0) return 0.5; // Default score for new providers

      return completedTickets / totalTickets;
    } catch (error) {
      console.error('Error calculating performance score:', error);
      return 0.5; // Default score
    }
  }

  private async calculateProviderScore(provider: any, category: string, subcategory: string, priority: TicketPriority): Promise<ProviderScore> {
    // Skill matching score (0-1)
    const skillMatch = this.calculateSkillMatch(provider.skills, category, subcategory);
    
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
    if (priority === 'HIGH') {
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
Priority: ${priority}
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

  async routeTicket(
    ticketId: string,
    category: string,
    subcategory: string,
    priority: TicketPriority,
    storeLocation: { latitude: number; longitude: number },
    availableProviders: any[]
  ): Promise<{ providerId: string; score: number; reasoning: string }> {
    try {
      if (!availableProviders.length) {
        throw new Error('No available providers found');
      }

      const providerScores: ProviderScore[] = [];

      for (const provider of availableProviders) {
        const score = await this.calculateProviderScore(provider, category, subcategory, priority);
        providerScores.push(score);
      }

      // Sort by score (highest first)
      providerScores.sort((a, b) => b.score - a.score);

      const bestProvider = providerScores[0];

      // Create ticket assignment
      await prisma.ticketAssignment.create({
        data: {
          ticket_id: ticketId,
          service_provider_id: bestProvider.providerId,
          assignment_sequence: 1,
          status: 'PROPOSED'
        }
      });

      // Update ticket status
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'ASSIGNED',
          assigned_service_provider_id: bestProvider.providerId,
          assigned_at: new Date()
        }
      });

      // Update provider load
      await prisma.serviceProvider.update({
        where: { id: bestProvider.providerId },
        data: {
          current_load: {
            increment: 1
          }
        }
      });

      return {
        providerId: bestProvider.providerId,
        score: bestProvider.score,
        reasoning: bestProvider.reasoning
      };

    } catch (error) {
      console.error('Routing error:', error);
      throw error;
    }
  }
}

// Singleton instance
export const routingAgent = new RoutingAgent();