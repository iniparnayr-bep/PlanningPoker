import {
    EstimationOption,
    FibonacciEstimationValues, getEstimationValues,
    NewSessionDto,
    parseEstimationType,
    Session
} from "../models/SessionModel.js";
import {Player} from "../models/PlayerModel.js";
import {nanoid} from "nanoid";
import express from "express";
import {
    checkIsOwnerById,
    checkIsOwnerByToken,
    clearSessionDeletion,
    getPlayerById,
    getPlayerByToken,
    getSessionByToken,
    getSessionInfo,
    kick,
    mapPersonalPlayerExport,
    playerLeave,
    sessions,
    setPlayerTimers,
    shake,
    throwEmojiAt
} from "../services/sessionService.js";
import {debug} from "../index.js";
import {io} from "../services/socket/socketService.js";
import {validateEstimate} from "../services/validationService.js";
import {createAndSendHistogram} from "../models/EstimationHistogram.js";
import {log, logSesstionDetails} from "../services/logger.js";
import {
    sendHistogramToSession,
    sendMessageStrFromServer
} from "../services/socket/socketSendService.js";
import {socketPlayers} from "../services/socket/socketDataService.js";

const router = express.Router();

router.post('/debug', (req, res) => {
    if (debug) {
        console.log(sessions);
    }
    res.send('OK');
});

router.post('/newSession', (req, res) => {
    const newSessionReq: NewSessionDto = req.body;
    const owner: Player = {
        estimate: null,
        name: newSessionReq.leaderName,
        id: nanoid(7),
        token: nanoid(25),
        isOwner: true,
        avatar: pickAvatar([]),
        lastAction: new Date(),
        timeoutIds: [],
    }
    const newSession: Session = {
        open: false,
        token: nanoid(5),
        name: newSessionReq.name,
        players: [owner],
        estimationOptions: EstimationOption.Fibonacci,
        estimationValues: FibonacciEstimationValues,
        color: 'default',
        emojisEnabled: true,
    }
    sessions.push(newSession);
    res.send(newSession);
    setPlayerTimers(newSession.token, owner.token);
    logSesstionDetails(newSession.token, 'new session created');
});

router.post('/joinSession/:token', (req, res) => {
    const token = req.params.token;
    const sessionForAvatar = sessions.find(s => s.token === token);
    const player: Player = {
        name: req.body.name,
        id: nanoid(7),
        estimate: null,
        token: nanoid(25),
        isOwner: false,
        avatar: pickAvatar(sessionForAvatar ? sessionForAvatar.players.map(p => p.avatar) : []),
        lastAction: new Date(),
        timeoutIds: [],
    };
    const session = sessions.find((session) => session.token === token);
    if (session) {
        if (session.players.length == 0) {
            player.isOwner = true;
        }
        session.players.push(player);
        io.to(token).emit('playerJoined', getSessionInfo(token));
        res.send(player);
        setPlayerTimers(token, player.token);
        sendMessageStrFromServer(token, player.name + ' joined the session.');
        logSesstionDetails(token, player.name + ' joined session ' + token);
        clearSessionDeletion(session);
    }
    else {
        res.status(404).send('Session not found');
    }
});

router.post('/leaveSession/:token', (req, res) => {
    const token = req.params.token;
    const playerToken = req.body.token;
    const player = getPlayerByToken(playerToken, token);
    try {
        playerLeave(token, playerToken);
        res.send('OK');
        logSesstionDetails(token, (player?.name ?? '?') + ' left session ' + token);
    } catch (e: any) {
        res.status(404).send(e.message);
    }
});

// looks up is a session is closed and sends ExportUser oder ExportEstimateUser
router.get('/getSession/:token', (req, res) => {
    const token = req.params.token;
    const session = getSessionInfo(token);
    if (session) {
        res.send(session);
        return;
    }
    else {
        res.status(404).send('Session not found');
    }
});

