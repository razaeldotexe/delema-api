import axios from 'axios';

const WEBHOOK_URL = process.env.WEBHOOK_URL;

const Colors = {
    Reset: '\x1b[0m',
    Bright: '\x1b[1m',
    Dim: '\x1b[2m',
    Underscore: '\x1b[4m',
    Blink: '\x1b[5m',
    Reverse: '\x1b[7m',
    Hidden: '\x1b[8m',

    FgBlack: '\x1b[30m',
    FgRed: '\x1b[31m',
    FgGreen: '\x1b[32m',
    FgYellow: '\x1b[33m',
    FgBlue: '\x1b[34m',
    FgMagenta: '\x1b[35m',
    FgCyan: '\x1b[36m',
    FgWhite: '\x1b[37m',
    FgGray: '\x1b[90m',

    BgBlack: '\x1b[40m',
    BgRed: '\x1b[41m',
    BgGreen: '\x1b[42m',
    BgYellow: '\x1b[43m',
    BgBlue: '\x1b[44m',
    BgMagenta: '\x1b[45m',
    BgCyan: '\x1b[46m',
    BgWhite: '\x1b[47m',
};

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS' | 'SYSTEM' | 'AI';

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

    private getLevelColor(level: LogLevel): string {
        switch (level) {
            case 'INFO':
                return Colors.FgCyan;
            case 'WARN':
                return Colors.FgYellow;
            case 'ERROR':
                return Colors.FgRed;
            case 'DEBUG':
                return Colors.FgMagenta;
            case 'SUCCESS':
                return Colors.FgGreen;
            case 'SYSTEM':
                return Colors.FgBlue;
            case 'AI':
                return Colors.FgWhite;
            default:
                return Colors.FgWhite;
        }
    }

    public log(message: string, level: LogLevel = 'INFO'): void {
        const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
        
        // Console Output (Colored)
        const color = this.getLevelColor(level);
        const coloredTimestamp = `${Colors.FgGray}[${timestamp}]${Colors.Reset}`;
        const coloredLevel = `${color}${Colors.Bright}[${level}]${Colors.Reset}`;
        console.log(`${coloredTimestamp} ${coloredLevel} ${message}`);

        // Webhook Output (Plain text for code block)
        const formattedMessage = `[${timestamp}] [${level}] ${message}`;
        this.queue.push(formattedMessage);

        if (!this.isProcessing) {
            this.isProcessing = true;
            this.sendToWebhook().catch((err) => {
                console.error('Error in sendToWebhook:', err);
                this.isProcessing = false;
            });
        }
    }

    // Helper methods for semantic logging
    public info(msg: string) { this.log(msg, 'INFO'); }
    public warn(msg: string) { this.log(msg, 'WARN'); }
    public error(msg: string, err?: any) { 
        this.log(msg, 'ERROR'); 
        if (err) console.error(err);
    }
    public debug(msg: string) { 
        if (process.env.APP_MODE === 'dev' || process.env.DEBUG === 'true') {
            this.log(msg, 'DEBUG'); 
        }
    }
    public success(msg: string) { this.log(msg, 'SUCCESS'); }
    public system(msg: string) { this.log(msg, 'SYSTEM'); }
    public ai(msg: string) { this.log(msg, 'AI'); }
}

export const webhookLogger = WebhookLogger.getInstance();
