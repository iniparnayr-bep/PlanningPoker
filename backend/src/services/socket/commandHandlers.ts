import {gatherContextInformation, sendMessageToAi} from "../ai/ai-service.js";
import {sendAiCommandResponse} from "./socketSendService.js";
import {checkAiRateLimit, recordAiCall, aiRateLimitStats} from "../aiRateLimit.js";
import {log} from "../logger.js";

export function handleAsk(command: string, socketId: string) {
    const limit = checkAiRateLimit(socketId);
    if (!limit.allowed) {
        sendAiCommandResponse(socketId, `⚠️ ${limit.reason}`);
        return;
    }
    const contextInformation = gatherContextInformation(socketId);
    if (!contextInformation) return;

    sendAiCommandResponse(socketId, "Thinking...");
    sendMessageToAi(command, contextInformation, "ask").then(res => {
        recordAiCall(socketId);
        log(`AI /ask served. Stats: ${JSON.stringify(aiRateLimitStats())}`);
        sendAiCommandResponse(socketId, res);
    });
}

export function handleEstimation(command: string, socketId: string) {
    const limit = checkAiRateLimit(socketId);
    if (!limit.allowed) {
        sendAiCommandResponse(socketId, `⚠️ ${limit.reason}`);
        return;
    }
    const contextInformation = gatherContextInformation(socketId);
    if (!contextInformation) return;

    sendAiCommandResponse(socketId, "Estimating...");
    sendMessageToAi(command, contextInformation, "estimation").then(res => {
        recordAiCall(socketId);
        log(`AI /estimate served. Stats: ${JSON.stringify(aiRateLimitStats())}`);
        sendAiCommandResponse(socketId, res);
    });
}