router.put('/estimate/:token', (req, res) => {
    const token = req.params.token;
    const playerToken = req.body.token;
    const estimate = req.body.estimate;
    const session = getSessionByToken(token);

    if (!session) {
        res.status(404).send('Session not found');
        return;
    }

    if (!validateEstimate(estimate, session)) {
        res.status(400).send('Estimate not allowed');
        return;
    }

    if (session) {
        const player = getPlayerByToken(playerToken, token);
        if (player) {
            player.estimate = estimate;
            player.lastAction = new Date();
            io.to(token).emit('playerEstimated', getSessionInfo(token));
            res.send('OK');
            setPlayerTimers(token, playerToken);
            if (session.open) {
                createAndSendHistogram(session, token);
            }
        }
        else {
            res.status(404).send('Player not found');
        }
    }
    else {
        res.status(404).send('Session not found');
    }
});

router.put('/changeEstimationOptions/:token', (req, res) => {
    const sessionToken = req.params.token;
    const userToken = req.body.userToken;

    let estimationOptions = req.body.custom;
    const estimationTypeString = req.body.estimationType;
    const estimationType = parseEstimationType(estimationTypeString);

    const session = getSessionByToken(sessionToken);

    if (!estimationType) {
        res.status(400).send('Invalid estimation type');
        return;
    }

    if (estimationType === EstimationOption.Custom && (!estimationOptions || estimationOptions.length === 0)) {
        res.status(400).send('Custom estimation type requires options');
        return;
    }

    if (estimationType !== EstimationOption.Custom) {
        estimationOptions = getEstimationValues(estimationType);
    }

    if (session) {
        const isOwner = checkIsOwnerByToken(userToken, session);
        if (!isOwner) {
            res.status(403).send('Not owner');
            return;
        }
        session.estimationOptions = estimationType;
        session.estimationValues = estimationOptions;
        session.players.forEach((player) => {
            player.estimate = null;
        });
        io.to(sessionToken).emit('estimationOptionsChanged', getSessionInfo(sessionToken));
        res.send('OK');
    }
    else {
        res.status(404).send('Session not found');
    }
});

router.put('/openSession/:token/:open', (req, res) => {
    const token = req.params.token;
    const userToken = req.body.token;
    const open = req.params.open === 'true';
    const session = getSessionByToken(token);
    const isInSession = session?.players.find((player) => player.token === userToken) !== undefined;
    if (!isInSession) {
        res.status(403).send('Not in session');
        return;
    }
    const isOwner = checkIsOwnerByToken(userToken, session);
    if (!isOwner) {
        res.status(403).send('Not owner');
        return;
    }
    if (session) {
        session.open = open;
        if (!open) {
            session.players.forEach((player) => {
                player.estimate = null;
            });
            sendHistogramToSession(token, {estimationCount: {}});
        }
        else {
            createAndSendHistogram(session, token);
        }
        setPlayerTimers(token, userToken);
        io.to(token).emit('sessionOpened', getSessionInfo(token));
        log('Session opened: ' + token + ' - ' + open);
        res.send('OK');
    }
    else {
        res.status(404).send('Session not found');
    }
});

router.get('/isOwner/:token/:sessionToken', (req, res) => {
    const token = req.params.token;
    const sessionToken = req.params.sessionToken;
    const session = getSessionByToken(sessionToken);
    if (session) {
        const player = getPlayerByToken(token, sessionToken);
        if (player) {
            res.send(player.isOwner);
        }
        else {
            res.status(404).send('Player not found');
        }
    }
    else {
        res.status(404).send('Session not found');
    }
});

router.get('/pullUserInfo/:token/:sessionToken', (req, res) => {
    const token = req.params.token;
    const sessionToken = req.params.sessionToken;
    const session = getSessionByToken(sessionToken);

    if (session) {
        const player = getPlayerByToken(token, sessionToken);
        if (player) {
            res.send(mapPersonalPlayerExport(player));
        }
        else {
            res.status(404).send('Player not found');
        }
    }
    else {
        res.status(404).send('Session not found');
    }
});

