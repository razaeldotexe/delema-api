import axios from 'axios';

const WEBHOOK_URL = process.env.WEBHOOK_URL;

class WebhookLogger {
  private static instance: WebhookLogger;
  private queue: string[] = [];
  private allLogs: string[] = [];
  private isProcessing = false;
  private delay = 3000;
  private messageId: string | null = null;
  private startTimestamp: number;

  private constructor() {
    this.startTimestamp = Math.floor(Date.now() / 1000);
  }

  public static getInstance(): WebhookLogger {
    if (!WebhookLogger.instance) {
      WebhookLogger.instance = new WebhookLogger();
    }
    return WebhookLogger.instance;
  }

  private async sendToWebhook(): Promise<void> {
    if (!WEBHOOK_URL || this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.allLogs.push(...this.queue);
    this.queue = [];

    const logsDisplay = this.allLogs.slice(-40).join('\n');
    const header = `📡 **Delema API** • <t:${this.startTimestamp}:t> (<t:${this.startTimestamp}:R>)`;
    const content = `${header}\n\`\`\`log\n${logsDisplay}\n\`\`\``;

    try {
      if (this.messageId === null) {
        const response = await axios.post(`${WEBHOOK_URL}?wait=true`, { content });
        if (response.status === 200 || response.status === 201) {
          this.messageId = response.data.id;
        }
      } else {
        const editUrl = `${WEBHOOK_URL}/messages/${this.messageId}`;
        await axios.patch(editUrl, { content });
      }
    } catch (error) {
      console.error(`Failed to send logs to webhook: ${error}`);
    }

    await new Promise((resolve) => setTimeout(resolve, this.delay));

    if (this.queue.length > 0) {
      await this.sendToWebhook();
    } else {
      this.isProcessing = false;
    }
  }

  public log(message: string, level = 'INFO'): void {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(formattedMessage);
    this.queue.push(formattedMessage);

    if (!this.isProcessing) {
      this.isProcessing = true;
      this.sendToWebhook().catch((err) => {
        console.error('Error in sendToWebhook:', err);
        this.isProcessing = false;
      });
    }
  }
}

export const webhookLogger = WebhookLogger.getInstance();
