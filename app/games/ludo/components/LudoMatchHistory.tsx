'use client';
import { useState, useEffect } from 'react';

interface Match {
  id: string;
  opponent: string;
  betAmount: number;
  result: 'win' | 'loss' | 'draw';
  prize: number;
  date: string;
}

export function LudoMatchHistory() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ludo/history')
      .then(res => res.json())
      .then(data => {
        setMatches(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center text-gray-400">Loading history...</div>;
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">📜 Match History</h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {matches.length === 0 ? (
          <p className="text-center text-gray-500 text-sm">No matches played yet</p>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className="flex justify-between items-center p-2 bg-gray-800 rounded-lg text-sm"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  match.result === 'win' ? 'bg-white' :
                  match.result === 'loss' ? 'bg-red-400' : 'bg-yellow-400'
                }`} />
                <span>{match.opponent}</span>
              </div>
              <div className="text-right">
                <span className={match.result === 'win' ? 'text-white' : 'text-red-400'}>
                  {match.result === 'win' ? '+' : '-'}₹{match.prize}
                </span>
                <span className="text-gray-500 text-xs block">{match.date}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
