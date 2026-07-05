import { WebSocket } from 'ws';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { generateSeed, shuffle } from '@/lib/provably-fair';
import { settleTeenPattiRound } from '@/lib/wallet';

// Types
export type GamePhase = "waiting" | "dealing" | "blind_round" | "active_round" | "showdown" | "settled";
export type PlayerAction = "pack" | "blind" | "seen" | "chaal" | "raise" | "sideshow" | "show";

export interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: string;
  value: number;
}

export interface Player {
  id: string; // generated ID or userId
  userId: string | null; // null for bots
  name: string;
  avatar: string;
  seatIndex: number;
  isBot: boolean;
  balance: number; // local tracked balance for the session if needed
  betAmount: number;
  cards: Card[] | null;
  hasSeen: boolean;
  isFolded: boolean;
  isActive: boolean;
}

export interface TeenPattiState {
  id: string;
  bootAmount: number;
  maxPlayers: number;
  status: GamePhase;
  currentPot: number;
  currentStake: number;
  players: Player[];
  currentTurnIndex: number;
  winnerId: string | null;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  turnTimeout: NodeJS.Timeout | null;
  turnEndsAt: number | null;
  roundId: string | null;
  lastActionAt: number;
  sideshowTargetIndex?: number | null;
  sideshowRequestBy?: number | null;
}

const TURN_TIME_MS = 25000;
const BOT_NAMES = ["Raja", "Rani", "Prince", "Don", "King", "Guru"];

export const teenPattiGameState = {
  activeTables: new Map<string, TeenPattiState>(),
};

// Evaluate hand rank
export const evaluateHand = (cards: Card[]): { rank: number; name: string; sortedCards: Card[] } => {
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const values = sorted.map((c) => c.value);
  const suits = sorted.map((c) => c.suit);

  const isTrail = values[0] === values[1] && values[1] === values[2];
  const isPureSequence =
    suits[0] === suits[1] &&
    suits[1] === suits[2] &&
    ((values[0] - values[1] === 1 && values[1] - values[2] === 1) ||
      (values[0] === 14 && values[1] === 3 && values[2] === 2)); // A-2-3
  const isSequence =
    (values[0] - values[1] === 1 && values[1] - values[2] === 1) ||
    (values[0] === 14 && values[1] === 3 && values[2] === 2);
  const isColor = suits[0] === suits[1] && suits[1] === suits[2];
  const isPair = values[0] === values[1] || values[1] === values[2] || values[0] === values[2];

  if (isTrail) return { rank: 6, name: "Trail", sortedCards: sorted };
  if (isPureSequence) return { rank: 5, name: "Pure Sequence", sortedCards: sorted };
  if (isSequence) return { rank: 4, name: "Sequence", sortedCards: sorted };
  if (isColor) return { rank: 3, name: "Color", sortedCards: sorted };
  if (isPair) return { rank: 2, name: "Pair", sortedCards: sorted };
  return { rank: 1, name: "High Card", sortedCards: sorted };
};

export const compareHands = (hand1: Card[], hand2: Card[]): "hand1" | "hand2" | "tie" => {
  const eval1 = evaluateHand(hand1);
  const eval2 = evaluateHand(hand2);

  if (eval1.rank > eval2.rank) return "hand1";
  if (eval2.rank > eval1.rank) return "hand2";

  for (let i = 0; i < 3; i++) {
    if (eval1.sortedCards[i].value > eval2.sortedCards[i].value) return "hand1";
    if (eval2.sortedCards[i].value > eval1.sortedCards[i].value) return "hand2";
  }
  return "tie";
};

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  const suits = ["hearts", "diamonds", "clubs", "spades"] as const;
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  suits.forEach((suit) => {
    ranks.forEach((rank, index) => {
      deck.push({ suit, rank, value: index + 2 });
    });
  });
  return deck;
};

// A callback to inject so we can broadcast from websocket.ts
let broadcastFn: (tableId: string, message: any, excludeUserId?: string) => void;
let sendToClientFn: (userId: string, message: any) => void;

export function initTeenPatti(
  broadcast: (tableId: string, message: any, excludeUserId?: string) => void,
  sendToClient: (userId: string, message: any) => void
) {
  broadcastFn = broadcast;
  sendToClientFn = sendToClient;
}

