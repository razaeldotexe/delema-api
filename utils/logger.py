import os
import asyncio
import httpx
from datetime import datetime
from typing import List

WEBHOOK_URL = os.getenv("WEBHOOK_URL")

class WebhookLogger:
    def __init__(self):
        self.queue: List[str] = []
        self.is_processing = False
        self.delay = 5  # Group logs every 5 seconds

    async def _send_to_webhook(self):
        if not WEBHOOK_URL or not self.queue:
            self.is_processing = False
            return

        # Prepare the log chunk
        logs = "\n".join(self.queue)
        self.queue = [] # Clear the queue
        
        content = f"**[DELEMA API LOGS - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]**\n```log\n{logs}\n```"

        async with httpx.AsyncClient() as client:
            try:
                # Send to Discord
                await client.post(WEBHOOK_URL, json={"content": content})
            except Exception as e:
                print(f"Failed to send logs to webhook: {e}")

        # Wait for delay before allowing next batch
        await asyncio.sleep(self.delay)
        
        if self.queue:
            await self._send_to_webhook()
        else:
            self.is_processing = False

    def log(self, message: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        formatted_message = f"[{timestamp}] [{level}] {message}"
        
        # Also print to local console
        print(formatted_message)
        
        # Add to queue for webhook
        self.queue.append(formatted_message)
        
        # Start background task if not already processing
        if not self.is_processing:
            self.is_processing = True
            asyncio.create_task(self._send_to_webhook())

# Singleton instance
webhook_logger = WebhookLogger()
