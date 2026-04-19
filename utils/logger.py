import os
import asyncio
import httpx
from datetime import datetime
from typing import List

WEBHOOK_URL = os.getenv("WEBHOOK_URL")

class WebhookLogger:
    def __init__(self):
        self.queue: List[str] = []
        self.all_logs: List[str] = [] # Keep history for the current run
        self.is_processing = False
        self.delay = 3  # Update frequency
        self.message_id = None # Track message for the current run

    async def _send_to_webhook(self):
        if not WEBHOOK_URL or not self.queue:
            self.is_processing = False
            return

        # Move queue to history
        self.all_logs.extend(self.queue)
        self.queue = []
        
        # Prepare the log chunk (Discord limit is ~2000 chars, so we take the last 15-20 lines)
        logs_display = "\n".join(self.all_logs[-40:]) # Show last 40 lines
        
        content = f"**[DELEMA API LOGS - RUN: {datetime.now().strftime('%Y-%m-%d %H:%M')}]**\n```log\n{logs_display}\n```"

        async with httpx.AsyncClient() as client:
            try:
                if self.message_id is None:
                    # Initial message for this run
                    # Use wait=true to get the message ID back
                    response = await client.post(f"{WEBHOOK_URL}?wait=true", json={"content": content})
                    if response.status_code in [200, 201]:
                        self.message_id = response.json().get("id")
                else:
                    # Edit existing message for this run
                    # Webhook edit URL: /messages/{id}
                    edit_url = f"{WEBHOOK_URL}/messages/{self.message_id}"
                    await client.patch(edit_url, json={"content": content})
                    
            except Exception as e:
                print(f"Failed to send logs to webhook: {e}")

        # Wait for delay
        await asyncio.sleep(self.delay)
        
        if self.queue:
            await self._send_to_webhook()
        else:
            self.is_processing = False

    def log(self, message: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        formatted_message = f"[{timestamp}] [{level}] {message}"
        
        # Print to local console
        print(formatted_message)
        
        # Add to queue
        self.queue.append(formatted_message)
        
        # Start processing
        if not self.is_processing:
            self.is_processing = True
            asyncio.create_task(self._send_to_webhook())

# Singleton instance
webhook_logger = WebhookLogger()