function broadcastToTable(tableId: string, message: any) {
  if (broadcastFn) broadcastFn(tableId, message);
}

function getNextTurnIndex(table: TeenPattiState, startIdx: number): number {
  let idx = (startIdx + 1) % table.maxPlayers;
  let attempts = 0;
  while (attempts < table.maxPlayers) {
    const p = table.players.find((p) => p.seatIndex === idx);
    if (p && !p.isFolded && p.isActive) return idx;
    idx = (idx + 1) % table.maxPlayers;
    attempts++;
  }
  return startIdx;
}

function getPreviousTurnIndex(table: TeenPattiState, startIdx: number): number {
  let idx = (startIdx - 1 + table.maxPlayers) % table.maxPlayers;
  let attempts = 0;
  while (attempts < table.maxPlayers) {
    const p = table.players.find((p) => p.seatIndex === idx);
    if (p && !p.isFolded && p.isActive) return idx;
    idx = (idx - 1 + table.maxPlayers) % table.maxPlayers;
    attempts++;
  }
  return startIdx;
}

function countActive(table: TeenPattiState): number {
  return table.players.filter(p => !p.isFolded && p.isActive).length;
}

export function createTeenPattiTable(bootAmount: number): TeenPattiState {
  const id = crypto.randomUUID();
  const table: TeenPattiState = {
    id,
    bootAmount,
    maxPlayers: 6,
    status: "waiting",
    currentPot: 0,
    currentStake: bootAmount,
    players: [],
    currentTurnIndex: 0,
    winnerId: null,
    serverSeed: generateSeed(),
    clientSeed: crypto.randomBytes(16).toString('hex'),
    nonce: 0,
    turnTimeout: null,
    turnEndsAt: null,
    roundId: null,
    lastActionAt: Date.now(),
  };
  teenPattiGameState.activeTables.set(id, table);
  return table;
}

function addBotsToTable(table: TeenPattiState) {
  const filledSeats = new Set(table.players.map(p => p.seatIndex));
  let botCount = 0;
  for (let i = 0; i < table.maxPlayers; i++) {
    if (!filledSeats.has(i)) {
      table.players.push({
        id: `bot_${crypto.randomUUID()}`,
        userId: null,
        name: BOT_NAMES[botCount % BOT_NAMES.length],
        avatar: "",
        seatIndex: i,
        isBot: true,
        balance: 100000,
        betAmount: 0,
        cards: null,
        hasSeen: false,
        isFolded: false,
        isActive: true
      });
      botCount++;
    }
  }
  table.players.sort((a, b) => a.seatIndex - b.seatIndex);
}

export function getSanitizedTableState(table: TeenPattiState, viewerUserId: string | null = null) {
  return {
    ...table,
    turnTimeout: undefined,
    serverSeed: undefined,
    players: table.players.map(p => ({
      ...p,
      cards: (p.userId === viewerUserId || table.status === "showdown" || table.status === "settled") ? p.cards : (p.cards ? [{suit:'?',rank:'?',value:0},{suit:'?',rank:'?',value:0},{suit:'?',rank:'?',value:0}] : null)
    }))
  };
}

export async function joinTeenPattiTable(userId: string, username: string, bootAmount: number) {
  // Find table or create
  let table = Array.from(teenPattiGameState.activeTables.values()).find(
    (t) => t.bootAmount === bootAmount && t.status === "waiting" && t.players.length < t.maxPlayers && !t.players.some(p => p.userId === userId)
  );

  if (!table) {
    table = createTeenPattiTable(bootAmount);
  }

  // Find empty seat
  const filledSeats = new Set(table.players.map(p => p.seatIndex));
  let seatIndex = 0;
  // Prefer seat 5 for user if available for aesthetics, otherwise find first
  if (!filledSeats.has(5)) seatIndex = 5;
  else {
    while (filledSeats.has(seatIndex) && seatIndex < table.maxPlayers) {
      seatIndex++;
    }
  }

  const player: Player = {
    id: crypto.randomUUID(),
    userId,
    name: username,
    avatar: "",
    seatIndex,
    isBot: false,
    balance: 0,
    betAmount: 0,
    cards: null,
    hasSeen: false,
    isFolded: false,
    isActive: true
  };
  table.players.push(player);
  
  if (table.players.filter(p => !p.isBot).length >= 1) { // Auto start with 1 user in 3 secs
      setTimeout(() => {
        if (table.status === 'waiting') {
           startGame(table.id);
        }
      }, 3000);
  }

  return table;
}