router.post('/kickPlayer/:id/:sessionToken', (req, res) => {
    const kickId = req.params.id;
    const sessionToken = req.params.sessionToken;
    const playerToken = req.body.userToken;
    const session = getSessionByToken(sessionToken);
    if (!session) {
        res.status(404).send('Session not found');
        return;
    }
    const player = getPlayerByToken(playerToken, sessionToken);
    const isOwner = checkIsOwnerByToken(playerToken, session!);

    if (!isOwner) {
        res.status(403).send('Not owner');
        return;
    }

    const playerToKickIsOwner = checkIsOwnerById(kickId, session!);
    if (playerToKickIsOwner) {
        res.status(400).send('You can not kick yourself.');
        return;
    }

    if (!player) {
        res.status(404).send('Player not found');
        return;
    }
    const playerToKick = getPlayerById(kickId, session!.token);
    if (playerToKick) {
        kick(playerToKick, sessionToken);
        log('Player kicked: ' + playerToKick.name);
    }
    else {
        res.status(404).send('Player not found');
    }
    res.send('OK');
});

router.post('/shake/:id/:sessionToken', (req, res) => {
    const playerToken = req.body.userToken;
    const sessionToken = req.params.sessionToken;
    const shakeId = req.params.id;
    const session = getSessionByToken(sessionToken);
    if (!session) {
        res.status(404).send('Session not found');
        return;
    }
    const player = getPlayerByToken(playerToken, sessionToken);
    const shakePlayer = getPlayerById(shakeId, sessionToken);
    if (!player) {
        res.status(404).send('Player not found');
        return;
    }
    if (!shakePlayer) {
        res.status(404).send('Player to shake not found');
        return;
    }
    shake(shakePlayer);
    res.send('OK');
});

router.put('/makeAdmin/:sessionToken/:otherPlayerId', (req, res) => {
    const sessionToken = req.params.sessionToken;
    const otherPlayerId = req.params.otherPlayerId;
    const playerToken = req.body.userToken;
    const session = getSessionByToken(sessionToken);
    if (!session) {
        res.status(404).send('Session not found');
        return;
    }
    const player = getPlayerByToken(playerToken, sessionToken);
    const otherPlayer = getPlayerById(otherPlayerId, sessionToken);
    if (!player) {
        res.status(404).send('Player not found');
        return;
    }
    if (!otherPlayer) {
        res.status(404).send('Player to make admin not found');
        return;
    }
    if (!player.isOwner) {
        res.status(403).send('Not owner');
        return;
    }
    otherPlayer.isOwner = true;
    player.isOwner = false;
    io.to(socketPlayers[otherPlayer.token]).emit('updateUserinfo');
    io.to(socketPlayers[player.token]).emit('updateUserinfo');
    sendMessageStrFromServer(sessionToken, otherPlayer.name + ' is now the session leader.');
    log('Admin changed: ' + otherPlayer.name);
    res.send('OK');
});

router.post('/throw/:id/:sessionToken', (req, res) => {
    const playerToken = req.body.userToken;
    const emoji = req.body.emoji;
    const sessionToken = req.params.sessionToken;
    const shakeId = req.params.id;
    const session = getSessionByToken(sessionToken);
    if (!session) {
        res.status(404).send('Session not found');
        return;
    }
    const player = getPlayerByToken(playerToken, sessionToken);
    const throwPlayer = getPlayerById(shakeId, sessionToken);
    if (!player) {
        res.status(404).send('Player not found');
        return;
    }
    if (!throwPlayer) {
        res.status(404).send('Player to throw paper at not found');
        return;
    }
    throwEmojiAt(session, throwPlayer, emoji);
    res.send('OK');
});

// ── PUT /session/:token/color ──
router.put('/session/:token/color', (req, res) => {
    const sessionToken = req.params.token;
    const userToken = req.body.userToken;
    const color = req.body.color;
    const allowed = ['default', 'purple', 'blue', 'green', 'gray', 'red', 'dark'];
    if (!allowed.includes(color)) return res.status(400).send('Invalid color');

    const session = getSessionByToken(sessionToken);
    if (!session) return res.status(404).send('Session not found');
    if (!checkIsOwnerByToken(userToken, session)) return res.status(403).send('Not owner');

    session.color = color;
    io.to(sessionToken).emit('sessionSettings', getSessionInfo(sessionToken));
    res.send('OK');
});

