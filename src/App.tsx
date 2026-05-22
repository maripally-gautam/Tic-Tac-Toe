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
  Wifi,
  WifiOff
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

  const dk = settings.isDarkMode;

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
      playSound("lobby_joined", settings.soundOn);
    });

    s.on("roomUpdated", (room: OnlineRoomState) => {
      setOnlineRoom(room);
      setScreen("online_active");
      if (room.state === "ended") {
        const myPlayer = room.players.find(p => p.id === s.id);
        if (room.winner === "draw") playSound("draw", settings.soundOn);
        else if (myPlayer && room.winner === myPlayer.symbol) playSound("win", settings.soundOn);
        else playSound("lose", settings.soundOn);
        setTimeout(() => { setScreen("home"); setOnlineRoom(null); }, 5000);
      }
    });

    s.on("chatUpdated", (data: { chat: any[] }) => {
      setOnlineRoom(prev => prev ? { ...prev, chat: data.chat } : null);
    });

    s.on("opponentDisconnected", (data: { msg: string; roomState: OnlineRoomState }) => {
      setSystemAlert(data.msg);
      setOnlineRoom(data.roomState);
      playSound("lose", settings.soundOn);
      setTimeout(() => setSystemAlert(null), 4000);
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
    return () => { if (socket) socket.disconnect(); };
  }, [socket]);

  useEffect(() => { resetOfflineGame(); }, [settings.boardSize]);

  useEffect(() => {
    const root = document.documentElement;
    if (dk) {
      root.classList.add("dark");
      root.style.backgroundColor = "#0a0605";
    } else {
      root.classList.remove("dark");
      root.style.backgroundColor = "#fdf8f5";
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
      testMatch.winner === "draw" ? playSound("draw", settings.soundOn) : playSound("win", settings.soundOn);
      setTimeout(() => { setScreen("home"); resetOfflineGame(); }, 4000);
    } else {
      setOfflineState({ board: newBoard, turn: offlineState.turn === "X" ? "O" : "X", winner: null, winningLine: null });
    }
  };

  const resetOfflineGame = () => {
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

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col overflow-hidden select-none"
      style={{ background: dk ? "#0a0605" : "#fdf8f5" }}
    >
      {/* Animated particle background — full screen */}
      <ParticleBackground isDarkMode={dk} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 py-3 shrink-0"
        style={{ 
          borderBottom: dk ? "1px solid rgba(255,215,0,0.08)" : "1px solid rgba(183,110,121,0.08)",
          background: dk ? "rgba(10,6,5,0.6)" : "rgba(253,248,245,0.7)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3">
          {screen !== "home" ? (
            <motion.button
              id="back-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                playSound("click", settings.soundOn);
                setScreen("home");
                if (socket) socket.disconnect();
              }}
              className="p-2 rounded-full cursor-pointer"
              style={{
                border: dk ? "1px solid rgba(255,215,0,0.2)" : "1px solid rgba(183,110,121,0.15)",
                background: dk ? "rgba(255,215,0,0.05)" : "rgba(183,110,121,0.04)",
              }}
            >
              <ArrowLeft size={18} style={{ color: dk ? "#FFD700" : "#b76e79" }} />
            </motion.button>
          ) : (
            <div className="p-2">
              <Gamepad2 size={20} style={{ color: dk ? "#FFD700" : "#b76e79" }} />
            </div>
          )}

          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            {socket?.connected ? (
              <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider" style={{ color: dk ? "#FFD700" : "#b76e79" }}>
                <Wifi size={11} className="animate-pulse" /> ONLINE
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider" style={{ color: "rgba(150,150,150,0.7)" }}>
                <WifiOff size={11} /> OFFLINE
              </span>
            )}
          </div>
        </div>

        <motion.button
          id="settings-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => { playSound("click", settings.soundOn); setIsSettingsOpen(true); }}
          className="p-2 rounded-full cursor-pointer"
          style={{
            border: dk ? "1px solid rgba(255,215,0,0.2)" : "1px solid rgba(183,110,121,0.15)",
            background: dk ? "rgba(255,215,0,0.05)" : "rgba(183,110,121,0.04)",
          }}
        >
          <Settings size={18} style={{ color: dk ? "#FFD700" : "#b76e79" }} />
        </motion.button>
      </div>

      {/* System alerts */}
      <AnimatePresence>
        {systemAlert && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className="fixed top-16 left-4 right-4 z-50 p-3 rounded-xl text-center text-sm font-medium shadow-lg"
            style={{
              background: dk ? "rgba(255,215,0,0.95)" : "rgba(183,110,121,0.95)",
              color: dk ? "#000" : "#fff",
              backdropFilter: "blur(8px)",
            }}
          >
            {systemAlert}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-4 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait">

          {/* ===== HOME SCREEN ===== */}
          {screen === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center text-center space-y-8 w-full max-w-sm"
            >
              {/* Logo */}
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="p-5 rounded-3xl"
                style={{
                  background: dk
                    ? "linear-gradient(135deg, rgba(255,215,0,0.12) 0%, rgba(255,140,0,0.08) 100%)"
                    : "linear-gradient(135deg, rgba(183,110,121,0.1) 0%, rgba(212,165,116,0.06) 100%)",
                  border: dk ? "1px solid rgba(255,215,0,0.15)" : "1px solid rgba(183,110,121,0.12)",
                }}
              >
                <Gamepad2 size={52} style={{ color: dk ? "#FFD700" : "#b76e79", filter: dk ? "drop-shadow(0 0 12px rgba(255,215,0,0.5))" : "drop-shadow(0 0 10px rgba(183,110,121,0.35))" }} />
              </motion.div>

              {/* Title */}
              <div>
                <h1 className="text-4xl font-extrabold uppercase tracking-tight leading-tight">
                  <span className={dk ? "gold-shimmer-text" : "rose-gold-shimmer-text"}>
                    Tic Tac Toe
                  </span>
                </h1>
                <h2 className="text-2xl font-bold uppercase tracking-[0.3em] mt-1">
                  <span className={dk ? "gold-shimmer-text" : "rose-gold-shimmer-text"}>
                    Arcade
                  </span>
                </h2>
              </div>

              {/* Buttons */}
              <div className="space-y-4 w-full max-w-[280px]">
                <motion.button
                  id="play-online-btn"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { playSound("click", settings.soundOn); connectSocketServer(); setScreen("online_lobby"); }}
                  className="w-full py-4 px-6 rounded-2xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-3 cursor-pointer"
                  style={{
                    background: dk ? "linear-gradient(135deg, #FFD700, #FF8C00)" : "linear-gradient(135deg, #b76e79, #d4a574)",
                    color: dk ? "#000" : "#fff",
                    boxShadow: dk ? "0 6px 25px rgba(255,215,0,0.3)" : "0 6px 25px rgba(183,110,121,0.25)",
                  }}
                >
                  <Users size={18} /> Play Online
                </motion.button>

                <motion.button
                  id="play-offline-btn"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { playSound("click", settings.soundOn); resetOfflineGame(); setScreen("offline"); }}
                  className="w-full py-4 px-6 rounded-2xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-3 cursor-pointer"
                  style={{
                    background: dk ? "rgba(15,12,8,0.8)" : "rgba(255,255,255,0.85)",
                    color: dk ? "#fff" : "#333",
                    border: dk ? "1px solid rgba(255,215,0,0.2)" : "1px solid rgba(183,110,121,0.15)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <Play size={18} style={{ color: dk ? "#FF8C00" : "#b76e79" }} /> Play Offline
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ===== OFFLINE GAME ===== */}
          {screen === "offline" && (
            <motion.div
              key="offline"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center space-y-6 w-full"
            >
              {/* Status */}
              <div className="text-center space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em]"
                  style={{ color: dk ? "#FFD700" : "#b76e79" }}
                >
                  Local Offline • {settings.boardSize}×{settings.boardSize}
                </span>

                {offlineState.winner === "draw" ? (
                  <h2 className="text-2xl font-black uppercase" style={{ color: dk ? "#999" : "#888" }}>
                    Match Draw!
                  </h2>
                ) : offlineState.winner ? (
                  <h2 className={`text-2xl font-black uppercase ${dk ? "gold-shimmer-text" : "rose-gold-shimmer-text"}`}>
                    Player {offlineState.winner} Wins!
                  </h2>
                ) : (
                  <h2 className="text-xl font-bold flex items-center gap-2 justify-center"
                    style={{ color: dk ? "#eee" : "#333" }}
                  >
                    Turn:
                    <span style={{ 
                      color: offlineState.turn === "X" 
                        ? (dk ? "#FFD700" : "#b76e79") 
                        : (dk ? "#C0C0C0" : "#c49070"),
                      fontSize: "1.3em",
                      fontWeight: 900
                    }}>
                      {offlineState.turn}
                    </span>
                  </h2>
                )}
              </div>

              {/* GAME BOARD */}
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
                {offlineState.winner !== null && offlineState.winner !== "draw" && <ParticleExplosion />}
              </div>

              {/* Reset button */}
              <motion.button
                id="offline-reset-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { playSound("click", settings.soundOn); resetOfflineGame(); }}
                className="py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 cursor-pointer font-medium"
                style={{
                  border: dk ? "1px solid rgba(255,215,0,0.2)" : "1px solid rgba(183,110,121,0.15)",
                  color: dk ? "#FFD700" : "#b76e79",
                  background: dk ? "rgba(255,215,0,0.05)" : "rgba(183,110,121,0.04)",
                }}
              >
                <RefreshCw size={13} /> Reset Match
              </motion.button>
            </motion.div>
          )}

          {/* ===== ONLINE LOBBY ===== */}
          {screen === "online_lobby" && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center space-y-6 w-full max-w-[320px]"
            >
              <div className="text-center space-y-2">
                <Users size={40} style={{ color: dk ? "#FFD700" : "#b76e79", filter: dk ? "drop-shadow(0 0 10px rgba(255,215,0,0.4))" : "" }} className="mx-auto" />
                <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: dk ? "#fff" : "#333" }}>
                  Multiplayer Lobby
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: dk ? "#888" : "#888" }}>
                  Create a room or join with a code from your partner.
                </p>
              </div>

              {isOnlineConnecting ? (
                <div className="flex flex-col items-center space-y-3 py-6">
                  <div className="w-10 h-10 rounded-full animate-spin"
                    style={{ border: "3px solid transparent", borderTopColor: dk ? "#FFD700" : "#b76e79", borderRightColor: dk ? "#FF8C00" : "#d4a574" }}
                  />
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: dk ? "#FFD700" : "#b76e79" }}>
                    Connecting...
                  </span>
                </div>
              ) : networkError ? (
                <div className="space-y-4 w-full text-center">
                  <div className="p-3 rounded-xl text-xs"
                    style={{ 
                      background: dk ? "rgba(255,140,0,0.1)" : "rgba(183,110,121,0.08)",
                      border: dk ? "1px solid rgba(255,140,0,0.25)" : "1px solid rgba(183,110,121,0.2)",
                      color: dk ? "#FF8C00" : "#b76e79"
                    }}
                  >
                    {networkError}
                  </div>
                  <motion.button
                    id="retry-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={connectSocketServer}
                    className="w-full py-3 rounded-xl text-xs uppercase font-bold tracking-wider cursor-pointer"
                    style={{ background: dk ? "#FFD700" : "#b76e79", color: dk ? "#000" : "#fff" }}
                  >
                    Retry Connection
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-5 w-full">
                  {/* Create room */}
                  <div className="p-4 rounded-2xl space-y-3"
                    style={{
                      border: dk ? "1px solid rgba(255,215,0,0.12)" : "1px solid rgba(183,110,121,0.1)",
                      background: dk ? "rgba(255,215,0,0.04)" : "rgba(183,110,121,0.03)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: dk ? "#FFD700" : "#b76e79" }}>
                        Create Arena
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: "#888" }}>
                        {settings.boardSize}×{settings.boardSize}
                      </span>
                    </div>
                    <motion.button
                      id="create-room-btn"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={triggerCreateRoom}
                      className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                      style={{
                        background: dk ? "linear-gradient(135deg, #FFD700, #FF8C00)" : "linear-gradient(135deg, #b76e79, #d4a574)",
                        color: dk ? "#000" : "#fff",
                      }}
                    >
                      Create New Room
                    </motion.button>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ background: dk ? "rgba(255,215,0,0.1)" : "rgba(183,110,121,0.1)" }} />
                    <span className="text-[9px] font-mono uppercase" style={{ color: "#888" }}>or join</span>
                    <div className="flex-1 h-px" style={{ background: dk ? "rgba(255,215,0,0.1)" : "rgba(183,110,121,0.1)" }} />
                  </div>

                  {/* Join room */}
                  <form onSubmit={triggerJoinRoom} className="space-y-3">
                    <input
                      id="join-room-input"
                      type="text"
                      placeholder="ENTER 6-DIGIT CODE"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="w-full py-3.5 px-4 rounded-xl text-center font-mono font-bold tracking-[0.3em] text-base outline-none"
                      style={{
                        color: dk ? "#FFD700" : "#b76e79",
                        border: dk ? "1.5px solid rgba(255,215,0,0.2)" : "1.5px solid rgba(183,110,121,0.15)",
                        background: dk ? "rgba(255,215,0,0.04)" : "rgba(183,110,121,0.03)",
                      }}
                    />
                    <motion.button
                      id="join-room-btn"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                      style={{
                        background: dk ? "rgba(15,12,8,0.8)" : "rgba(255,255,255,0.85)",
                        color: dk ? "#fff" : "#333",
                        border: dk ? "1px solid rgba(255,215,0,0.15)" : "1px solid rgba(183,110,121,0.12)",
                      }}
                    >
                      Join Room
                    </motion.button>
                  </form>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== ONLINE ACTIVE GAME ===== */}
          {screen === "online_active" && onlineRoom && socket && (
            <motion.div
              key="online_game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center space-y-5 w-full"
            >
              {onlineRoom.state === "waiting" ? (
                /* Waiting for opponent */
                <div className="text-center space-y-5 py-6">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: dk ? "#FFD700" : "#b76e79" }}>
                    Room Created — Share Code
                  </span>

                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    onClick={copyRoomCode}
                    className="inline-flex items-center gap-3 py-4 px-8 rounded-2xl cursor-pointer"
                    style={{
                      background: dk ? "rgba(255,215,0,0.08)" : "rgba(183,110,121,0.06)",
                      border: dk ? "2px solid rgba(255,215,0,0.3)" : "2px solid rgba(183,110,121,0.2)",
                      boxShadow: dk ? "0 4px 20px rgba(255,215,0,0.15)" : "0 4px 20px rgba(183,110,121,0.1)",
                    }}
                  >
                    <span className="font-mono text-2xl font-black tracking-[0.4em]" style={{ color: dk ? "#FFD700" : "#b76e79" }}>
                      {onlineRoom.id}
                    </span>
                    {copiedCode ? (
                      <Check size={18} style={{ color: dk ? "#FFD700" : "#b76e79" }} />
                    ) : (
                      <Copy size={18} style={{ color: dk ? "rgba(255,215,0,0.6)" : "rgba(183,110,121,0.5)" }} />
                    )}
                  </motion.div>

                  <p className="text-xs animate-pulse max-w-[250px] mx-auto leading-relaxed" style={{ color: "#888" }}>
                    Waiting for Player 2 to join with this code...
                  </p>
                </div>
              ) : (
                /* Active gameplay */
                <div className="flex flex-col items-center space-y-4 w-full">
                  {/* Status */}
                  <div className="text-center space-y-1">
                    <div className="flex justify-center gap-3 text-[10px] uppercase font-mono tracking-widest" style={{ color: dk ? "#FFD700" : "#b76e79" }}>
                      <span>You: {onlineRoom.players.find(p => p.id === socket.id)?.symbol}</span>
                      <span>•</span>
                      <span>{onlineRoom.boardSize}×{onlineRoom.boardSize}</span>
                    </div>

                    {onlineRoom.winner === "draw" ? (
                      <h2 className="text-2xl font-black uppercase" style={{ color: "#999" }}>Game Drawn!</h2>
                    ) : onlineRoom.winner ? (
                      <h2 className={`text-2xl font-black uppercase ${dk ? "gold-shimmer-text" : "rose-gold-shimmer-text"}`}>
                        Player {onlineRoom.winner} Wins!
                      </h2>
                    ) : (
                      <h2 className="text-xl font-bold flex items-center justify-center gap-2" style={{ color: dk ? "#eee" : "#333" }}>
                        Turn:
                        <span style={{
                          color: onlineRoom.turn === onlineRoom.players.find(p => p.id === socket.id)?.symbol
                            ? (dk ? "#FFD700" : "#b76e79")
                            : (dk ? "#C0C0C0" : "#c49070"),
                          fontSize: "1.2em",
                          fontWeight: 900,
                        }}>
                          {onlineRoom.turn === onlineRoom.players.find(p => p.id === socket.id)?.symbol ? "YOURS" : `Pl ${onlineRoom.turn}`}
                        </span>
                      </h2>
                    )}
                  </div>

                  {/* GAME BOARD */}
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
                    {onlineRoom.winner !== null && onlineRoom.winner !== "draw" && <ParticleExplosion />}
                  </div>

                  {/* Rematch button */}
                  {onlineRoom.state === "ended" && (
                    <motion.button
                      id="rematch-btn"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { playSound("click", settings.soundOn); socket.emit("playAgain", { roomId: onlineRoom.id }); }}
                      className="py-3 px-6 rounded-2xl text-xs uppercase font-bold tracking-wider cursor-pointer"
                      style={{
                        background: dk ? "linear-gradient(135deg, #FFD700, #FF8C00)" : "linear-gradient(135deg, #b76e79, #d4a574)",
                        color: dk ? "#000" : "#fff",
                        boxShadow: dk ? "0 4px 20px rgba(255,215,0,0.3)" : "0 4px 15px rgba(183,110,121,0.2)",
                      }}
                    >
                      Request Rematch
                    </motion.button>
                  )}

                  {/* Chat overlay toggle */}
                  <ChatSection
                    chat={onlineRoom.chat}
                    mySymbol={onlineRoom.players.find(p => p.id === socket.id)?.symbol || "X"}
                    onSendMessage={triggerSendChat}
                    isDarkMode={dk}
                    soundOn={settings.soundOn}
                  />
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Settings modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onChangeSettings={setSettings}
      />
    </div>
  );
}