async function startGame(tableId: string) {
  const table = teenPattiGameState.activeTables.get(tableId);
  if (!table) return;
  if (table.status !== 'waiting') return;

  addBotsToTable(table);

  table.status = "dealing";
  table.winnerId = null;
  table.players.forEach(p => {
    p.betAmount = table.bootAmount;
    p.cards = null;
    p.hasSeen = false;
    p.isFolded = false;
    p.isActive = true;
  });
  table.currentPot = table.bootAmount * table.players.length;
  table.currentStake = table.bootAmount;
  
  // Actually create a round in DB
  const round = await prisma.teenPattiRound.create({
    data: {
      tableId: table.id, // using random string for tableId since it's transient in this implementation, but it shouldn't fail if we don't strictly enforce fkey or we just don't create it in db
      pot: table.currentPot,
      serverSeed: table.serverSeed,
      serverSeedHash: crypto.createHash('sha256').update(table.serverSeed).digest('hex'),
      clientSeed: table.clientSeed,
      nonce: table.nonce,
    }
  }).catch(() => null);

  if (round) table.roundId = round.id;

  const deck = shuffle(createDeck(), table.serverSeed, table.clientSeed, table.nonce);
  table.nonce++;

  table.players.forEach(p => {
    p.cards = [deck.pop()!, deck.pop()!, deck.pop()!];
  });

  broadcastToTable(table.id, { type: 'tp_game', event: 'dealt', table: getSanitizedTableState(table) });

  setTimeout(() => {
    table.status = "blind_round";
    table.currentTurnIndex = table.players.find(p => !p.isFolded)?.seatIndex || 0;
    startTurn(table);
  }, 2000);
}

function startTurn(table: TeenPattiState) {
  table.turnEndsAt = Date.now() + TURN_TIME_MS;
  if (table.turnTimeout) clearTimeout(table.turnTimeout);
  
  broadcastToTable(table.id, { type: 'tp_game', event: 'turn', table: getSanitizedTableState(table) });

  const currentPlayer = table.players.find(p => p.seatIndex === table.currentTurnIndex);
  
  if (currentPlayer?.isBot) {
    const delay = 2000 + Math.random() * 3000;
    table.turnTimeout = setTimeout(() => {
      handleBotTurn(table, currentPlayer);
    }, delay);
  } else {
    table.turnTimeout = setTimeout(() => {
      // Auto fold
      handlePlayerAction(table.id, currentPlayer?.userId || '', 'pack');
    }, TURN_TIME_MS);
  }
}

function handleBotTurn(table: TeenPattiState, bot: Player) {
  if (bot.isFolded) return advanceTurn(table);

  if (!bot.hasSeen && Math.random() > 0.6) {
    bot.hasSeen = true;
    broadcastToTable(table.id, { type: 'tp_game', event: 'action', action: 'seen', userId: null, seatIndex: bot.seatIndex, table: getSanitizedTableState(table) });
    // Bot still needs to act after seeing
    setTimeout(() => handleBotTurn(table, bot), 1500);
    return;
  }

  const handRank = evaluateHand(bot.cards!).rank;
  let action: PlayerAction = 'chaal';
  
  if (bot.hasSeen) {
     if (handRank >= 5) {
       action = (Math.random() > 0.3) ? 'raise' : 'chaal';
     } else if (handRank >= 3) {
       action = (Math.random() > 0.7) ? 'raise' : 'chaal';
     } else if (handRank === 2) {
       action = (table.currentStake > table.bootAmount * 10 && Math.random() > 0.6) ? 'pack' : 'chaal';
     } else {
       action = 'pack';
     }
  } else {
     // Blind bot logic
     action = 'blind';
     if (table.currentStake > table.bootAmount * 4 && Math.random() > 0.7) action = 'pack';
  }

  applyAction(table, bot, action);
}

export function handlePlayerAction(tableId: string, userId: string, action: PlayerAction, amount?: number) {
  const table = teenPattiGameState.activeTables.get(tableId);
  if (!table) return;
  const player = table.players.find(p => p.userId === userId);
  if (!player || player.seatIndex !== table.currentTurnIndex || player.isFolded) return;

  applyAction(table, player, action, amount);
}

