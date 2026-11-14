import { describe, it, expect } from 'vitest';
import { ChatThread } from '../../src/models/ChatThread';

describe('ChatThread Model', () => {
  it('should instantiate a chat thread with default values', () => {
    const thread = new ChatThread({
      chatId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Test Conversation',
      messages: [
        {
          role: 'user',
          content: 'Hello, world!',
        },
        {
          role: 'assistant',
          content: 'Hi there!',
          toolCalls: [
            {
              name: 'website_scraper',
              args: { url: 'https://example.com' },
              output: 'Example Content',
              toolCallId: 'call_1',
            },
          ],
        },
      ],
    });

    expect(thread.chatId).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(thread.title).toBe('Test Conversation');
    expect(thread.messages).toHaveLength(2);
    expect(thread.messages[0].role).toBe('user');
    expect(thread.messages[0].content).toBe('Hello, world!');
    expect(thread.messages[1].role).toBe('assistant');
    expect(thread.messages[1].toolCalls).toHaveLength(1);
    expect(thread.messages[1].toolCalls?.[0].name).toBe('website_scraper');
  });
});

