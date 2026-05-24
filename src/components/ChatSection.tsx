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
  const accentGradient = dk
    ? "linear-gradient(135deg, #FFD700, #FF8C00)"
    : "linear-gradient(135deg, #b76e79, #d4a574)";

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
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          onClick={() => { playSound("click", soundOn); setIsOpen(true); }}
          className="fixed z-40 flex items-center justify-center rounded-full cursor-pointer float-pulse"
          style={{
            bottom: 28, right: 20,
            width: 54, height: 54,
            background: accentGradient,
            color: dk ? "#000" : "#fff",
            boxShadow: dk ? "0 6px 28px rgba(255,215,0,0.35)" : "0 6px 28px rgba(183,110,121,0.3)",
          }}
        >
          <MessageSquareCode size={21} />
          {unreadCount > 0 && (
            <span className="absolute flex items-center justify-center rounded-full text-[9px] font-bold"
              style={{
                top: -3, right: -3,
                width: 20, height: 20,
                background: "#ef4444",
                color: "#fff",
                boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
                animation: "float-pulse 1.5s ease-in-out infinite",
              }}
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
              transition={{ duration: 0.2 }}
              onClick={() => { playSound("click", soundOn); setIsOpen(false); }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            />

            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 380 }}
              className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl overflow-hidden"
              style={{
                maxHeight: "55vh",
                background: dk ? "rgba(14,11,9,0.97)" : "rgba(255,255,255,0.97)",
                border: `1px solid ${dk ? "rgba(255,215,0,0.12)" : "rgba(183,110,121,0.1)"}`,
                borderBottom: "none",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: dk ? "0 -6px 36px rgba(0,0,0,0.3)" : "0 -6px 36px rgba(0,0,0,0.06)",
                color: dk ? "#fff" : "#333",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between shrink-0"
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${dk ? "rgba(255,215,0,0.08)" : "rgba(183,110,121,0.06)"}`,
                  background: dk ? "rgba(255,215,0,0.03)" : "rgba(183,110,121,0.02)"
                }}
              >
                <div className="flex items-center" style={{ gap: 8 }}>
                  <MessageSquareCode size={15} style={{ color: accent }} />
                  <span className="text-xs font-bold uppercase tracking-wider">Match Chat</span>
                </div>
                <motion.button
                  id="chat-close-btn"
                  whileHover={{ scale: 1.15, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { playSound("click", soundOn); setIsOpen(false); }}
                  className="flex items-center justify-center rounded-full cursor-pointer"
                  style={{ width: 30, height: 30, color: dk ? "#888" : "#999" }}
                >
                  <X size={15} />
                </motion.button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto scrollbar-hide"
                style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}
              >
                {chat.length === 0 ? (
                  <div className="flex items-center justify-center" style={{ padding: "40px 0" }}>
                    <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: dk ? "rgba(255,215,0,0.25)" : "rgba(183,110,121,0.3)" }}>
                      Send a message to your opponent!
                    </p>
                  </div>
                ) : (
                  chat.map((msg, i) => {
                    const isMe = msg.sender === mySymbol;
                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.95, opacity: 0, y: 6 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div className="text-xs leading-relaxed"
                          style={{
                            maxWidth: "75%",
                            padding: "10px 14px",
                            borderRadius: 16,
                            background: isMe
                              ? accentGradient
                              : (dk ? "rgba(28,22,18,0.9)" : "rgba(245,240,236,0.9)"),
                            color: isMe ? (dk ? "#000" : "#fff") : (dk ? "#eee" : "#333"),
                            border: isMe ? "none" : `1px solid ${dk ? "rgba(255,215,0,0.08)" : "rgba(183,110,121,0.06)"}`,
                            borderTopRightRadius: isMe ? 4 : 16,
                            borderTopLeftRadius: isMe ? 16 : 4,
                          }}
                        >
                          {msg.text}
                        </div>
                        <span className="font-mono uppercase tracking-widest"
                          style={{
                            fontSize: 8,
                            marginTop: 4,
                            paddingLeft: 4,
                            paddingRight: 4,
                            color: dk ? "rgba(255,215,0,0.2)" : "rgba(183,110,121,0.25)"
                          }}
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
              <form onSubmit={handleSend} className="flex shrink-0"
                style={{
                  padding: "10px 12px",
                  gap: 8,
                  borderTop: `1px solid ${dk ? "rgba(255,215,0,0.06)" : "rgba(183,110,121,0.06)"}`,
                }}
              >
                <input
                  id="chat-input"
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  maxLength={80}
                  className="flex-1 text-xs rounded-xl outline-none bg-transparent"
                  style={{
                    padding: "10px 14px",
                    border: `1px solid ${dk ? "rgba(255,215,0,0.12)" : "rgba(183,110,121,0.1)"}`,
                    color: dk ? "#eee" : "#333",
                  }}
                />
                <motion.button
                  id="chat-send-btn"
                  type="submit"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="flex items-center justify-center rounded-xl cursor-pointer"
                  style={{
                    width: 40, height: 40,
                    background: accent,
                    color: dk ? "#000" : "#fff",
                  }}
                >
                  <Send size={14} />
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
