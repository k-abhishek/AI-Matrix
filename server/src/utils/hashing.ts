import crypto from 'crypto';
import { v5 as uuidv5 } from 'uuid';

// Fixed namespace UUID for deterministic point IDs in Qdrant
const QDRANT_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Computes a SHA-256 hash of cleaned text content.
 */
export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content.trim()).digest('hex');
}

/**
 * Generates a deterministic UUID v5 string for a Qdrant point based on crawlerId, pageId and chunkIndex.
 * Qdrant accepts either standard UUID strings or unsigned 64-bit integers.
 */
export function generatePointId(pageId: string, chunkIndex: number): string {
  const seed = `${pageId}:${chunkIndex}`;
  return uuidv5(seed, QDRANT_NAMESPACE);
}

