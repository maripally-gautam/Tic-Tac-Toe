import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, MessageSquareCode, Minimize2 } from "lucide-react";
import { ChatBubble, PlayerSymbol } from "../types";
import { playSound } from "../utils/audio";

interface ChatSectionProps {
  chat: ChatBubble[];
  mySymbol: PlayerSymbol;
  onSendMessage: (text: string) => void;
  isDarkMode: boolean;
  soundOn: boolean;
}

export default function ChatSection({
  chat,
  mySymbol,
  onSendMessage,
  isDarkMode,
  soundOn
}: ChatSectionProps) {
  const [inputText, setInputText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim());
    setInputText("");
    playSound("msg_sent", soundOn);
  };

  const notificationCount = chat.length;

  return (
    <div className="w-full flex flex-col mt-4">
      {/* Small Chat Badge Toggle */}
      {!isOpen && (
        <motion.button
          id="chat-toggle-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            playSound("click", soundOn);
            setIsOpen(true);
          }}
          className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
            isDarkMode
              ? "bg-[#18110f]/75 border-orange-500/20 text-white hover:border-orange-500/40"
              : "bg-white border-orange-100 text-slate-800 shadow-sm hover:border-orange-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <MessageSquareCode size={18} className="text-orange-500" />
              {notificationCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-pink-500 text-white font-sans text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {notificationCount}
                </span>
              )}
            </div>
            <span className="font-sans font-medium text-xs tracking-tight">
              Match Comm Channel
            </span>
          </div>
          <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-orange-500/10 text-orange-400">
            Tap to Open
          </span>
        </motion.button>
      )}

      {/* Expanded Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`flex flex-col border rounded-xl overflow-hidden ${
              isDarkMode
                ? "bg-[#140f0d]/92 border-orange-500/20 text-white"
                : "bg-white border-orange-100 text-slate-800 shadow-md"
            }`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-3 border-b border-orange-500/10 bg-orange-500/5">
              <div className="flex items-center gap-2">
                <MessageSquareCode size={16} className="text-orange-400" />
                <span className="font-sans font-bold text-xs uppercase tracking-wider">
                  Private Battle Station Chat
                </span>
              </div>
              <button
                id="chat-close-btn"
                onClick={() => {
                  playSound("click", soundOn);
                  setIsOpen(false);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <Minimize2 size={14} />
              </button>
            </div>

            {/* Bubble list */}
            <div className="h-44 overflow-y-auto p-3 space-y-2 scrollbar-hide">
              {chat.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <p className="font-mono text-[9px] uppercase text-slate-500 tracking-wider">
                    Secure line linked. Send a greeting!
                  </p>
                </div>
              ) : (
                chat.map((msg, i) => {
                  const isMe = msg.sender === mySymbol;

                  return (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.95, opacity: 0, y: 5 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[75%] p-2.5 rounded-2xl text-xs leading-relaxed font-sans ${
                          isMe
                            ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-tr-none shadow-sm"
                            : isDarkMode
                              ? "bg-[#241a15] border border-orange-500/15 text-white rounded-tl-none"
                              : "bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="font-mono text-[8px] text-slate-400/80 mt-1 uppercase tracking-widest px-1">
                        {isMe ? "YOU" : `PLAYER ${msg.sender}`} • {msg.timestamp}
                      </span>
                    </motion.div>
                  );
                })
              )}
              {/* Dummy scroll anchor */}
              <div ref={scrollRef} />
            </div>

            {/* Form */}
            <form onSubmit={handleSend} className="flex border-t border-orange-500/10 p-2 gap-2 bg-black/10">
              <input
                id="chat-message-input"
                type="text"
                placeholder="Broadcast brief tactic..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={80}
                className="flex-1 bg-transparent border border-orange-500/15 focus:border-orange-500/40 text-xs px-3 py-2 rounded-lg outline-none font-sans"
              />
              <button
                id="chat-send-btn"
                type="submit"
                className="p-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white cursor-pointer transition-colors"
              >
                <Send size={12} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
