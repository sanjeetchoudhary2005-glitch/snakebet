import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { prisma } from '@/lib/prisma';
import { generateSeed, hashSeed, hmacRandom } from '@/lib/provably-fair';
import { getOnlineUserCount } from '@/lib/live-activity';
import { initTeenPatti, joinTeenPattiTable, handlePlayerAction, teenPattiGameState, getSanitizedTableState } from './teen-patti';

const WS_PORT = Number(process.env.WS_PORT || 8080);
const BROADCAST_PORT = Number(process.env.WS_BROADCAST_PORT || 8091);
const INTERNAL_SECRET = process.env.WS_INTERNAL_SECRET || 'dev-internal';

const wss = new WebSocketServer({ port: WS_PORT });

// Global game state
const gameState = {
  crash: { multiplier: 1, isRunning: false, crashPoint: 0 },
  mines: { activeGames: new Map() },
  plinko: { activeDrops: [] },
  ludo: { waitingMatches: [] as any[], activeMatches: new Map() },
  stats: { online: 0, totalGames: 0, dbOnline: 0 },
  crashHistory: [] as number[]
};

console.log(`🚀 WebSocket server running on ws://localhost:${WS_PORT}`);

function broadcastActivity(event: unknown) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'activity', data: event }));
    }
  });
}

async function refreshDbOnlineCount() {
  try {
    gameState.stats.dbOnline = await getOnlineUserCount();
  } catch (error) {
    console.warn('Failed to refresh DB online count:', error);
  }
}

http
  .createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, wsConnections: gameState.stats.online }));
      return;
    }

    if (req.method === 'POST' && req.url === '/broadcast/activity') {
      const authHeader = req.headers.authorization || '';
      if (authHeader !== `Bearer ${INTERNAL_SECRET}`) {
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const event = JSON.parse(body);
          broadcastActivity(event);
          res.writeHead(200);
          res.end('ok');
        } catch {
          res.writeHead(400);
          res.end('Invalid JSON');
        }
      });
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  })
  .listen(BROADCAST_PORT, () => {
    console.log(`📣 Activity broadcast HTTP listening on :${BROADCAST_PORT}`);
  });

setInterval(() => {
  void refreshDbOnlineCount().then(() => broadcastStats());
}, 30_000);
void refreshDbOnlineCount();

// Ludo state interface
interface LudoPlayer {
  id: string;
  matchId: string;
  userId: string;
  color: string;
  position: number[]; // 4 tokens, -1 = home, 0-51 = board
  joinedAt: Date;
}

interface LudoMatch {
  id: string;
  status: 'waiting' | 'active' | 'completed';
  betAmount: number;
  maxPlayers: number;
  winnerId: string | null;
  serverSeed: string;
  nonce: number;
  createdAt: Date;
  players: LudoPlayer[];
  currentTurnIndex: number;
  consecutiveSixes: number;
  lastDiceRoll: number;
}

// Ludo game constants
const COLORS = ['red', 'blue', 'yellow', 'green'];
const HOME_BASES: Record<string, number> = { red: 0, blue: 13, yellow: 26, green: 39 };
const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47];

// Function to broadcast to specific match
function broadcastToMatch(matchId: string, message: any) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && (client as any).matchId === matchId) {
      client.send(JSON.stringify(message));
    }
  });
}

// Function to roll dice with provable fairness
function rollLudoDice(serverSeed: string, nonce: number) {
  const rand = hmacRandom(serverSeed, '', nonce, 0);
  return Math.floor(rand * 6) + 1;
}

// Ludo game logic
function createLudoMatch(userId: string, betAmount: number) {
  const matchId = crypto.randomUUID();
  const serverSeed = generateSeed();
  const match: LudoMatch = {
    id: matchId,
    status: 'waiting',
    betAmount,
    maxPlayers: 2,
    winnerId: null,
    serverSeed,
    nonce: 0,
    createdAt: new Date(),
    players: [],
    currentTurnIndex: 0,
    consecutiveSixes: 0,
    lastDiceRoll: 0
  };
  
  gameState.ludo.waitingMatches.push(match);
  return match;
}

