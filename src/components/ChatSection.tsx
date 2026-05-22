import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, MessageSquareCode, X } from "lucide-react";
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
  isDarkMode: dk,
  soundOn
}: ChatSectionProps) {
  const [inputText, setInputText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chat, isOpen]);

  useEffect(() => {
    if (isOpen) setLastSeenCount(chat.length);
  }, [isOpen, chat.length]);

  const unreadCount = chat.length - lastSeenCount;
  const accent = dk ? "#FFD700" : "#b76e79";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
    playSound("msg_sent", soundOn);
  };

  return (
    <>
      {/* Floating Chat Toggle */}
      {!isOpen && (
        <motion.button
          id="chat-toggle-btn"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => { playSound("click", soundOn); setIsOpen(true); }}
          className="fixed bottom-8 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer float-pulse"
          style={{
            background: dk ? "linear-gradient(135deg, #FFD700, #FF8C00)" : "linear-gradient(135deg, #b76e79, #d4a574)",
            color: dk ? "#000" : "#fff",
            boxShadow: dk ? "0 4px 25px rgba(255,215,0,0.4)" : "0 4px 25px rgba(183,110,121,0.35)",
          }}
        >
          <MessageSquareCode size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold animate-bounce"
              style={{ background: "#ef4444", color: "#fff", boxShadow: "0 2px 8px rgba(239,68,68,0.4)" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </motion.button>
      )}

      {/* Chat Panel Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { playSound("click", soundOn); setIsOpen(false); }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            />

            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl overflow-hidden"
              style={{
                maxHeight: "55vh",
                background: dk ? "rgba(12,10,8,0.97)" : "rgba(255,255,255,0.97)",
                border: `1px solid ${dk ? "rgba(255,215,0,0.15)" : "rgba(183,110,121,0.12)"}`,
                borderBottom: "none",
                backdropFilter: "blur(20px)",
                boxShadow: dk ? "0 -4px 30px rgba(255,215,0,0.08)" : "0 -4px 30px rgba(183,110,121,0.06)",
                color: dk ? "#fff" : "#333",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 shrink-0"
                style={{ borderBottom: `1px solid ${dk ? "rgba(255,215,0,0.08)" : "rgba(183,110,121,0.08)"}`, background: dk ? "rgba(255,215,0,0.03)" : "rgba(183,110,121,0.02)" }}
              >
                <div className="flex items-center gap-2">
                  <MessageSquareCode size={16} style={{ color: accent }} />
                  <span className="text-xs font-bold uppercase tracking-wider">Match Chat</span>
                </div>
                <button
                  id="chat-close-btn"
                  onClick={() => { playSound("click", soundOn); setIsOpen(false); }}
                  className="p-1.5 rounded-full cursor-pointer"
                  style={{ color: dk ? "#888" : "#999" }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
                {chat.length === 0 ? (
                  <div className="flex items-center justify-center py-10">
                    <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: dk ? "rgba(255,215,0,0.3)" : "rgba(183,110,121,0.35)" }}>
                      Send a message to your opponent!
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
                        <div className="max-w-[75%] p-2.5 rounded-2xl text-xs leading-relaxed"
                          style={{
                            background: isMe
                              ? (dk ? "linear-gradient(135deg, #FFD700, #FF8C00)" : "linear-gradient(135deg, #b76e79, #d4a574)")
                              : (dk ? "rgba(25,20,15,0.9)" : "rgba(245,240,236,0.9)"),
                            color: isMe ? (dk ? "#000" : "#fff") : (dk ? "#eee" : "#333"),
                            border: isMe ? "none" : `1px solid ${dk ? "rgba(255,215,0,0.1)" : "rgba(183,110,121,0.08)"}`,
                            borderTopRightRadius: isMe ? "4px" : undefined,
                            borderTopLeftRadius: isMe ? undefined : "4px",
                          }}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[8px] mt-1 uppercase tracking-widest px-1 font-mono"
                          style={{ color: dk ? "rgba(255,215,0,0.25)" : "rgba(183,110,121,0.3)" }}
                        >
                          {isMe ? "YOU" : `P${msg.sender}`} • {msg.timestamp}
                        </span>
                      </motion.div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="flex p-2.5 gap-2 shrink-0"
                style={{ borderTop: `1px solid ${dk ? "rgba(255,215,0,0.08)" : "rgba(183,110,121,0.08)"}` }}
              >
                <input
                  id="chat-input"
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  maxLength={80}
                  className="flex-1 text-xs px-3 py-2.5 rounded-xl outline-none bg-transparent"
                  style={{
                    border: `1px solid ${dk ? "rgba(255,215,0,0.15)" : "rgba(183,110,121,0.12)"}`,
                    color: dk ? "#eee" : "#333",
                  }}
                />
                <button
                  id="chat-send-btn"
                  type="submit"
                  className="p-2.5 rounded-xl cursor-pointer"
                  style={{ background: accent, color: dk ? "#000" : "#fff" }}
                >
                  <Send size={14} />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
