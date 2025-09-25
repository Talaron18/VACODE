import OpenAI from 'openai';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
}

export class AIService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            baseURL: "https://api.siliconflow.cn/v1",
            apiKey: "sk-qwbstpkwwkznovwhwqdupiolcknmrlyynsgcmrpiogxqcdwx",
            timeout: 300000,
        });
    }

    async chat(message: string, chatHistory: ChatMessage[] = []): Promise<string> {
        try {
            const messages = [
                ...chatHistory.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                {
                    role: "user" as const,
                    content: message
                }
            ];

            const completion = await this.openai.chat.completions.create({
                model: "Qwen/Qwen3-8B",
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7,
            });

            return completion.choices[0].message.content || 'No response received';
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `AI service error: ${errorMessage}`;
        }
    }

    async *chatStream(message: string, chatHistory: ChatMessage[] = []): AsyncGenerator<string, void, unknown> {
        try {
            const messages = [
                ...chatHistory.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                {
                    role: "user" as const,
                    content: message
                }
            ];

            const stream = await this.openai.chat.completions.create({
                model: "Qwen/Qwen3-8B",
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7,
                stream: true,
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    yield content;
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            yield `AI service error: ${errorMessage}`;
        }
    }
}