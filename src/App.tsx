/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Gamepad2, 
  Settings, 
  Copy, 
  Check, 
  ArrowLeft, 
  RefreshCw, 
  Users,
  Trophy,
  Swords,
} from "lucide-react";
import { io, Socket } from "socket.io-client";

import { GameSettings, LocalGameState, OnlineRoomState, PlayerSymbol } from "./types";
import { playSound } from "./utils/audio";
import ParticleBackground from "./components/ParticleBackground";
import GameBoard from "./components/GameBoard";
import ChatSection from "./components/ChatSection";
import SettingsModal from "./components/SettingsModal";
import ParticleExplosion from "./components/ParticleExplosion";

export default function App() {
  const [settings, setSettings] = useState<GameSettings>({
    isDarkMode: true,
    boardSize: 3,
    soundOn: true
  });

  const [screen, setScreen] = useState<"home" | "offline" | "online_lobby" | "online_active">("home");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Full-screen party effect state
  const [showPartyEffect, setShowPartyEffect] = useState(false);
  const [partyMessage, setPartyMessage] = useState("");

  // Offline state
  const [offlineState, setOfflineState] = useState<LocalGameState>({
    board: Array(9).fill(null),
    turn: "X",
    winner: null,
    winningLine: null
  });

  // Online state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isOnlineConnecting, setIsOnlineConnecting] = useState(false);
  const [onlineRoom, setOnlineRoom] = useState<OnlineRoomState | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);
  const partyTimeoutRef = useRef<number | null>(null);
  const postMatchTimeoutRef = useRef<number | null>(null);
  const isNavigatingHistoryRef = useRef(false);

  const dk = settings.isDarkMode;

  // ─── Full-screen party trigger ───
  const triggerParty = (msg: string) => {
    if (partyTimeoutRef.current) window.clearTimeout(partyTimeoutRef.current);
    setPartyMessage(msg);
    setShowPartyEffect(true);
    partyTimeoutRef.current = window.setTimeout(() => {
      setShowPartyEffect(false);
      setPartyMessage("");
      partyTimeoutRef.current = null;
    }, 3000);
  };

  const dismissParty = () => {
    if (partyTimeoutRef.current) {
      window.clearTimeout(partyTimeoutRef.current);
      partyTimeoutRef.current = null;
    }
    setShowPartyEffect(false);
    setPartyMessage("");
  };

  // Socket connection
  const connectSocketServer = () => {
    if (socket && socket.connected) return;
    setIsOnlineConnecting(true);
    setNetworkError(null);

    const socketUrl = window.location.origin;
    const s = io(socketUrl, { reconnectionAttempts: 5, timeout: 10000 });

    s.on("connect", () => {
      setSocket(s);
      setIsOnlineConnecting(false);
      playSound("lobby_joined", settings.soundOn);
    });

    s.on("connect_error", () => {
      setIsOnlineConnecting(false);
      setNetworkError("Cannot reach game server. Try Offline mode!");
    });

    s.on("roomCreated", (data: { roomId: string; roomState: OnlineRoomState }) => {
      setOnlineRoom(data.roomState);
      setScreen("online_active");
      setJoinCodeInput(""); // Clear the join code input
      playSound("lobby_joined", settings.soundOn);
    });

    s.on("roomUpdated", (room: OnlineRoomState) => {
      setOnlineRoom(room);
      setScreen("online_active");
      setJoinCodeInput(""); // Clear the join code input
      if (room.state === "ended") {
        const myPlayer = room.players.find(p => p.id === s.id);
        if (room.winner === "draw") {
          playSound("draw", settings.soundOn);
          triggerParty("Match Draw!");
        } else if (myPlayer && room.winner === myPlayer.symbol) {
          playSound("win", settings.soundOn);
          triggerParty(`Player ${room.winner} Wins! 🏆`);
        } else {
          playSound("lose", settings.soundOn);
          triggerParty(`Player ${room.winner} Wins!`);
        }
        // Instantly go home after party effect
        postMatchTimeoutRef.current = window.setTimeout(() => {
          setScreen("home");
          setOnlineRoom(null);
          if (s) s.disconnect();
          setSocket(null);
          postMatchTimeoutRef.current = null;
        }, 2800);
      }
    });

    s.on("chatUpdated", (data: { chat: any[] }) => {
      setOnlineRoom(prev => prev ? { ...prev, chat: data.chat } : null);
    });

    s.on("opponentDisconnected", (data: { msg: string; roomState: OnlineRoomState }) => {
      setSystemAlert(data.msg);
      setOnlineRoom(data.roomState);
      playSound("lose", settings.soundOn);
      setTimeout(() => {
        setSystemAlert(null);
        setScreen("home");
        setOnlineRoom(null);
      }, 3000);
    });

    s.on("errorMsg", (msg: string) => {
      setSystemAlert(msg);
      setTimeout(() => setSystemAlert(null), 4000);
    });

    s.on("disconnect", () => {
      setIsOnlineConnecting(false);
      setSocket(null);
      if (screen === "online_active" || screen === "online_lobby") {
        setScreen("home");
        setOnlineRoom(null);
        setNetworkError("Lobby disconnected.");
      }
    });
  };

  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
      if (partyTimeoutRef.current) window.clearTimeout(partyTimeoutRef.current);
      if (postMatchTimeoutRef.current) window.clearTimeout(postMatchTimeoutRef.current);
    };
  }, [socket]);

  useEffect(() => {
    const onPopState = () => {
      isNavigatingHistoryRef.current = true;
      if (screen === "online_active") {
        setOnlineRoom(null);
        setScreen("online_lobby");
      } else if (screen === "online_lobby") {
        if (socket) socket.disconnect();
        setSocket(null);
        setScreen("home");
      } else if (screen === "offline") {
        dismissParty();
        resetOfflineGame();
        setScreen("home");
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [screen, socket, settings.boardSize]);

  useEffect(() => {
    if (screen === "home") {
      isNavigatingHistoryRef.current = false;
      return;
    }
    if (isNavigatingHistoryRef.current) {
      isNavigatingHistoryRef.current = false;
      return;
    }
    window.history.pushState({ screen }, "", window.location.href);
  }, [screen]);

  useEffect(() => { resetOfflineGame(); }, [settings.boardSize]);

  useEffect(() => {
    const root = document.documentElement;
    if (dk) {
      root.classList.add("dark");
      root.style.backgroundColor = "#0c0908";
    } else {
      root.classList.remove("dark");
      root.style.backgroundColor = "#faf5f2";
    }
  }, [dk]);

  // Offline win logic
  const checkOfflineResult = (board: (PlayerSymbol | null)[]) => {
    const size = settings.boardSize;
    const winPatterns = size === 3
      ? [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
      : [[0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15],[0,4,8,12],[1,5,9,13],[2,6,10,14],[3,7,11,15],[0,5,10,15],[3,6,9,12]];
    for (const pattern of winPatterns) {
      const firstVal = board[pattern[0]];
      if (firstVal && pattern.every(i => board[i] === firstVal)) return { winner: firstVal, line: pattern };
    }
    if (board.every(c => c !== null)) return { winner: "draw" as const, line: null };
    return null;
  };

  const handleOfflineCellClick = (index: number) => {
    if (offlineState.winner !== null) return;
    const newBoard = [...offlineState.board];
    newBoard[index] = offlineState.turn;
    const testMatch = checkOfflineResult(newBoard);
    if (testMatch) {
      setOfflineState({ board: newBoard, turn: offlineState.turn, winner: testMatch.winner, winningLine: testMatch.line });
      if (testMatch.winner === "draw") {
        playSound("draw", settings.soundOn);
        triggerParty("Match Draw!");
      } else {
        playSound("win", settings.soundOn);
        triggerParty(`Player ${testMatch.winner} Wins! 🏆`);
      }
      postMatchTimeoutRef.current = window.setTimeout(() => {
        setScreen("home");
        resetOfflineGame();
        postMatchTimeoutRef.current = null;
      }, 3000);
    } else {
      setOfflineState({ board: newBoard, turn: offlineState.turn === "X" ? "O" : "X", winner: null, winningLine: null });
    }
  };

  const resetOfflineGame = () => {
    dismissParty();
    if (postMatchTimeoutRef.current) {
      window.clearTimeout(postMatchTimeoutRef.current);
      postMatchTimeoutRef.current = null;
    }
    setOfflineState({ board: Array(settings.boardSize * settings.boardSize).fill(null), turn: "X", winner: null, winningLine: null });
  };

  const triggerCreateRoom = () => {
    playSound("click", settings.soundOn);
    if (!socket?.connected) { setNetworkError("Server offline. Connect first!"); return; }
    socket.emit("createRoom", { boardSize: settings.boardSize });
  };

  const triggerJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    playSound("click", settings.soundOn);
    if (!joinCodeInput.trim()) return;
    if (!socket?.connected) { setNetworkError("Server offline. Connect first!"); return; }
    socket.emit("joinRoom", { roomId: joinCodeInput.trim() });
  };

  const triggerOnlineMove = (index: number) => {
    if (!socket || !onlineRoom) return;
    const myPlayer = onlineRoom.players.find(p => p.id === socket.id);
    if (!myPlayer) return;
    socket.emit("makeMove", { roomId: onlineRoom.id, index, symbol: myPlayer.symbol });
  };

  const triggerSendChat = (text: string) => {
    if (!socket || !onlineRoom) return;
    socket.emit("sendChat", { roomId: onlineRoom.id, text });
  };

  const copyRoomCode = () => {
    if (!onlineRoom) return;
    navigator.clipboard.writeText(onlineRoom.id);
    setCopiedCode(true);
    playSound("copy_code", settings.soundOn);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // ─── Navigation handler ───
  // From offline → home
  // From online_lobby → home (and disconnect)
  // From online_active → online_lobby (and disconnect from room)
  const handleBackPress = () => {
    playSound("click", settings.soundOn);
    if (screen === "online_active") {
      // Go back to online lobby
      setOnlineRoom(null);
      setScreen("online_lobby");
    } else if (screen === "online_lobby") {
      // Go back to home and disconnect
      if (socket) socket.disconnect();
      setSocket(null);
      setScreen("home");
    } else {
      // Offline → home
      setScreen("home");
      if (screen === "offline") {
        dismissParty();
        resetOfflineGame();
      }
    }
  };

  // ─── Shared accent helpers ───
  const accent = dk ? "#FFD700" : "#b76e79";
  const accentSecondary = dk ? "#FF8C00" : "#d4a574";
  const accentGradient = dk
    ? "linear-gradient(135deg, #FFD700, #FF8C00)"
    : "linear-gradient(135deg, #b76e79, #d4a574)";

  return (
    <div className="relative w-full flex flex-col overflow-hidden select-none"
      style={{ background: dk ? "#0c0908" : "#faf5f2", height: "100dvh" }}
    >
      {/* Animated particle background */}
      <ParticleBackground isDarkMode={dk} />

      {/* ═══ Full-Screen Party Effect ═══ */}
      <AnimatePresence>
        {showPartyEffect && (
          <>
            <ParticleExplosion />
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
              className="fixed inset-0 flex items-center justify-center pointer-events-none"
              style={{ zIndex: 110 }}
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="text-center"
                style={{ padding: "28px 40px", borderRadius: 24 }}
              >
                <div className="flex items-center justify-center" style={{ gap: 12, marginBottom: 8 }}>
                  <Trophy size={32} style={{ color: "#FFD700", filter: "drop-shadow(0 0 12px rgba(255,215,0,0.6))" }} />
                </div>
                <h1 className={`text-3xl font-black uppercase ${dk ? "gold-shimmer-text" : "rose-gold-shimmer-text"}`}
                  style={{ textShadow: dk ? "0 0 30px rgba(255,215,0,0.4)" : "0 0 30px rgba(183,110,121,0.3)" }}
                >
                  {partyMessage}
                </h1>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Top Header Bar ── */}
      <header className="relative z-10 flex items-center justify-between shrink-0"
        style={{ 
          padding: "14px 20px",
          borderBottom: dk ? "1px solid rgba(255,215,0,0.06)" : "1px solid rgba(183,110,121,0.06)",
          background: dk ? "rgba(12,9,8,0.7)" : "rgba(250,245,242,0.8)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="flex items-center gap-3">
          {screen !== "home" ? (
            <motion.button
              id="back-btn"
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              onClick={handleBackPress}
              className="flex items-center justify-center rounded-full cursor-pointer"
              style={{
                width: 38, height: 38,
                border: dk ? "1px solid rgba(255,215,0,0.15)" : "1px solid rgba(183,110,121,0.12)",
                background: dk ? "rgba(255,215,0,0.05)" : "rgba(183,110,121,0.04)",
              }}
            >
              <ArrowLeft size={17} style={{ color: accent }} />
            </motion.button>
          ) : (
            <motion.div 
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="flex items-center justify-center" 
              style={{ width: 38, height: 38 }}
            >
              <Gamepad2 size={20} className={dk ? "logo-glow-dark" : "logo-glow-light"} style={{ color: accent }} />
            </motion.div>
          )}

          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xs font-bold uppercase tracking-[0.15em]" 
            style={{ color: dk ? "rgba(255,215,0,0.6)" : "rgba(183,110,121,0.6)" }}
          >
            Tic Tac Toe
          </motion.span>
        </div>

        <motion.button
          id="settings-btn"
          whileHover={{ scale: 1.12, rotate: 45 }}
          whileTap={{ scale: 0.88 }}
          onClick={() => { playSound("click", settings.soundOn); setIsSettingsOpen(true); }}
          className="flex items-center justify-center rounded-full cursor-pointer"
          style={{
            width: 38, height: 38,
            border: dk ? "1px solid rgba(255,215,0,0.15)" : "1px solid rgba(183,110,121,0.12)",
            background: dk ? "rgba(255,215,0,0.05)" : "rgba(183,110,121,0.04)",
          }}
        >
          <Settings size={17} style={{ color: accent }} />
        </motion.button>
      </header>

      {/* ── System Alerts ── */}
      <AnimatePresence>
        {systemAlert && (
          <motion.div
            initial={{ y: -40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -40, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="fixed z-50 rounded-2xl text-center text-sm font-semibold"
            style={{
              top: 72,
              left: 16, right: 16,
              padding: "14px 18px",
              maxWidth: 400,
              margin: "0 auto",
              background: dk ? "rgba(255,215,0,0.95)" : "rgba(183,110,121,0.95)",
              color: dk ? "#000" : "#fff",
              backdropFilter: "blur(10px)",
              boxShadow: dk ? "0 8px 32px rgba(255,215,0,0.25)" : "0 8px 32px rgba(183,110,121,0.2)",
            }}
          >
            {systemAlert}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center overflow-y-auto scrollbar-hide"
        style={{ padding: "24px 20px" }}
      >
        <AnimatePresence mode="wait">

          {/* ════════ HOME SCREEN ════════ */}
          {screen === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.97 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center w-full"
              style={{ maxWidth: 340, gap: 36 }}
            >
              {/* Logo */}
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                className="flex items-center justify-center rounded-3xl"
                style={{
                  width: 96, height: 96,
                  background: dk
                    ? "linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,140,0,0.06) 100%)"
                    : "linear-gradient(135deg, rgba(183,110,121,0.1) 0%, rgba(212,165,116,0.05) 100%)",
                  border: dk ? "1.5px solid rgba(255,215,0,0.14)" : "1.5px solid rgba(183,110,121,0.12)",
                  boxShadow: dk
                    ? "0 8px 40px rgba(255,215,0,0.08), inset 0 1px 0 rgba(255,215,0,0.08)"
                    : "0 8px 40px rgba(183,110,121,0.06), inset 0 1px 0 rgba(183,110,121,0.05)",
                }}
              >
                <Gamepad2
                  size={48}
                  className={dk ? "logo-glow-dark" : "logo-glow-light"}
                  style={{ color: accent }}
                />
              </motion.div>

              {/* Title */}
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-4xl font-extrabold uppercase tracking-tight leading-none"
                >
                  <span className={dk ? "gold-shimmer-text" : "rose-gold-shimmer-text"}>
                    Tic Tac Toe
                  </span>
                </motion.h1>
                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-bold uppercase tracking-[0.35em] mt-2"
                  style={{ color: dk ? "rgba(255,215,0,0.5)" : "rgba(183,110,121,0.45)" }}
                >
                  Arcade
                </motion.h2>
              </div>

              {/* Buttons */}
              <div className="w-full" style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 280, margin: "0 auto" }}>
                <motion.button
                  id="play-online-btn"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { playSound("click", settings.soundOn); connectSocketServer(); setScreen("online_lobby"); }}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl cursor-pointer font-bold uppercase tracking-wider"
                  style={{
                    padding: "16px 24px",
                    fontSize: 13,
                    background: accentGradient,
                    color: dk ? "#000" : "#fff",
                    boxShadow: dk ? "0 8px 30px rgba(255,215,0,0.22)" : "0 8px 30px rgba(183,110,121,0.18)",
                  }}
                >
                  <Users size={18} /> Play Online
                </motion.button>

                <motion.button
                  id="play-offline-btn"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { playSound("click", settings.soundOn); resetOfflineGame(); setScreen("offline"); }}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl cursor-pointer font-bold uppercase tracking-wider"
                  style={{
                    padding: "16px 24px",
                    fontSize: 13,
                    background: dk ? "rgba(18,14,10,0.8)" : "rgba(255,255,255,0.85)",
                    color: dk ? "#fff" : "#444",
                    border: dk ? "1.5px solid rgba(255,215,0,0.15)" : "1.5px solid rgba(183,110,121,0.12)",
                    backdropFilter: "blur(10px)",
                    boxShadow: dk
                      ? "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,215,0,0.04)"
                      : "0 4px 20px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.7)",
                  }}
                >
                  <Swords size={18} style={{ color: accentSecondary }} /> Play Offline
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ════════ OFFLINE GAME ════════ */}
          {screen === "offline" && (
            <motion.div
              key="offline"
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.93 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center w-full"
              style={{ gap: 24 }}
            >
              {/* Status */}
              <div className="text-center fade-up" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em]"
                  style={{ color: dk ? "rgba(255,215,0,0.45)" : "rgba(183,110,121,0.4)" }}
                >
                  Local Match • {settings.boardSize}×{settings.boardSize}
                </span>

                {offlineState.winner === "draw" ? (
                  <motion.h2
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl font-black uppercase"
                    style={{ color: dk ? "#999" : "#888" }}
                  >
                    Match Draw!
                  </motion.h2>
                ) : offlineState.winner ? (
                  <motion.h2
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-2xl font-black uppercase ${dk ? "gold-shimmer-text" : "rose-gold-shimmer-text"}`}
                  >
                    Player {offlineState.winner} Wins!
                  </motion.h2>
                ) : (
                  <h2 className="text-xl font-bold flex items-center gap-2 justify-center"
                    style={{ color: dk ? "#eee" : "#333" }}
                  >
                    Turn:
                    <motion.span
                      key={offlineState.turn}
                      initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18 }}
                      style={{ 
                        color: offlineState.turn === "X" 
                          ? accent
                          : (dk ? "#C0C0C0" : "#c49070"),
                        fontSize: "1.3em",
                        fontWeight: 900
                      }}
                    >
                      {offlineState.turn}
                    </motion.span>
                  </h2>
                )}
              </div>

              {/* Board */}
              <div className="relative">
                <GameBoard
                  board={offlineState.board}
                  onCellClick={handleOfflineCellClick}
                  boardSize={settings.boardSize}
                  winningLine={offlineState.winningLine}
                  isDarkMode={dk}
                  soundOn={settings.soundOn}
                  enabled={offlineState.winner === null}
                />
              </div>

              {/* Reset */}
              <motion.button
                id="offline-reset-btn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.06, y: -1 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => { playSound("click", settings.soundOn); resetOfflineGame(); }}
                className="flex items-center gap-2 rounded-xl cursor-pointer font-medium"
                style={{
                  padding: "10px 20px",
                  fontSize: 12,
                  border: dk ? "1px solid rgba(255,215,0,0.15)" : "1px solid rgba(183,110,121,0.12)",
                  color: accent,
                  background: dk ? "rgba(255,215,0,0.04)" : "rgba(183,110,121,0.03)",
                }}
              >
                <RefreshCw size={13} /> Reset Match
              </motion.button>
            </motion.div>
          )}

          {/* ════════ ONLINE LOBBY ════════ */}
          {screen === "online_lobby" && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.97 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center w-full"
              style={{ maxWidth: 330, gap: 28 }}
            >
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center" 
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
              >
                <div className="flex items-center justify-center rounded-2xl"
                  style={{
                    width: 64, height: 64,
                    background: dk ? "rgba(255,215,0,0.06)" : "rgba(183,110,121,0.05)",
                    border: dk ? "1px solid rgba(255,215,0,0.1)" : "1px solid rgba(183,110,121,0.08)",
                  }}
                >
                  <Users size={30} className={dk ? "logo-glow-dark" : "logo-glow-light"} style={{ color: accent }} />
                </div>
                <h2 className="text-lg font-black uppercase tracking-tight" style={{ color: dk ? "#fff" : "#333" }}>
                  Multiplayer Lobby
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: dk ? "#777" : "#888", maxWidth: 260 }}>
                  Create a room or join with a code from your partner.
                </p>
              </motion.div>

              {isOnlineConnecting ? (
                <div className="flex flex-col items-center" style={{ gap: 14, padding: "20px 0" }}>
                  <div className="spin-loader"
                    style={{
                      width: 40, height: 40, borderRadius: "50%",
                      border: "3px solid transparent",
                      borderTopColor: accent, borderRightColor: accentSecondary,
                    }}
                  />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: accent }}>
                    Connecting...
                  </span>
                </div>
              ) : networkError ? (
                <div className="w-full text-center" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="rounded-xl text-xs"
                    style={{ 
                      padding: "14px 16px",
                      background: dk ? "rgba(255,140,0,0.08)" : "rgba(183,110,121,0.06)",
                      border: dk ? "1px solid rgba(255,140,0,0.2)" : "1px solid rgba(183,110,121,0.15)",
                      color: dk ? "#FF8C00" : "#b76e79"
                    }}
                  >
                    {networkError}
                  </div>
                  <motion.button
                    id="retry-btn"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={connectSocketServer}
                    className="w-full rounded-xl text-xs uppercase font-bold tracking-wider cursor-pointer"
                    style={{ padding: "14px", background: accent, color: dk ? "#000" : "#fff" }}
                  >
                    Retry Connection
                  </motion.button>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="w-full" 
                  style={{ display: "flex", flexDirection: "column", gap: 20 }}
                >
                  {/* Create room */}
                  <div className="rounded-2xl"
                    style={{
                      padding: "18px",
                      display: "flex", flexDirection: "column", gap: 14,
                      border: dk ? "1px solid rgba(255,215,0,0.1)" : "1px solid rgba(183,110,121,0.08)",
                      background: dk ? "rgba(255,215,0,0.03)" : "rgba(183,110,121,0.02)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                        Create Arena
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: dk ? "#666" : "#999" }}>
                        {settings.boardSize}×{settings.boardSize}
                      </span>
                    </div>
                    <motion.button
                      id="create-room-btn"
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={triggerCreateRoom}
                      className="w-full rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                      style={{
                        padding: "14px",
                        background: accentGradient,
                        color: dk ? "#000" : "#fff",
                        boxShadow: dk ? "0 4px 18px rgba(255,215,0,0.18)" : "0 4px 14px rgba(183,110,121,0.12)",
                      }}
                    >
                      Create New Room
                    </motion.button>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center" style={{ gap: 12 }}>
                    <div className="flex-1" style={{ height: 1, background: dk ? "rgba(255,215,0,0.08)" : "rgba(183,110,121,0.08)" }} />
                    <span className="text-[10px] font-mono uppercase" style={{ color: dk ? "#555" : "#999" }}>or join</span>
                    <div className="flex-1" style={{ height: 1, background: dk ? "rgba(255,215,0,0.08)" : "rgba(183,110,121,0.08)" }} />
                  </div>

                  {/* Join room */}
                  <form onSubmit={triggerJoinRoom} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input
                      id="join-room-input"
                      type="text"
                      placeholder="ENTER 6-DIGIT CODE"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="w-full rounded-xl text-center font-mono font-bold outline-none"
                      style={{
                        padding: "14px 16px",
                        fontSize: 15,
                        letterSpacing: "0.3em",
                        color: accent,
                        border: dk ? "1.5px solid rgba(255,215,0,0.15)" : "1.5px solid rgba(183,110,121,0.12)",
                        background: dk ? "rgba(255,215,0,0.03)" : "rgba(183,110,121,0.02)",
                      }}
                    />
                    <motion.button
                      id="join-room-btn"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      className="w-full rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                      style={{
                        padding: "14px",
                        background: dk ? "rgba(18,14,10,0.8)" : "rgba(255,255,255,0.85)",
                        color: dk ? "#fff" : "#444",
                        border: dk ? "1px solid rgba(255,215,0,0.12)" : "1px solid rgba(183,110,121,0.1)",
                      }}
                    >
                      Join Room
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ════════ ONLINE ACTIVE GAME ════════ */}
          {screen === "online_active" && onlineRoom && socket && (
            <motion.div
              key="online_game"
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.93 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center w-full"
              style={{ gap: 20 }}
            >
              {onlineRoom.state === "waiting" ? (
                /* Waiting for opponent */
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center" 
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "24px 0" }}
                >
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em]"
                    style={{ color: dk ? "rgba(255,215,0,0.5)" : "rgba(183,110,121,0.45)" }}
                  >
                    Room Created — Share Code
                  </span>

                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={copyRoomCode}
                    className="inline-flex items-center rounded-2xl cursor-pointer"
                    style={{
                      padding: "18px 32px",
                      gap: 14,
                      background: dk ? "rgba(255,215,0,0.06)" : "rgba(183,110,121,0.05)",
                      border: dk ? "2px solid rgba(255,215,0,0.25)" : "2px solid rgba(183,110,121,0.18)",
                      boxShadow: dk ? "0 6px 28px rgba(255,215,0,0.1)" : "0 6px 28px rgba(183,110,121,0.08)",
                    }}
                  >
                    <span className="font-mono text-2xl font-black" style={{ letterSpacing: "0.4em", color: accent }}>
                      {onlineRoom.id}
                    </span>
                    {copiedCode ? (
                      <Check size={18} style={{ color: accent }} />
                    ) : (
                      <Copy size={18} style={{ color: dk ? "rgba(255,215,0,0.4)" : "rgba(183,110,121,0.35)" }} />
                    )}
                  </motion.div>

                  <motion.p 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-xs leading-relaxed" 
                    style={{ color: dk ? "#666" : "#999", maxWidth: 250 }}
                  >
                    Waiting for Player 2 to join with this code...
                  </motion.p>
                </motion.div>
              ) : (
                /* Active gameplay — no rematch button, game ends → home */
                <div className="flex flex-col items-center w-full" style={{ gap: 18 }}>
                  {/* Status */}
                  <div className="text-center fade-up" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div className="flex justify-center items-center text-[11px] uppercase font-mono tracking-widest"
                      style={{ color: dk ? "rgba(255,215,0,0.45)" : "rgba(183,110,121,0.4)", gap: 8 }}
                    >
                      <span>You: {onlineRoom.players.find(p => p.id === socket.id)?.symbol}</span>
                      <span style={{ opacity: 0.3 }}>•</span>
                      <span>{onlineRoom.boardSize}×{onlineRoom.boardSize}</span>
                    </div>

                    {onlineRoom.winner === "draw" ? (
                      <motion.h2
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-2xl font-black uppercase"
                        style={{ color: "#999" }}
                      >
                        Game Drawn!
                      </motion.h2>
                    ) : onlineRoom.winner ? (
                      <motion.h2
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`text-2xl font-black uppercase ${dk ? "gold-shimmer-text" : "rose-gold-shimmer-text"}`}
                      >
                        Player {onlineRoom.winner} Wins!
                      </motion.h2>
                    ) : (
                      <h2 className="text-xl font-bold flex items-center justify-center" style={{ color: dk ? "#eee" : "#333", gap: 8 }}>
                        Turn:
                        <motion.span
                          key={onlineRoom.turn}
                          initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 18 }}
                          style={{
                            color: onlineRoom.turn === onlineRoom.players.find(p => p.id === socket.id)?.symbol
                              ? accent
                              : (dk ? "#C0C0C0" : "#c49070"),
                            fontSize: "1.2em",
                            fontWeight: 900,
                          }}
                        >
                          {onlineRoom.turn === onlineRoom.players.find(p => p.id === socket.id)?.symbol ? "YOURS" : "WAITING..."}
                        </motion.span>
                      </h2>
                    )}
                  </div>

                  {/* Board */}
                  <div className="relative">
                    <GameBoard
                      board={onlineRoom.board}
                      onCellClick={triggerOnlineMove}
                      boardSize={onlineRoom.boardSize}
                      winningLine={onlineRoom.winningLine}
                      isDarkMode={dk}
                      soundOn={settings.soundOn}
                      enabled={
                        onlineRoom.state === "playing" &&
                        onlineRoom.turn === onlineRoom.players.find(p => p.id === socket.id)?.symbol
                      }
                    />
                  </div>

                  {/* Chat — only when game is playing, not ended */}
                  {onlineRoom.state === "playing" && (
                    <ChatSection
                      chat={onlineRoom.chat}
                      mySymbol={onlineRoom.players.find(p => p.id === socket.id)?.symbol || "X"}
                      onSendMessage={triggerSendChat}
                      isDarkMode={dk}
                      soundOn={settings.soundOn}
                    />
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onChangeSettings={setSettings}
      />
    </div>
  );
}
