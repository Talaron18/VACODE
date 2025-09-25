"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const openai_1 = __importDefault(require("openai"));
class AIService {
    constructor() {
        this.openai = new openai_1.default({
            baseURL: "https://api.siliconflow.cn/v1",
            apiKey: "sk-qwbstpkwwkznovwhwqdupiolcknmrlyynsgcmrpiogxqcdwx",
            timeout: 300000,
        });
    }
    async chat(message, chatHistory = []) {
        try {
            const messages = [
                ...chatHistory.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                {
                    role: "user",
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `AI service error: ${errorMessage}`;
        }
    }
    async *chatStream(message, chatHistory = []) {
        try {
            const messages = [
                ...chatHistory.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                {
                    role: "user",
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            yield `AI service error: ${errorMessage}`;
        }
    }
}
exports.AIService = AIService;
//# sourceMappingURL=ai-service.js.map