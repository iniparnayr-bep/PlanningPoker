import {Server} from "socket.io";
import http from "http";
import express from "express";
import {Message} from "../../models/Message.model";
import {handleNewChatMessage} from "./chat-service.js";
import {
    getPlayerTokenFromSocketId,
    socketPlayers,
    storePlayerToken,
} from "./socketDataService.js";
import {getPlayerByToken} from "../sessionService.js";
import {registerSocketIp, unregisterSocket} from "../aiRateLimit.js";
export const app = express();
export const server = http.createServer(app);

console.log(`${process.env.PROTOCOL}://${process.env.DOMAIN}`);
export const io = new Server(server, {
    cors: {
        origin: [`${process.env.PROTOCOL}://${process.env.DOMAIN}`, "http://localhost"],
    }
});

io.on('connection', (socket) => {
    // Store IP at connection time for rate limiting
    const ip = (socket.handshake.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        ?? socket.handshake.address
        ?? 'unknown';
    registerSocketIp(socket.id, ip);
    socket.on('joinSession', (sessionToken, playertoken) => {
        if (!playertoken || !sessionToken) return;
        // Security: verify this player token actually belongs to this session
        // Spectators (no playertoken in URL) pass undefined playertoken — allow them to join the room channel
        const player = getPlayerByToken(playertoken, sessionToken);
        if (!player) {
            // Could be spectator — allow joining the socket room for updates, but don't store a player token
            socket.join(sessionToken);
            return;
        }
        socket.join(sessionToken);
        storePlayerToken(playertoken, socket.id);
    });
    socket.on('chat', (message: Message) => {
        handleNewChatMessage(socket.id, message)
    });
    socket.on('leaveSession', (token) => {
        const playerToken = getPlayerTokenFromSocketId(socket.id);
        if (playerToken) {
            delete socketPlayers[playerToken];
        }
    });
    socket.on('disconnect', () => {
        const playerToken = getPlayerTokenFromSocketId(socket.id);
        if (playerToken) {
            delete socketPlayers[playerToken];
        }
        unregisterSocket(socket.id);
    });
});