function joinLudoMatch(matchId: string, userId: string, client: WebSocket) {
  let match = gameState.ludo.waitingMatches.find(m => m.id === matchId);
  if (!match) return null;
  
  const availableColor = COLORS.find(c => !match.players.some((p: LudoPlayer) => p.color === c));
  if (!availableColor) return null;
  
  const player: LudoPlayer = {
    id: crypto.randomUUID(),
    matchId,
    userId,
    color: availableColor,
    position: [-1, -1, -1, -1],
    joinedAt: new Date()
  };
  
  match.players.push(player);
  (client as any).matchId = matchId;
  (client as any).userId = userId;
  (client as any).playerId = player.id;
  
  if (match.players.length === match.maxPlayers) {
    // Start match
    gameState.ludo.waitingMatches = gameState.ludo.waitingMatches.filter(m => m.id !== matchId);
    gameState.ludo.activeMatches.set(matchId, match);
    match.status = 'active';
    broadcastToMatch(matchId, { type: 'ludo', event: 'start', match });
  }
  
  return { match, player };
}

function handleLudoAction(ws: WebSocket, data: any) {
  const { action } = data;
  const playerId = (ws as any).playerId;
  const userId = (ws as any).userId;
  const matchId = (ws as any).matchId;
  const match = gameState.ludo.activeMatches.get(matchId) as LudoMatch;
  if (!match) return;
  
  switch (action) {
    case 'roll': {
      const currentPlayer = match.players[match.currentTurnIndex];
      if (currentPlayer.userId !== userId) return;
      
      const diceValue = rollLudoDice(match.serverSeed, match.nonce);
      match.nonce++;
      match.lastDiceRoll = diceValue;
      
      if (diceValue === 6) {
        match.consecutiveSixes++;
        if (match.consecutiveSixes === 3) {
          // Three consecutive sixes: lose turn, reset
          match.consecutiveSixes = 0;
          match.lastDiceRoll = 0;
          match.currentTurnIndex = (match.currentTurnIndex + 1) % match.players.length;
        }
      } else {
        match.consecutiveSixes = 0;
      }
      
      // Check if the player has any valid moves; if not, auto-skip turn
      let hasValidMove = false;
      if (match.lastDiceRoll > 0) {
        for (let t = 0; t < 4; t++) {
          const pos = currentPlayer.position[t];
          if (pos === 100) continue; // already finished
          if (pos === -1 && match.lastDiceRoll === 6) { hasValidMove = true; break; }
          if (pos >= 0 && pos < 100) { hasValidMove = true; break; }
        }
        if (!hasValidMove) {
          // No valid moves, skip turn
          match.lastDiceRoll = 0;
          match.currentTurnIndex = (match.currentTurnIndex + 1) % match.players.length;
        }
      }
      
      broadcastToMatch(matchId, {
        type: 'ludo',
        event: 'roll',
        diceValue,
        match,
        hasValidMove
      });
      
      break;
    }
    case 'move': {
      const movePlayer = match.players[match.currentTurnIndex];
      if (movePlayer.userId !== userId) return;
      
      const tokenIdx = data.tokenIndex;
      if (tokenIdx < 0 || tokenIdx > 3) return;
      
      const currentPos = movePlayer.position[tokenIdx];
      const dice = match.lastDiceRoll;
      
      if (dice === 0) return; // No dice rolled yet
      
      // Token at home, need 6 to come out
      if (currentPos === -1) {
        if (dice !== 6) return;
        movePlayer.position[tokenIdx] = HOME_BASES[movePlayer.color];
      } else if (currentPos === 100) {
        return; // Already finished
      } else {
        // Calculate new position
        const homeBase = HOME_BASES[movePlayer.color];
        // Calculate distance traveled from home base
        const distanceTraveled = (currentPos - homeBase + 52) % 52;
        const newDistance = distanceTraveled + dice;
        
        if (newDistance >= 52) {
          // Reached home/finished
          movePlayer.position[tokenIdx] = 100;
        } else {
          const newPos = (homeBase + newDistance) % 52;
          movePlayer.position[tokenIdx] = newPos;
          
          // Check for captures
          if (!SAFE_SPOTS.includes(newPos)) {
            for (const otherPlayer of match.players) {
              if (otherPlayer.userId === movePlayer.userId) continue;
              for (let t = 0; t < 4; t++) {
                if (otherPlayer.position[t] === newPos) {
                  otherPlayer.position[t] = -1; // Send home
                }
              }
            }
          }
        }
      }
      
      // Reset dice after move
      match.lastDiceRoll = 0;
      
      // Advance turn (extra turn on 6 is already handled – consecutiveSixes stays)
      if (dice !== 6) {
        match.currentTurnIndex = (match.currentTurnIndex + 1) % match.players.length;
      }
      
      // Check for win
      const allFinished = movePlayer.position.every(p => p === 100);
      if (allFinished) {
        match.status = 'completed';
        match.winnerId = movePlayer.userId;
        broadcastToMatch(matchId, {
          type: 'ludo',
          event: 'finished',
          match,
          winner: { userId: movePlayer.userId, color: movePlayer.color }
        });
        gameState.ludo.activeMatches.delete(matchId);
      } else {
        broadcastToMatch(matchId, {
          type: 'ludo',
          event: 'moved',
          match,
          tokenIndex: tokenIdx,
          playerId: movePlayer.userId
        });
      }
      break;
    }
  }
}

