import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const LOG_FILE_PATH = path.join(process.cwd(), 'console.log');

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
    private uploadInterval = 30 * 60 * 1000; // 30 minutes

    private constructor() {
        this.startTimestamp = Math.floor(Date.now() / 1000);
        this.initFileLogging();
        this.startFileUploadLoop();
    }

    public static getInstance(): WebhookLogger {
        if (!WebhookLogger.instance) {
            WebhookLogger.instance = new WebhookLogger();
        }
        return WebhookLogger.instance;
    }

    private initFileLogging() {
        // Ensure file exists
        if (!fs.existsSync(LOG_FILE_PATH)) {
            fs.writeFileSync(LOG_FILE_PATH, `--- LOG START ${new Date().toISOString()} ---\n`);
        }
    }

    private startFileUploadLoop() {
        if (!WEBHOOK_URL) return;

        setInterval(async () => {
            await this.uploadLogFile();
        }, this.uploadInterval);
    }

    public async uploadLogFile() {
        if (!WEBHOOK_URL || !fs.existsSync(LOG_FILE_PATH)) return;

        try {
            const stats = fs.statSync(LOG_FILE_PATH);
            if (stats.size < 10) return; // Don't upload empty/near-empty files

            const form = new FormData();
            form.append('content', `📊 **Log File Export** • <t:${Math.floor(Date.now() / 1000)}:R>\nSession started: <t:${this.startTimestamp}:f>`);
            form.append('file', fs.createReadStream(LOG_FILE_PATH), {
                filename: `console-${new Date().toISOString().split('T')[0]}.log`,
                contentType: 'text/plain',
            });

            await axios.post(WEBHOOK_URL, form, {
                headers: form.getHeaders(),
            });

            // Optional: Clear file after successful upload to prevent it from growing too large
            // fs.writeFileSync(LOG_FILE_PATH, `--- LOG RESET ${new Date().toISOString()} ---\n`);
            
            this.success('Log file uploaded to Discord successfully.');
        } catch (error: any) {
            this.error(`Failed to upload log file: ${error.message}`);
        }
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
        const dateStamp = new Date().toISOString().split('T')[0];
        
        // Console Output (Colored)
        const color = this.getLevelColor(level);
        const coloredTimestamp = `${Colors.FgGray}[${timestamp}]${Colors.Reset}`;
        const coloredLevel = `${color}${Colors.Bright}[${level}]${Colors.Reset}`;
        console.log(`${coloredTimestamp} ${coloredLevel} ${message}`);

        // Format for file and webhook
        const formattedMessage = `[${dateStamp} ${timestamp}] [${level}] ${message}`;

        // 1. Log to File
        try {
            fs.appendFileSync(LOG_FILE_PATH, formattedMessage + '\n');
        } catch (err) {
            console.error('Failed to write to log file:', err);
        }

        // 2. Queue for Webhook (Batched text)
        this.queue.push(`[${timestamp}] [${level}] ${message}`);

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
    public warning(msg: string) { this.warn(msg); } // Alias for libraries like duckduckgo-search
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
