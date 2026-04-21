import Anthropic from '@anthropic-ai/sdk';
import {sendMessageStrFromServer} from "../socket/socketSendService.js";
import {getPlayerTokenFromSocketId} from "../socket/socketDataService.js";
import {getSessionByToken, getSessionTokenByPlayerToken} from "../sessionService.js";
import {EstimationOption, FibonacciEstimationValues} from "../../models/SessionModel.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface SessionInformation {
    estimationOptions: EstimationOption;
    estimationValues: string[];
}
interface ContextInformation {
    sessionToken: string;
    userToken: string;
    socketId: string;
    sessionInformation: SessionInformation;
}

export function gatherContextInformation(socketId: string): ContextInformation | null {
    const userToken = getPlayerTokenFromSocketId(socketId);
    if (!userToken) {
        sendMessageStrFromServer(socketId, "error");
        return null;
    }
    const sessionToken = getSessionTokenByPlayerToken(userToken);
    if (!sessionToken) {
        sendMessageStrFromServer(socketId, "error");
        return null;
    }
    const session = getSessionByToken(sessionToken);

    const sessionInformation: SessionInformation = {
        estimationOptions: session?.estimationOptions ?? EstimationOption.Fibonacci,
        estimationValues: session?.estimationValues ?? FibonacciEstimationValues,
    };

    return { sessionToken, userToken, sessionInformation, socketId } as ContextInformation;
}

export async function sendMessageToAi(
    message: string,
    context: ContextInformation,
    command: string
): Promise<string> {
    const { sessionInformation } = context;

    let systemPrompt: string;

    if (command === 'estimation') {
        systemPrompt = `You are an agile planning poker assistant helping a team estimate story points.
The team is using the following estimation scale: ${sessionInformation.estimationValues.join(', ')}.
When asked to estimate a task or user story, respond with ONLY a single value from that scale — no explanation, no punctuation, just the value.
If the task is unclear, pick the closest reasonable estimate from the scale.`;
    } else {
        // 'ask' or any other command
        systemPrompt = `You are a helpful agile planning assistant inside a planning poker session.
The team is using the ${sessionInformation.estimationOptions} estimation scale with values: ${sessionInformation.estimationValues.join(', ')}.
Answer questions concisely and helpfully. Keep responses short — this is a chat interface.`;
    }

    // Strip the command prefix (e.g. "ask " or "estimation ") from the message
    const userMessage = message.replace(/^(ask|estimation)\s*/i, '').trim();

    try {
        const response = await anthropic.messages.create({
            model: 'claude-haiku-4-6',
            max_tokens: 256,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
        });
        return (response.content[0] as any).text ?? 'No response';
    } catch (error: any) {
        console.error('Anthropic error:', error?.message ?? error);
        return 'AI unavailable';
    }
}
