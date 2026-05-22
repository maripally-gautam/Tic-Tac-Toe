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
  Smartphone,
  Sparkles,
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
  // Global settings state
  const [settings, setSettings] = useState<GameSettings>({
    isDarkMode: true,
    boardSize: 3,
    soundOn: true
  });

  // App navigation state: "home" | "offline" | "online_lobby" | "online_active"
  const [screen, setScreen] = useState<"home" | "offline" | "online_lobby" | "online_active">("home");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 1. Offline Mode Game State
  const [offlineState, setOfflineState] = useState<LocalGameState>({
    board: Array(9).fill(null),
    turn: "X",
    winner: null,
    winningLine: null
  });

  // 2. Online Mode Network State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isOnlineConnecting, setIsOnlineConnecting] = useState(false);
  const [onlineRoom, setOnlineRoom] = useState<OnlineRoomState | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);

  // Establish socket connection only once or on reconnect requests
  const connectSocketServer = () => {
    if (socket && socket.connected) return;
    
    setIsOnlineConnecting(true);
    setNetworkError(null);

    // Dynamic origin selection (works in developers container + deployments)
    const socketUrl = window.location.origin;
    const s = io(socketUrl, {
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    s.on("connect", () => {
      console.log("WebSocket linked to backend.");
      setSocket(s);
      setIsOnlineConnecting(false);
      playSound("lobby_joined", settings.soundOn);
    });

    s.on("connect_error", (err) => {
      console.error(err);
      setIsOnlineConnecting(false);
      setNetworkError("Cannot reach game backend server. Try Offline mode!");
    });

    // Multiplayer room handlers
    s.on("roomCreated", (data: { roomId: string; roomState: OnlineRoomState }) => {
      setOnlineRoom(data.roomState);
      setScreen("online_active");
      playSound("lobby_joined", settings.soundOn);
    });

    s.on("roomUpdated", (room: OnlineRoomState) => {
      setOnlineRoom(room);
      setScreen("online_active");

      // Play audio depending on game progression
      if (room.state === "ended") {
        const myPlayer = room.players.find(p => p.id === s.id);
        if (room.winner === "draw") {
          playSound("draw", settings.soundOn);
        } else if (myPlayer && room.winner === myPlayer.symbol) {
          playSound("win", settings.soundOn);
        } else {
          playSound("lose", settings.soundOn);
        }

        // Return to home page after a smooth delay
        setTimeout(() => {
          setScreen("home");
          setOnlineRoom(null);
        }, 5000);
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

  // Clean socket on disconnect
  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
    };
  }, [socket]);

  // Handle Offline state reset of grid sizes
  useEffect(() => {
    resetOfflineGame();
  }, [settings.boardSize]);

  // Theme application to index document elements
  useEffect(() => {
    const root = document.documentElement;
    if (settings.isDarkMode) {
      root.classList.add("dark");
      root.style.backgroundColor = "#060404";
    } else {
      root.classList.remove("dark");
      root.style.backgroundColor = "#fff5f0";
    }
  }, [settings.isDarkMode]);

  // Offline Win checking logic
  const checkOfflineResult = (board: (PlayerSymbol | null)[]) => {
    const size = settings.boardSize;
    const winPatterns = size === 3 ? [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ] : [
      [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15], // Rows
      [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15], // Columns
      [0, 5, 10, 15], [3, 6, 9, 12]                                 // Diagonals
    ];

    for (const pattern of winPatterns) {
      const firstVal = board[pattern[0]];
      if (firstVal && pattern.every(index => board[index] === firstVal)) {
        return { winner: firstVal, line: pattern };
      }
    }

    if (board.every(cell => cell !== null)) {
      return { winner: "draw" as const, line: null };
    }

    return null;
  };

  // Trigger Offline Cell Click
  const handleOfflineCellClick = (index: number) => {
    if (offlineState.winner !== null) return;

    const newBoard = [...offlineState.board];
    newBoard[index] = offlineState.turn;

    const testMatch = checkOfflineResult(newBoard);

    if (testMatch) {
      setOfflineState({
        board: newBoard,
        turn: offlineState.turn,
        winner: testMatch.winner,
        winningLine: testMatch.line
      });

      // Play proper synth triggers
      if (testMatch.winner === "draw") {
        playSound("draw", settings.soundOn);
      } else {
        playSound("win", settings.soundOn);
      }

      // Smooth countdown return redirection
      setTimeout(() => {
        setScreen("home");
        resetOfflineGame();
      }, 4000);
    } else {
      // Toggle human offline turns
      setOfflineState({
        board: newBoard,
        turn: offlineState.turn === "X" ? "O" : "X",
        winner: null,
        winningLine: null
      });
    }
  };

  const resetOfflineGame = () => {
    setOfflineState({
      board: Array(settings.boardSize * settings.boardSize).fill(null),
      turn: "X",
      winner: null,
      winningLine: null
    });
  };

  // Online Multiplayer Room actions
  const triggerCreateRoom = () => {
    playSound("click", settings.soundOn);
    if (!socket || !socket.connected) {
      setNetworkError("Server offline. Connect first!");
      return;
    }
    socket.emit("createRoom", { boardSize: settings.boardSize });
  };

  const triggerJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    playSound("click", settings.soundOn);
    if (!joinCodeInput.trim()) return;

    if (!socket || !socket.connected) {
      setNetworkError("Server offline. Connect first!");
      return;
    }

    socket.emit("joinRoom", { roomId: joinCodeInput.trim() });
  };

  const triggerOnlineMove = (index: number) => {
    if (!socket || !onlineRoom) return;
    
    const myPlayer = onlineRoom.players.find(p => p.id === socket.id);
    if (!myPlayer) return;

    socket.emit("makeMove", {
      roomId: onlineRoom.id,
      index,
      symbol: myPlayer.symbol
    });
  };

  const triggerSendChat = (text: string) => {
    if (!socket || !onlineRoom) return;
    socket.emit("sendChat", {
      roomId: onlineRoom.id,
      text
    });
  };

  const triggerPlayAgain = () => {
    playSound("click", settings.soundOn);
    if (!socket || !onlineRoom) return;
    socket.emit("playAgain", { roomId: onlineRoom.id });
  };

  const copyRoomCode = () => {
    if (!onlineRoom) return;
    navigator.clipboard.writeText(onlineRoom.id);
    setCopiedCode(true);
    playSound("copy_code", settings.soundOn);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleOfflineNav = () => {
    playSound("click", settings.soundOn);
    resetOfflineGame();
    setScreen("offline");
  };

  const handleOnlineNav = () => {
    playSound("click", settings.soundOn);
    connectSocketServer();
    setScreen("online_lobby");
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center p-0 md:p-6 overflow-hidden select-none select-none">
      {/* Dynamic Animated Particles and gradients */}
      <ParticleBackground isDarkMode={settings.isDarkMode} />

      {/* Main smartphone/arcade screen simulation wrapper */}
      <div 
        id="arcade-cabinet-container"
        className={`relative w-full h-[100dvh] md:h-[840px] md:max-w-[400px] md:rounded-3xl border md:border-orange-500/10 shadow-2xl flex flex-col justify-between overflow-hidden z-20 md:backdrop-blur-sm transition-all duration-300 ${
          settings.isDarkMode
            ? "bg-[#0c0908]/92 border-orange-500/15 text-white shadow-[#ff5722]/5"
            : "bg-white/90 border-[#ffccbc] text-slate-800 shadow-[0_12px_45px_rgba(255,112,67,0.1)]"
        }`}
      >
        {/* Top Phone simulation bar header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-orange-500/5 bg-black/5">
          <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-orange-500/70">
            {/* Minimal aesthetic state */}
          </div>

          <div className="flex items-center gap-2">
            {socket && socket.connected ? (
              <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-lime-400">
                <Wifi size={10} className="animate-pulse" />
                NET_ON
              </span>
            ) : (
              <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-slate-400/80">
                <WifiOff size={10} />
                OFFLINE
              </span>
            )}
          </div>
        </div>

        {/* Action Header Display bar */}
        <div className="flex items-center justify-between px-6 py-4">
          {screen !== "home" ? (
            <motion.button
              id="back-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playSound("click", settings.soundOn);
                setScreen("home");
                if (socket) socket.disconnect();
              }}
              className={`p-2.5 rounded-full flex items-center justify-center border cursor-pointer transition-colors ${
                settings.isDarkMode
                  ? "border-orange-500/10 hover:bg-white/5 active:bg-white/10"
                  : "border-orange-100 hover:bg-orange-50 active:bg-orange-100"
              }`}
            >
              <ArrowLeft size={16} className="text-orange-500" />
            </motion.button>
          ) : (
            <div />
          )}

          <motion.button
            id="settings-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playSound("click", settings.soundOn);
              setIsSettingsOpen(true);
            }}
            className={`p-2.5 rounded-full flex items-center justify-center border cursor-pointer transition-colors ${
              settings.isDarkMode
                ? "border-orange-500/10 hover:bg-white/5"
                : "border-orange-100 hover:bg-orange-50"
            }`}
          >
            <Settings size={16} className="text-orange-500" />
          </motion.button>
        </div>

        {/* Global floating Alerts */}
        <AnimatePresence>
          {systemAlert && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="absolute top-18 left-4 right-4 z-40 p-3 rounded-xl bg-orange-600/90 border border-orange-400 text-white font-sans text-xs text-center shadow-lg backdrop-blur"
            >
              {systemAlert}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary screens view switcher */}
        <div className="flex-1 px-6 flex flex-col justify-center select-none overflow-y-auto scrollbar-hide">
          <AnimatePresence mode="wait">
            
            {/* 1. Home screen */}
            {screen === "home" && (
              <motion.div
                key="home_screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col space-y-8 w-full text-center"
              >
                {/* Branding Hero title */}
                <div className="space-y-3">
                  <motion.div
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="inline-block p-4 rounded-3xl bg-gradient-to-tr from-orange-500/20 to-pink-500/20 border border-orange-500/15"
                  >
                    <Gamepad2 size={44} className="text-orange-500 drop-shadow-[0_0_10px_#ff5722]" />
                  </motion.div>
                  
                  <div className="space-y-1 animate-pulse">
                    <h1 className="font-sans text-3xl font-extrabold uppercase tracking-tighter leading-none">
                      <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-lime-400 bg-clip-text text-transparent">
                        Tic Tac Toe
                      </span>
                      <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-orange-400 to-lime-400 font-sans tracking-widest text-[24px]">
                        Arcade
                      </span>
                    </h1>
                  </div>
                </div>

                {/* Button actions group */}
                <div className="space-y-4 pt-4 max-w-[280px] mx-auto w-full">
                  <motion.button
                    id="play-online-btn"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleOnlineNav}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-sans text-sm font-bold uppercase tracking-wider shadow-[0_6px_20px_rgba(255,87,34,0.35)] hover:shadow-[0_8px_25px_rgba(255,87,34,0.5)] transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <Users size={16} />
                    Play Online
                  </motion.button>

                  <motion.button
                    id="play-offline-btn"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleOfflineNav}
                    className={`w-full py-4 px-6 rounded-2xl font-sans text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all border cursor-pointer ${
                      settings.isDarkMode
                        ? "bg-[#1a1310]/70 hover:bg-[#281c17] border-orange-500/15 hover:border-orange-500/30 text-white"
                        : "bg-white hover:bg-orange-50/50 border-orange-100 hover:border-orange-200 text-slate-800 shadow-sm"
                    }`}
                  >
                    <Play size={16} className="text-pink-500" />
                    Play Offline
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* 2. Offline Mode Match */}
            {screen === "offline" && (
              <motion.div
                key="offline_screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col space-y-6 w-full items-center"
              >
                {/* Match Turn / Winner Indicator */}
                <div className="text-center space-y-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#ff5722]">
                    Local Offline Arena
                  </span>

                  {offlineState.winner === "draw" ? (
                    <h2 className="font-sans text-2xl uppercase font-black text-slate-400">
                      Match Draw!
                    </h2>
                  ) : offlineState.winner ? (
                    <h2 className="font-sans text-2xl uppercase font-black bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                      Player {offlineState.winner} Wins!
                    </h2>
                  ) : (
                    <h2 className="font-sans text-xl font-bold flex items-center gap-2 justify-center">
                      Turn: 
                      <span className={offlineState.turn === "X" ? "text-orange-500" : "text-lime-500"}>
                        {offlineState.turn}
                      </span>
                    </h2>
                  )}
                </div>

                {/* Grid Arena */}
                <div className="relative">
                  <GameBoard
                    board={offlineState.board}
                    onCellClick={handleOfflineCellClick}
                    boardSize={settings.boardSize}
                    winningLine={offlineState.winningLine}
                    isDarkMode={settings.isDarkMode}
                    soundOn={settings.soundOn}
                    enabled={offlineState.winner === null}
                  />

                  {/* Victory explosions particles overlay */}
                  {offlineState.winner !== null && offlineState.winner !== "draw" && (
                    <ParticleExplosion />
                  )}
                </div>

                {/* Subtext info count */}
                <div className="text-center">
                  <motion.button
                    id="offline-reset-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      playSound("click", settings.soundOn);
                      resetOfflineGame();
                    }}
                    className={`py-2 px-4 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors border ${
                      settings.isDarkMode
                        ? "border-orange-500/10 hover:bg-white/5"
                        : "border-orange-100 hover:bg-orange-50"
                    }`}
                  >
                    <RefreshCw size={12} className="text-orange-400 animate-spin" />
                    Reset Match
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* 3. Online Lobby Matcher Screen */}
            {screen === "online_lobby" && (
              <motion.div
                key="online_lobby_screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col space-y-6 w-full max-w-[300px] mx-auto"
              >
                <div className="text-center space-y-2 mb-4">
                  <Users className="mx-auto text-orange-500 drop-shadow-[0_0_8px_#ff5722]" size={36} />
                  <h2 className="font-sans text-xl font-black uppercase tracking-tight">
                    Multiplayer Lobby
                  </h2>
                  <p className="font-sans text-xs text-slate-500 leading-relaxed">
                    Build a private code grid to compete, or join an online code from a partner.
                  </p>
                </div>

                {isOnlineConnecting ? (
                  <div className="flex flex-col items-center justify-center space-y-3 py-6">
                    <div className="w-8 h-8 rounded-full border-2 border-t-orange-500 border-r-pink-500 border-slate-300 animate-spin" />
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#ff5722]">
                      Linking to Server...
                    </span>
                  </div>
                ) : networkError ? (
                  <div className="space-y-4 py-4 text-center">
                    <div className="p-3 bg-pink-500/15 border border-pink-500/30 rounded-xl text-xs text-pink-500">
                      {networkError}
                    </div>
                    <motion.button
                      id="retry-connection-btn"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={connectSocketServer}
                      className="w-full py-3 rounded-xl bg-orange-500 text-white font-sans text-xs uppercase font-bold tracking-wider hover:bg-orange-600 transition-colors cursor-pointer"
                    >
                      Connect Multiplayer Server
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Create Room Block */}
                    <div className="p-4 rounded-2xl border border-orange-500/10 bg-orange-500/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-sans font-bold text-xs uppercase tracking-wider text-orange-400">
                          Create Arena
                        </span>
                        <span className="font-mono text-[9px] text-slate-500">
                          Board: {settings.boardSize}x{settings.boardSize}
                        </span>
                      </div>
                      <motion.button
                        id="create-online-room-btn"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={triggerCreateRoom}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-sans text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Draft New Lobby Code
                      </motion.button>
                    </div>

                    <div className="relative flex items-center justify-center my-2">
                      <hr className="w-full border-orange-500/10" />
                      <span className="absolute px-3 font-mono text-[8px] uppercase text-slate-500 bg-white dark:bg-[#07040a]">
                        OR JOIN BATTLE
                      </span>
                    </div>

                    {/* Join Room Form Block */}
                    <form onSubmit={triggerJoinRoom} className="space-y-3">
                      <div className="flex flex-col space-y-1.5">
                        <input
                          id="join-room-input"
                          type="text"
                          placeholder="ENTER 6-DIGIT CODE"
                          value={joinCodeInput}
                          onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                          maxLength={6}
                          className="w-full py-3.5 px-4 rounded-xl text-center font-mono font-bold tracking-widest text-[#ff5722] border border-orange-500/15 focus:border-orange-500/50 bg-orange-500/5 outline-none placeholder:font-sans placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-500 placeholder:text-xs"
                        />
                      </div>
                      <motion.button
                        id="join-online-room-btn"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className={`w-full py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-wider border cursor-pointer ${
                          settings.isDarkMode
                            ? "bg-[#18110f]/80 border-orange-500/15 text-white"
                            : "bg-white border-orange-100 text-slate-800 shadow-sm"
                        }`}
                      >
                        Merge Into Room Code
                      </motion.button>
                    </form>
                  </div>
                )}
              </motion.div>
            )}

            {/* 4. Active Online Room Gameplay */}
            {screen === "online_active" && onlineRoom && socket && (
              <motion.div
                key="online_active_screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col space-y-5 w-full items-center"
              >
                {/* Lobby Waiting state */}
                {onlineRoom.state === "waiting" ? (
                  <div className="w-full text-center space-y-4 py-4">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#ff5722]">
                      Lobby Code Created
                    </span>

                    {/* Copier Node code container */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      onClick={copyRoomCode}
                      className="inline-flex items-center gap-3 py-3 px-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 shadow-md cursor-pointer justify-center"
                    >
                      <span className="font-mono text-xl font-black text-orange-500 tracking-widest">
                        {onlineRoom.id}
                      </span>
                      {copiedCode ? (
                        <Check size={16} className="text-lime-500" />
                      ) : (
                        <Copy size={16} className="text-orange-400" />
                      )}
                    </motion.div>

                    <p className="font-sans text-xs text-slate-500 max-w-[240px] mx-auto leading-relaxed animate-pulse">
                      Waiting for Player 2 to merge using this key lobby code...
                    </p>
                  </div>
                ) : (
                  /* Active Gameplay state */
                  <div className="w-full flex flex-col items-center space-y-4">
                    {/* Dynamic state title headers */}
                    <div className="text-center space-y-1">
                      <div className="flex justify-center gap-4 text-[10px] uppercase font-mono tracking-widest text-[#ff5722]">
                        <span>ROLE: {onlineRoom.players.find(p => p.id === socket.id)?.symbol}</span>
                        <span>•</span>
                        <span>Arena Board: {onlineRoom.boardSize}x{onlineRoom.boardSize}</span>
                      </div>

                      {onlineRoom.winner === "draw" ? (
                        <h2 className="font-sans text-2xl uppercase font-black text-slate-400">
                          Game Drawn!
                        </h2>
                      ) : onlineRoom.winner ? (
                        <h2 className="font-sans text-2xl uppercase font-black bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                          Player {onlineRoom.winner} Wins!
                        </h2>
                      ) : (
                        <h2 className="font-sans text-xl font-bold flex items-center justify-center gap-2">
                          Turn: 
                          <span className={onlineRoom.turn === "X" ? "text-orange-500" : "text-lime-500"}>
                            {onlineRoom.turn === onlineRoom.players.find(p => p.id === socket.id)?.symbol ? "YOURS" : `Pl ${onlineRoom.turn}`}
                          </span>
                        </h2>
                      )}
                    </div>

                    {/* Arena container */}
                    <div className="relative">
                      <GameBoard
                        board={onlineRoom.board}
                        onCellClick={triggerOnlineMove}
                        boardSize={onlineRoom.boardSize}
                        winningLine={onlineRoom.winningLine}
                        isDarkMode={settings.isDarkMode}
                        soundOn={settings.soundOn}
                        enabled={
                          onlineRoom.state === "playing" &&
                          onlineRoom.turn === onlineRoom.players.find(p => p.id === socket.id)?.symbol
                        }
                      />

                      {/* Burst particle launcher */}
                      {onlineRoom.winner !== null && onlineRoom.winner !== "draw" && (
                        <ParticleExplosion />
                      )}
                    </div>

                    {/* Sub action reset triggers and Private Chat */}
                    {onlineRoom.state === "ended" && (
                      <motion.button
                        id="rematch-btn"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={triggerPlayAgain}
                        className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-sans text-xs uppercase font-bold tracking-wider shadow-lg shadow-orange-500/20 cursor-pointer"
                      >
                        Request Rematch
                      </motion.button>
                    )}

                    <ChatSection
                      chat={onlineRoom.chat}
                      mySymbol={onlineRoom.players.find(p => p.id === socket.id)?.symbol || "X"}
                      onSendMessage={triggerSendChat}
                      isDarkMode={settings.isDarkMode}
                      soundOn={settings.soundOn}
                    />
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Dynamic decorative phone footer notch */}
        <div className="flex items-center justify-center py-4 bg-black/5 border-t border-orange-500/5">
          <div className="w-20 h-1 rounded-full bg-orange-500/20 animate-pulse" />
        </div>
      </div>

      {/* Global Config Settings Slide-down Drawer */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onChangeSettings={setSettings}
      />
    </div>
  );
}
