import { StateGraph, END } from '@langchain/langgraph';
import { prisma } from '@/lib/prisma';
import { TicketStatus, TicketPriority } from '@prisma/client';

interface EscalationState {
  tickets?: any[];
  escalations?: any[];
  error?: string;
}

interface SLARule {
  priority: TicketPriority;
  assignmentTimeoutMinutes: number;
  acceptanceTimeoutMinutes: number;
  resolutionTimeoutHours: number;
}

export class EscalationAgent {
  private graph: StateGraph<EscalationState>;
  private slaRules: SLARule[] = [
    {
      priority: 'HIGH',
      assignmentTimeoutMinutes: 15,
      acceptanceTimeoutMinutes: 30,
      resolutionTimeoutHours: 4
    },
    {
      priority: 'MEDIUM',
      assignmentTimeoutMinutes: 30,
      acceptanceTimeoutMinutes: 60,
      resolutionTimeoutHours: 12
    },
    {
      priority: 'LOW',
      assignmentTimeoutMinutes: 120,
      acceptanceTimeoutMinutes: 240,
      resolutionTimeoutHours: 48
    }
  ];

  constructor() {
    this.graph = this.buildGraph();
  }

  private buildGraph(): StateGraph<EscalationState> {
    const graph = new StateGraph<EscalationState>({
      channels: {
        tickets: null,
        escalations: null,
        error: null
      }
    });

    // Check SLA violations node
    graph.addNode('checkSLAViolations', async (state: EscalationState) => {
      try {
        const now = new Date();
        const escalations: any[] = [];

        // Get all active tickets
        const tickets = await prisma.ticket.findMany({
          where: {
            status: {
              in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS']
            }
          },
          include: {
            store: {
              include: {
                moderator: true
              }
            },
            assigned_provider: true
          }
        });

        for (const ticket of tickets) {
          const rule = this.slaRules.find(r => r.priority === ticket.ai_priority);
          if (!rule) continue;

          const escalationEvents = this.checkTicketSLA(ticket, rule, now);
          escalations.push(...escalationEvents);
        }

        // Process escalations
        for (const escalation of escalations) {
          await this.createEscalation(escalation);
        }

        return {
          ...state,
          tickets,
          escalations
        };
      } catch (error) {
        console.error('SLA check error:', error);
        return {
          ...state,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Set entry point and edges
    graph.setEntryPoint('checkSLAViolations');
    graph.addEdge('checkSLAViolations', END);

    return graph;
  }

  private checkTicketSLA(ticket: any, rule: SLARule, now: Date): any[] {
    const escalations: any[] = [];
    const createdAt = new Date(ticket.created_at);
    const assignedAt = ticket.assigned_at ? new Date(ticket.assigned_at) : null;
    const acceptedAt = ticket.accepted_at ? new Date(ticket.accepted_at) : null;

    // Check assignment timeout
    if (ticket.status === 'OPEN') {
      const assignmentDeadline = new Date(createdAt.getTime() + rule.assignmentTimeoutMinutes * 60000);
      if (now > assignmentDeadline) {
        escalations.push({
          ticket_id: ticket.id,
          trigger_event: `Assignment timeout: ${rule.assignmentTimeoutMinutes} minutes exceeded`,
          escalated_to_user_id: ticket.store.moderator?.id || null,
          priority: ticket.ai_priority
        });
      }
    }

    // Check acceptance timeout
    if (ticket.status === 'ASSIGNED' && assignedAt) {
      const acceptanceDeadline = new Date(assignedAt.getTime() + rule.acceptanceTimeoutMinutes * 60000);
      if (now > acceptanceDeadline) {
        escalations.push({
          ticket_id: ticket.id,
          trigger_event: `Acceptance timeout: ${rule.acceptanceTimeoutMinutes} minutes exceeded`,
          escalated_to_user_id: ticket.store.moderator?.id || null,
          priority: ticket.ai_priority
        });
      }
    }

    // Check resolution timeout
    if (ticket.status === 'IN_PROGRESS' && acceptedAt) {
      const resolutionDeadline = new Date(acceptedAt.getTime() + rule.resolutionTimeoutHours * 3600000);
      if (now > resolutionDeadline) {
        escalations.push({
          ticket_id: ticket.id,
          trigger_event: `Resolution timeout: ${rule.resolutionTimeoutHours} hours exceeded`,
          escalated_to_user_id: ticket.store.moderator?.id || null,
          priority: ticket.ai_priority
        });
      }
    }

    // Check SLA deadline
    const slaDeadline = new Date(ticket.sla_deadline);
    if (now > slaDeadline && ticket.status !== 'COMPLETED') {
      escalations.push({
        ticket_id: ticket.id,
        trigger_event: 'SLA deadline exceeded',
        escalated_to_user_id: ticket.store.moderator?.id || null,
        priority: ticket.ai_priority
      });
    }

    return escalations;
  }

  private async createEscalation(escalationData: any): Promise<void> {
    try {
      // Check if escalation already exists for this ticket and trigger
      const existingEscalation = await prisma.escalation.findFirst({
        where: {
          ticket_id: escalationData.ticket_id,
          escalation_trigger_event: escalationData.trigger_event,
          status: {
            in: ['TRIGGERED', 'ACKNOWLEDGED']
          }
        }
      });

      if (existingEscalation) {
        return; // Don't create duplicate escalations
      }

      // Create escalation
      await prisma.escalation.create({
        data: {
          ticket_id: escalationData.ticket_id,
          escalation_trigger_event: escalationData.trigger_event,
          escalated_to_user_id: escalationData.escalated_to_user_id,
          status: 'TRIGGERED'
        }
      });

      // Update ticket status if needed
      if (escalationData.trigger_event.includes('SLA deadline exceeded')) {
        await prisma.ticket.update({
          where: { id: escalationData.ticket_id },
          data: { status: 'ESCALATED' }
        });
      }

      console.log(`Escalation created for ticket ${escalationData.ticket_id}: ${escalationData.trigger_event}`);
    } catch (error) {
      console.error('Failed to create escalation:', error);
    }
  }

  async checkAllSLAs(): Promise<void> {
    const compiled = this.graph.compile();
    await compiled.invoke({});
  }

  calculateSLADeadline(priority: TicketPriority, createdAt: Date): Date {
    const rule = this.slaRules.find(r => r.priority === priority);
    if (!rule) {
      // Default to medium priority
      return new Date(createdAt.getTime() + 12 * 3600000);
    }

    return new Date(createdAt.getTime() + rule.resolutionTimeoutHours * 3600000);
  }
}

// Singleton instance
export const escalationAgent = new EscalationAgent();