function broadcastStats() {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'stats',
        data: gameState.stats
      }));
    }
  });
}

function broadcastCrashUpdate(type: string, value: number) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'crash', event: type, value }));
    }
  });
}

function broadcastLobbyUpdate() {
  const payload = JSON.stringify({
    type: 'lobby_update',
    ludoWaitingMatches: gameState.ludo.waitingMatches.map(m => ({
      id: m.id, betAmount: m.betAmount, playerCount: m.players.length }))
  });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Handle game actions
function handleGameAction(ws: WebSocket, data: any) {
  if (data.game === 'ludo') {
    handleLudoAction(ws, data);
    return;
  }
  
  switch (data.action) {
    case 'cashout':
      console.log('Cashout:', data);
      break;
    case 'bet':
      console.log('Bet placed:', data);
      break;
    default:
      console.log('Unknown action:', data.action);
  }
}

initTeenPatti(
  (tableId, message) => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && (client as any).tpTableId === tableId) {
        client.send(JSON.stringify(message));
      }
    });
  },
  (userId, message) => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && (client as any).userId === userId) {
        client.send(JSON.stringify(message));
      }
    });
  }
);

wss.on('connection', (ws) => {
  gameState.stats.online++;
  console.log('📡 New connection. Online:', gameState.stats.online);
  
  // Send initial state
  ws.send(JSON.stringify({
    type: 'crash',
    event: 'init',
    value: gameState.crash.multiplier,
    history: gameState.crashHistory,
    ludoWaitingMatches: gameState.ludo.waitingMatches.map(m => ({
      id: m.id, betAmount: m.betAmount, playerCount: m.players.length }))
  }));
  
  broadcastStats();
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.game === 'ludo' && data.action === 'create') {
        const match = createLudoMatch(data.userId, data.betAmount);
        const result = joinLudoMatch(match.id, data.userId, ws);
        if (result) {
          ws.send(JSON.stringify({ type: 'ludo', event: 'joined', ...result }));
          broadcastLobbyUpdate();
        }
      } else if (data.game === 'ludo' && data.action === 'join') {
        const result = joinLudoMatch(data.matchId, data.userId, ws);
        if (result) {
          ws.send(JSON.stringify({ type: 'ludo', event: 'joined', ...result }));
          broadcastLobbyUpdate();
        }
      } else if (data.game === 'teen-patti' && data.action === 'join') {
        const table = await joinTeenPattiTable(data.userId, data.username, data.bootAmount);
        (ws as any).userId = data.userId;
        (ws as any).tpTableId = table.id;
        ws.send(JSON.stringify({ type: 'tp_game', event: 'state', table: getSanitizedTableState(table, data.userId) }));
      } else if (data.game === 'teen-patti') {
        handlePlayerAction((ws as any).tpTableId, (ws as any).userId, data.action, data.amount);
      } else {
        handleGameAction(ws, data);
      }
    } catch (err) {
      console.error('❌ Invalid message:', err);
    }
  });
  
  ws.on('close', () => {
    gameState.stats.online--;
    console.log('👋 Connection closed. Online:', gameState.stats.online);
    broadcastStats();
  });
});

// CRASH GAME LOOP – runs 24/7
function crashLoop() {
  let tickCount = 0;
  
  setInterval(() => {
    if (!gameState.crash.isRunning) {
      // Start new round
      gameState.crash.crashPoint = 1 + Math.random() * 99;
      gameState.crash.multiplier = 1;
      gameState.crash.isRunning = true;
      tickCount = 0;
      broadcastCrashUpdate('start', gameState.crash.crashPoint);
    }
    
    if (gameState.crash.isRunning) {
      // Exponential multiplier growth
      tickCount++;
      gameState.crash.multiplier = 1 + (tickCount / 100) * 1.5;
      
      if (gameState.crash.multiplier >= gameState.crash.crashPoint) {
        gameState.crash.isRunning = false;
        gameState.crashHistory = [gameState.crash.crashPoint, ...gameState.crashHistory].slice(0, 20);
        broadcastCrashUpdate('crash', gameState.crash.crashPoint);
      } else {
        broadcastCrashUpdate('update', gameState.crash.multiplier);
      }
    }
  }, 50); // 50ms = 20 FPS
}

crashLoop();