import os
import asyncio
import httpx
import time
from datetime import datetime
from typing import List

WEBHOOK_URL = os.getenv("WEBHOOK_URL")

class WebhookLogger:
    def __init__(self):
        self.queue: List[str] = []
        self.all_logs: List[str] = []
        self.is_processing = False
        self.delay = 3
        self.message_id = None
        self.start_timestamp = int(time.time()) # Capture start of session

    async def _send_to_webhook(self):
        if not WEBHOOK_URL or not self.queue:
            self.is_processing = False
            return

        self.all_logs.extend(self.queue)
        self.queue = []
        
        logs_display = "\n".join(self.all_logs[-40:])
        
        # New cleaner format using Discord native timestamping
        # t = short time, R = relative time
        header = f"📡 **Delema API** • <t:{self.start_timestamp}:t> (<t:{self.start_timestamp}:R>)"
        content = f"{header}\n```log\n{logs_display}\n```"

        async with httpx.AsyncClient() as client:
            try:
                if self.message_id is None:
                    response = await client.post(f"{WEBHOOK_URL}?wait=true", json={"content": content})
                    if response.status_code in [200, 201]:
                        self.message_id = response.json().get("id")
                else:
                    edit_url = f"{WEBHOOK_URL}/messages/{self.message_id}"
                    await client.patch(edit_url, json={"content": content})
            except Exception as e:
                print(f"Failed to send logs to webhook: {e}")

        await asyncio.sleep(self.delay)
        
        if self.queue:
            await self._send_to_webhook()
        else:
            self.is_processing = False

    def log(self, message: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        formatted_message = f"[{timestamp}] [{level}] {message}"
        print(formatted_message)
        self.queue.append(formatted_message)
        
        if not self.is_processing:
            self.is_processing = True
            asyncio.create_task(self._send_to_webhook())

webhook_logger = WebhookLogger()
