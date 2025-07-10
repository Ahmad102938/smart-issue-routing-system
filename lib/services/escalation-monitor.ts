import { escalationAgent } from '@/lib/ai/agents/escalation-agent';

class EscalationMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start(intervalMinutes: number = 5) {
    if (this.isRunning) {
      console.log('Escalation monitor is already running');
      return;
    }

    console.log(`Starting escalation monitor with ${intervalMinutes} minute intervals`);
    
    this.intervalId = setInterval(async () => {
      try {
        await escalationAgent.checkAllSLAs();
      } catch (error) {
        console.error('Escalation monitor error:', error);
      }
    }, intervalMinutes * 60 * 1000);

    this.isRunning = true;
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('Escalation monitor stopped');
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId
    };
  }
}

export const escalationMonitor = new EscalationMonitor();

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  escalationMonitor.start();
}