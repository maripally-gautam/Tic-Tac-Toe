import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Volume2, VolumeX, Moon, Sun, Grid3X3, Grid } from "lucide-react";
import { GameSettings, BoardSize } from "../types";
import { playSound } from "../utils/audio";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onChangeSettings: (settings: GameSettings) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onChangeSettings }: SettingsModalProps) {
  const toggleSound = () => {
    const newVal = !settings.soundOn;
    onChangeSettings({ ...settings, soundOn: newVal });
    playSound("toggle", newVal);
  };

  const toggleTheme = () => {
    const newVal = !settings.isDarkMode;
    onChangeSettings({ ...settings, isDarkMode: newVal });
    playSound("toggle", settings.soundOn);
  };

  const setBoardSize = (size: BoardSize) => {
    onChangeSettings({ ...settings, boardSize: size });
    playSound("click", settings.soundOn);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              playSound("click", settings.soundOn);
              onClose();
            }}
            className="absolute inset-0 bg-[#000]/60 backdrop-blur-md z-45 rounded-3xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: "-100%", opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "-100%", opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className={`absolute top-4 left-4 right-4 z-50 p-6 rounded-2xl border ${
              settings.isDarkMode
                ? "bg-[#120d0b]/92 border-[#ff5722]/30 text-white shadow-[0_8px_32px_rgba(255,87,34,0.15)]"
                : "bg-white/95 border-[#ff8a65]/40 text-slate-800 shadow-[0_8px_32px_rgba(255,138,101,0.2)]"
            } backdrop-blur-lg`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-orange-500/10 mb-6">
              <h2 className="font-sans text-xl uppercase font-bold tracking-tight bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                Arcade Settings
              </h2>
              <button
                id="close-settings-btn"
                onClick={() => {
                  playSound("click", settings.soundOn);
                  onClose();
                }}
                className={`p-2 rounded-full transition-all ${
                  settings.isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            {/* List of Settings */}
            <div className="space-y-6">
              {/* Theme Settings row */}
              <div className="flex items-center justify-between">
                <span className="font-sans font-medium text-sm flex items-center gap-2">
                  {settings.isDarkMode ? (
                    <Moon size={16} className="text-pink-500" />
                  ) : (
                    <Sun size={16} className="text-orange-500" />
                  )}
                  Cabinet Theme
                </span>
                <button
                  id="theme-toggle-switch"
                  onClick={toggleTheme}
                  className={`relative w-14 h-7 rounded-full p-1 transition-colors duration-300 ${
                    settings.isDarkMode ? "bg-pink-600" : "bg-orange-400"
                  }`}
                >
                  <motion.div
                    layout
                    className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md"
                    animate={{ x: settings.isDarkMode ? 28 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {settings.isDarkMode ? (
                      <Moon size={10} className="text-pink-600" />
                    ) : (
                      <Sun size={10} className="text-orange-400" />
                    )}
                  </motion.div>
                </button>
              </div>

              {/* Board Size Settings row */}
              <div className="flex items-center justify-between">
                <span className="font-sans font-medium text-sm flex items-center gap-2">
                  <Grid3X3 size={16} className="text-orange-400" />
                  Arena Board Size
                </span>
                <div className="flex bg-orange-500/10 p-1 rounded-lg border border-orange-500/10">
                  <button
                    id="board-size-3-btn"
                    onClick={() => setBoardSize(3)}
                    className={`px-3 py-1 text-xs uppercase font-bold rounded-md transition-all flex items-center gap-1 ${
                      settings.boardSize === 3
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/20"
                        : `${settings.isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-800"}`
                    }`}
                  >
                    <Grid3X3 size={12} />
                    3 x 3
                  </button>
                  <button
                    id="board-size-4-btn"
                    onClick={() => setBoardSize(4)}
                    className={`px-3 py-1 text-xs uppercase font-bold rounded-md transition-all flex items-center gap-1 ${
                      settings.boardSize === 4
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/20"
                        : `${settings.isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-800"}`
                    }`}
                  >
                    <Grid size={12} />
                    4 x 4
                  </button>
                </div>
              </div>

              {/* Sound settings row */}
              <div className="flex items-center justify-between">
                <span className="font-sans font-medium text-sm flex items-center gap-2">
                  {settings.soundOn ? (
                    <Volume2 size={16} className="text-lime-500 animate-pulse" />
                  ) : (
                    <VolumeX size={16} className="text-slate-400" />
                  )}
                  Synthesized Audio
                </span>
                <button
                  id="sound-toggle-switch"
                  onClick={toggleSound}
                  className={`relative w-14 h-7 rounded-full p-1 transition-colors duration-300 ${
                    settings.soundOn ? "bg-lime-500" : "bg-slate-400"
                  }`}
                >
                  <motion.div
                    layout
                    className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md"
                    animate={{ x: settings.soundOn ? 28 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {settings.soundOn ? (
                      <Volume2 size={10} className="text-lime-600" />
                    ) : (
                      <VolumeX size={10} className="text-slate-500" />
                    )}
                  </motion.div>
                </button>
              </div>
            </div>

            <div className="text-center mt-6 pt-4 border-t border-orange-500/5">
              <span className="font-mono text-[9px] text-orange-500/40 uppercase">
                Arcade Engine 1.0.0 Stable
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
