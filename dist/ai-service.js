"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const openai_1 = __importDefault(require("openai"));
// AI服务类 - 负责与OpenRouter API通信，提供聊天和流式聊天功能
class AIService {
    constructor() {
        // 初始化OpenAI客户端，使用SiliconFlow API
        this.openai = new openai_1.default({
            baseURL: "https://api.siliconflow.cn/v1",
            apiKey: "sk-qwbstpkwwkznovwhwqdupiolcknmrlyynsgcmrpiogxqcdwx",
            timeout: 300000, // 5分钟超时
        });
    }
    // 发送聊天消息到AI
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
            return completion.choices[0].message.content || '没有收到回复';
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `AI服务错误: ${errorMessage}`;
        }
    }
    // 流式发送聊天消息到AI
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
            yield `AI服务错误: ${errorMessage}`;
        }
    }
}
exports.AIService = AIService;
//# sourceMappingURL=ai-service.js.map