function applyAction(table: TeenPattiState, player: Player, action: PlayerAction, amount?: number) {
  if (table.turnTimeout) clearTimeout(table.turnTimeout);

  if (action === 'pack') {
    player.isFolded = true;
  } else if (action === 'seen') {
    player.hasSeen = true;
    broadcastToTable(table.id, { type: 'tp_game', event: 'action', action: 'seen', userId: player.userId, seatIndex: player.seatIndex, table: getSanitizedTableState(table) });
    startTurn(table); // Reset timer for them to act
    return;
  } else if (action === 'blind') {
    if (player.hasSeen) return; // Invalid
    player.betAmount += table.currentStake;
    table.currentPot += table.currentStake;
    table.status = "active_round";
  } else if (action === 'chaal') {
    if (!player.hasSeen) return; // Invalid
    const bet = table.currentStake * 2;
    player.betAmount += bet;
    table.currentPot += bet;
    table.status = "active_round";
  } else if (action === 'raise') {
    if (!player.hasSeen) return;
    const bet = (amount && amount > table.currentStake * 2) ? amount : table.currentStake * 4;
    table.currentStake = bet / 2; // the new base stake
    player.betAmount += bet;
    table.currentPot += bet;
    table.status = "active_round";
  } else if (action === 'show') {
    if (countActive(table) !== 2) return;
    const bet = player.hasSeen ? table.currentStake * 2 : table.currentStake;
    player.betAmount += bet;
    table.currentPot += bet;
    return processShowdown(table, player);
  } else if (action === 'sideshow') {
    // Basic sideshow logic - auto accepted for now
    const prevIdx = getPreviousTurnIndex(table, player.seatIndex);
    const prevPlayer = table.players.find(p => p.seatIndex === prevIdx);
    if (prevPlayer && countActive(table) >= 3 && prevPlayer.hasSeen && player.hasSeen) {
       const res = compareHands(player.cards!, prevPlayer.cards!);
       if (res === 'hand1' || res === 'tie') {
          prevPlayer.isFolded = true;
       } else {
          player.isFolded = true;
       }
       broadcastToTable(table.id, { type: 'tp_game', event: 'sideshow_result', table: getSanitizedTableState(table) });
    } else {
       return startTurn(table); // invalid sideshow
    }
  }

  broadcastToTable(table.id, { type: 'tp_game', event: 'action', action, userId: player.userId, seatIndex: player.seatIndex, table: getSanitizedTableState(table) });

  const activeCount = countActive(table);
  if (activeCount === 1) {
    const winner = table.players.find(p => !p.isFolded);
    processWin(table, winner!);
  } else {
    advanceTurn(table);
  }
}

function processShowdown(table: TeenPattiState, requester: Player) {
  const activePlayers = table.players.filter(p => !p.isFolded);
  const p1 = activePlayers[0];
  const p2 = activePlayers[1];

  const result = compareHands(p1.cards!, p2.cards!);
  let winner = p1;
  if (result === 'hand2') winner = p2;
  if (result === 'tie') {
    winner = (requester.id === p1.id) ? p2 : p1; // requester loses ties
  }

  table.status = 'showdown';
  table.winnerId = winner.id;
  broadcastToTable(table.id, { type: 'tp_game', event: 'showdown', table: getSanitizedTableState(table) });

  setTimeout(() => processWin(table, winner), 3000);
}

function processWin(table: TeenPattiState, winner: Player) {
  table.status = 'settled';
  table.winnerId = winner.id;
  
  if (winner.userId && table.roundId) {
    // Only settle wallet if it's a real user, we mock for bots
    settleTeenPattiRound(winner.userId, table.roundId, table.currentPot, table.bootAmount).catch(console.error);
  }

  broadcastToTable(table.id, { type: 'tp_game', event: 'settled', table: getSanitizedTableState(table) });

  setTimeout(() => {
    // Reset table for next round
    table.status = 'waiting';
    table.players = table.players.filter(p => !p.isBot); // kick bots to get fresh ones
    if (table.players.length >= 1) {
       startGame(table.id);
    }
  }, 4000);
}

function advanceTurn(table: TeenPattiState) {
  table.currentTurnIndex = getNextTurnIndex(table, table.currentTurnIndex);
  startTurn(table);
}
