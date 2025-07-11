import { StateGraph, END } from '@langchain/langgraph';
import { prisma } from '@/lib/prisma';
import { TicketStatus, TicketPriority } from '@prisma/client';

interface Ticket {
  id: string;
  status: string;
  ai_priority: string;
  sla_deadline: Date;
  created_at: Date;
  assigned_at?: Date | null;
  accepted_at?: Date | null;
  store: { moderator?: { id: string } | null };
}
interface Escalation {
  ticket_id: string;
  trigger_event: string;
  escalated_to_user_id?: string;
  priority: string;
}
interface SLARule {
  priority: string;
  assignmentTimeoutMinutes: number;
  acceptanceTimeoutMinutes: number;
  resolutionTimeoutHours: number;
}

interface EscalationState {
  tickets?: Ticket[];
  escalations?: Escalation[];
  error?: string;
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
        const escalations: Escalation[] = [];

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
    graph.setEntryPoint('checkSLAViolations' as any);
    graph.addEdge('checkSLAViolations' as any, END);

    return graph;
  }

  private checkTicketSLA(ticket: Ticket, rule: SLARule, now: Date): Escalation[] {
    const escalations: Escalation[] = [];
    const createdAt = ticket.created_at;
    const assignedAt = ticket.assigned_at;
    const acceptedAt = ticket.accepted_at;

    // Check assignment timeout
    if (ticket.status === 'OPEN') {
      const assignmentDeadline = new Date(createdAt.getTime() + rule.assignmentTimeoutMinutes * 60000);
      if (now > assignmentDeadline) {
        escalations.push({
          ticket_id: ticket.id,
          trigger_event: `Assignment timeout: ${rule.assignmentTimeoutMinutes} minutes exceeded`,
          escalated_to_user_id: ticket.store.moderator?.id || undefined,
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
          escalated_to_user_id: ticket.store.moderator?.id || undefined,
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
          escalated_to_user_id: ticket.store.moderator?.id || undefined,
          priority: ticket.ai_priority
        });
      }
    }

    // Check SLA deadline
    const slaDeadline = ticket.sla_deadline;
    if (now > slaDeadline && ticket.status !== 'COMPLETED') {
      escalations.push({
        ticket_id: ticket.id,
        trigger_event: `SLA deadline exceeded`,
        escalated_to_user_id: ticket.store.moderator?.id || undefined,
        priority: ticket.ai_priority
      });
    }

    return escalations;
  }

  private async createEscalation(escalationData: Escalation): Promise<void> {
    try {
      // Check if escalation already exists for this ticket and trigger
      await prisma.escalation.create({
        data: {
          ticket_id: escalationData.ticket_id,
          escalation_trigger_event: escalationData.trigger_event,
          escalated_to_user_id: escalationData.escalated_to_user_id || '',
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