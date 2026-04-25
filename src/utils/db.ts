import { MongoClient, Collection } from 'mongodb';
import crypto from 'crypto';
import { webhookLogger } from './logger';

let client: MongoClient | null = null;
let memoryCollection: Collection | null = null;

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Initialize MongoDB connection for AI Memory.
 */
export async function initDB() {
  if (!MONGODB_URI) {
    webhookLogger.warn('MONGODB_URI not found. AI Memory will be disabled.');
    return;
  }

  try {
    if (!client) {
      client = new MongoClient(MONGODB_URI);
      await client.connect();
      const db = client.db();
      memoryCollection = db.collection('ai_memory');

      // Create TTL Index: Memory expires after 7 days
      await memoryCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 604800 });
      // Create Hash Index for fast lookup
      await memoryCollection.createIndex({ hash: 1 }, { unique: true });

      webhookLogger.system('AI Memory System (MongoDB) initialized.');
    }
  } catch (error: any) {
    webhookLogger.error('Failed to initialize AI Memory DB:', error.message);
  }
}

/**
 * Generates a consistent hash for a prompt.
 */
export function getPromptHash(prompt: string): string {
  return crypto.createHash('md5').update(prompt.trim()).digest('hex');
}

/**
 * Retrieves a response from memory if it exists.
 */
export async function getFromMemory(prompt: string): Promise<string | null> {
  if (!memoryCollection) return null;

  try {
    const hash = getPromptHash(prompt);
    const record = await memoryCollection.findOne({ hash });
    if (record) {
      webhookLogger.info(`AI Memory Hit: Found cached response for hash ${hash}`);
      return record.response;
    }
  } catch (error: any) {
    webhookLogger.warn(`Failed to read from AI Memory: ${error.message}`);
  }
  return null;
}

/**
 * Saves an AI response to memory.
 */
export async function saveToMemory(prompt: string, response: string) {
  if (!memoryCollection) return;

  try {
    const hash = getPromptHash(prompt);
    await memoryCollection.updateOne(
      { hash },
      {
        $set: {
          hash,
          prompt: prompt.substring(0, 500), // Store snippet for debugging
          response,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    webhookLogger.success(`Saved new AI response to memory (Hash: ${hash})`);
  } catch (error: any) {
    webhookLogger.warn(`Failed to save to AI Memory: ${error.message}`);
  }
}
