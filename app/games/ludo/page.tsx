'use client';
import { useCallback, useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { LudoBetting } from './components/LudoBetting';
import { LudoControls } from './components/LudoControls';
import { LudoMatchHistory } from './components/LudoMatchHistory';
import { useReconnectingWebSocket } from '@/hooks/useReconnectingWebSocket';
import { LudoBoard } from './components/LudoBoard';
import './styles/ludo.css';

export default function LudoPage() {
  const { balance = 0, user } = useWallet();
  const [matchId, setMatchId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<{ id: string; username: string } | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [diceValue, setDiceValue] = useState(0);
  const [status, setStatus] = useState<'idle' | 'waiting' | 'active' | 'finished' | 'cancelled'>('idle');
  const [winner, setWinner] = useState<any>(null);
  const [payout, setPayout] = useState(0);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [waitingMatches, setWaitingMatches] = useState<any[]>([]);

  const handleMessage = useCallback((event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      if ((data.type === 'crash' && data.event === 'init') || data.type === 'lobby_update') {
        setWaitingMatches(data.ludoWaitingMatches || []);
      } else if (data.type === 'ludo') {
        switch (data.event) {
          case 'joined':
            setMatchId(data.match.id);
            if (data.match.status === 'waiting') {
              setStatus('waiting');
            } else {
              setStatus('active');
            }
            break;
          case 'start':
            setGameState(data.match);
            setStatus('active');
            break;
          case 'roll':
            setDiceValue(data.diceValue);
            setGameState(data.match);
            setIsMyTurn(data.match.players[data.match.currentTurnIndex]?.userId === user?.id);
            break;
          case 'moved':
            setGameState(data.match);
            setDiceValue(0);
            setIsMyTurn(data.match.players[data.match.currentTurnIndex]?.userId === user?.id);
            break;
          case 'finished':
            setGameState(data.match);
            setStatus('finished');
            setWinner(data.winner);
            setPayout(data.match.betAmount * data.match.players.length * 0.97);
            setIsMyTurn(false);
            break;
        }
      }
  }, [user?.id]);

  const handleOpen = useCallback((socket: WebSocket) => {
    if (matchId && user?.id) {
      socket.send(JSON.stringify({ game: 'ludo', action: 'join', userId: user.id, matchId }));
    }
  }, [matchId, user?.id]);

  const wsUrl = typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8080`
    : 'ws://localhost:8080';

  const { status: wsStatus, send } = useReconnectingWebSocket(wsUrl, {
    onMessage: handleMessage,
    onOpen: handleOpen,
  });

  const rollDice = async () => {
    send({ game: 'ludo', action: 'roll' });
  };

  const moveToken = (playerIndex: number, tokenIndex: number) => {
    console.log('Moving token:', playerIndex, tokenIndex);
    send({ game: 'ludo', action: 'move', playerIndex, tokenIndex });
  };

  const handleMatchCreate = async (betAmount: number) => {
    if (!user?.id) return;
    if (send({
        game: 'ludo',
        action: 'create',
        userId: user.id,
        betAmount
      })) {
      setStatus('waiting');
    }
  };

  const handleMatchJoin = async (matchId: string) => {
    if (!user?.id) return;
    if (send({
        game: 'ludo',
        action: 'join',
        userId: user.id,
        matchId
      })) {
      setStatus('waiting');
    }
  };

  return (
    <div className="ludo-container min-h-screen">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-yellow-500/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
              🎲
            </div>
            <div>
              <h1 className="text-2xl font-bold text-yellow-400">Ludo</h1>
              <p className="text-xs text-gray-400">2-Player Betting</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {wsStatus !== 'open' && (
              <span className="text-sm text-yellow-300">{wsStatus === 'reconnecting' ? 'Reconnecting...' : 'Connecting...'}</span>
            )}
            <span className="text-sm text-gray-400">Balance: ₹{balance.toFixed(2)}</span>
            <button className="px-4 py-2 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition-all">
              + Deposit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Board & Controls */}
          <div className="lg:col-span-2 space-y-4">
            {/* Board */}
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-[#0a0a1a] to-[#1a1a3a] rounded-xl border border-yellow-500/20">
                {status === 'idle' ? (
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎲</div>
                    <h3 className="text-2xl font-bold text-yellow-400 mb-2">Ludo Game</h3>
                    <p className="text-gray-400 mb-4">Challenge other players and win big!</p>
                    <div className="inline-flex gap-4">
                      <div className="px-4 py-2 bg-gray-800 rounded-lg">
                        <span className="text-yellow-400 font-bold">2 Players</span>
                      </div>
                      <div className="px-4 py-2 bg-gray-800 rounded-lg">
                        <span className="text-yellow-400 font-bold">RTP: 97%</span>
                      </div>
                    </div>
                  </div>
                ) : status === 'waiting' ? (
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎮</div>
                    <h3 className="text-2xl font-bold text-yellow-400 mb-2">
                      Waiting for opponent...
                    </h3>
                    <p className="text-gray-400">
                      Invite a friend or wait for a player to join.
                    </p>
                  </div>
                ) : (
                  <div className="w-full h-full p-4 flex items-center justify-center bg-gray-950 rounded-xl">
                     <LudoBoard gameState={gameState} onMoveToken={moveToken} userId={user?.id} />
                  </div>
                )}
              </div>
            </div>

            {/* Controls - Only show when match is active */}
            {status === 'active' && (
              <LudoControls
                onRollDice={rollDice}
                diceValue={diceValue}
                isMyTurn={isMyTurn}
                status={status}
              />
            )}
          </div>

          {/* Right Column: Betting & Info */}
          <div className="space-y-4">
            <LudoBetting
              onMatchCreate={handleMatchCreate}
              onMatchJoin={handleMatchJoin}
              waitingMatches={waitingMatches}
              opponent={opponent}
            />
            
            {/* Match Info */}
            {matchId && (
              <div className="bg-gray-900 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">📊 Match Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={status === 'active' ? 'text-white' : 'text-yellow-400'}>
                      {status === 'active' ? '🟢 Live' : status === 'waiting' ? '⏳ Waiting' : '✅ Finished'}
                    </span>
                  </div>
                  {winner && (
                    <div className="flex justify-between text-white font-bold">
                      <span>Winner</span>
                      <span>{winner.username} +₹{payout}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Match History */}
            <LudoMatchHistory />
          </div>
        </div>
      </div>
    </div>
  );
}
