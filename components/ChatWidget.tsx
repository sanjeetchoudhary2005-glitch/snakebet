'use client';

// Phase 6 (chat): messages below are local-only mock UI — deferred to real-time chat phase.

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Smile, Users } from 'lucide-react';

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  type: 'user' | 'system';
  timestamp: Date;
}

const emojis = ['😊', '🚀', '💎', '🎰', '🔥', '🏆', '🎱', '💎'];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', username: 'System', text: '🎉 New game released: Crash!', type: 'system', timestamp: new Date(Date.now() - 3600000) },
    { id: '2', username: 'Player123', text: 'Just won big on Mines! 🔥', type: 'user', timestamp: new Date(Date.now() - 1800000) },
    { id: '3', username: 'System', text: 'BetMaster joined the chat', type: 'system', timestamp: new Date(Date.now() - 600000) },
  ]);
  const [inputText, setInputText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      username: 'You',
      text: inputText,
      type: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-primary hover:bg-primary-dark text-black p-4 rounded-full shadow-2xl z-50 flex items-center gap-3"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">50</span>
      </button>
      
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[90vw] bg-background rounded-2xl border border-gray-700 shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-purple-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-black" />
              <span className="font-bold text-black">Global Chat</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-black hover:opacity-70">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div 
            ref={chatContainerRef}
            className="flex-1 p-4 overflow-y-auto max-h-[400px] space-y-3"
          >
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`${msg.type === 'system' ? 'text-center italic text-gray-400 text-sm' : ''}`}
              >
                {msg.type === 'user' && (
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-yellow-400 text-sm">{msg.username}:</span>
                    <span className="text-white text-sm">{msg.text}</span>
                  </div>
                )}
                {msg.type === 'system' && <span>{msg.text}</span>}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-700">
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowEmojis(!showEmojis)}
                  className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition"
                >
                  <Smile className="w-5 h-5 text-yellow-400" />
                </button>
                {showEmojis && (
                  <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-800 rounded-lg shadow-xl flex gap-1 flex-wrap w-48">
                    {emojis.map((emoji, idx) => (
                      <button 
                        key={idx}
                        onClick={() => {
                          setInputText(prev => prev + emoji);
                          setShowEmojis(false);
                          inputRef.current?.focus();
                        }}
                        className="text-xl hover:bg-gray-700 rounded p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-full outline-none"
              />
              <button
                onClick={sendMessage}
                className="bg-primary hover:bg-primary-dark text-black p-2 rounded-full"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