// ── PUT /session/:token/emojis ──
router.put('/session/:token/emojis', (req, res) => {
    const sessionToken = req.params.token;
    const userToken = req.body.userToken;
    const enabled = !!req.body.enabled;

    const session = getSessionByToken(sessionToken);
    if (!session) return res.status(404).send('Session not found');
    if (!checkIsOwnerByToken(userToken, session)) return res.status(403).send('Not owner');

    session.emojisEnabled = enabled;
    io.to(sessionToken).emit('sessionSettings', getSessionInfo(sessionToken));
    res.send('OK');
});

// ── PUT /session/:token/rename ──
router.put('/session/:token/rename', (req, res) => {
    const sessionToken = req.params.token;
    const userToken = req.body.userToken;
    const name = (req.body.name || '').toString().trim();
    if (!name) return res.status(400).send('Name required');
    if (name.length > 60) return res.status(400).send('Name too long');

    const session = getSessionByToken(sessionToken);
    if (!session) return res.status(404).send('Session not found');
    if (!checkIsOwnerByToken(userToken, session)) return res.status(403).send('Not owner');

    session.name = name;
    io.to(sessionToken).emit('sessionSettings', getSessionInfo(sessionToken));
    res.send('OK');
});

// ── PUT /player/rename/:token ── (player updates name and/or avatar in a session)
router.put('/player/rename/:token', (req, res) => {
    const sessionToken = req.params.token;
    const userToken = req.body.userToken;
    const name = req.body.name !== undefined ? (req.body.name || '').toString().trim() : undefined;
    const avatar = req.body.avatar !== undefined ? (req.body.avatar || '').toString().trim() : undefined;

    const session = getSessionByToken(sessionToken);
    if (!session) return res.status(404).send('Session not found');

    const player = getPlayerByToken(userToken, sessionToken);
    if (!player) return res.status(404).send('Player not found');

    if (name !== undefined) {
        if (!name) return res.status(400).send('Name required');
        if (name.length > 50) return res.status(400).send('Name too long (max 50)');
        const taken = session.players.some(p => p.token !== userToken && p.name === name);
        if (taken) return res.status(409).send('Name already taken in this session');
        player.name = name;
    }
    if (avatar !== undefined) {
        if (avatar.length > 8) return res.status(400).send('Avatar too long');
        player.avatar = avatar || pickAvatar(session.players.filter(p => p.token !== userToken).map(p => p.avatar));
    }

    io.to(sessionToken).emit('playerJoined', getSessionInfo(sessionToken));
    io.to(socketPlayers[player.token]).emit('updateUserinfo');
    if (name !== undefined) {
        sendMessageStrFromServer(sessionToken, 'A player changed their name to ' + name + '.');
    }
    log('Player updated: ' + player.name + ' in ' + sessionToken);
    res.send('OK');
});

// Pick a default avatar emoji not currently used by anyone else in the session
function pickAvatar(used: string[]): string {
    const pool = [
        '🦊','🐯','🦁','🐼','🐻','🐨','🐾','🦖',
        '🐙','🦀','🐬','🐠','🐧','🦆','🦉','🐔',
        '🦄','🐉','🐲','🐳','🐍','🐢','🦎','🦝',
        '🐝','🐞','🐛','🦋','🕵','👨‍🎨',
        '🚀','⭐','🌈','🔥','❄️','⚡','🌊','🌺',
    ];
    const available = pool.filter(a => !used.includes(a));
    const candidates = available.length ? available : pool;
    return candidates[Math.floor(Math.random() * candidates.length)];
}

router.get('/currentActiveSessions', (req, res) => {
    const activeSessions = sessions.filter((session) => session.players.length > 0);
    const totalSessions = sessions.length;
    res.send({
        total: totalSessions,
        active: activeSessions.length,
    });
});

export default router;
