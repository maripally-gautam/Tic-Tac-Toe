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
  const dk = settings.isDarkMode;

  const toggleSound = () => {
    const newVal = !settings.soundOn;
    onChangeSettings({ ...settings, soundOn: newVal });
    playSound("toggle", newVal);
  };

  const toggleTheme = () => {
    onChangeSettings({ ...settings, isDarkMode: !dk });
    playSound("toggle", settings.soundOn);
  };

  const setBoardSize = (size: BoardSize) => {
    onChangeSettings({ ...settings, boardSize: size });
    playSound("click", settings.soundOn);
  };

  const accent = dk ? "#FFD700" : "#b76e79";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { playSound("click", settings.soundOn); onClose(); }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: -60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed top-6 left-4 right-4 z-50 p-6 rounded-2xl max-w-sm mx-auto"
            style={{
              background: dk ? "rgba(15,12,10,0.95)" : "rgba(255,255,255,0.97)",
              border: `1px solid ${dk ? "rgba(255,215,0,0.2)" : "rgba(183,110,121,0.18)"}`,
              boxShadow: dk ? "0 12px 40px rgba(255,215,0,0.1)" : "0 12px 40px rgba(183,110,121,0.1)",
              backdropFilter: "blur(20px)",
              color: dk ? "#fff" : "#333",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-5"
              style={{ borderBottom: `1px solid ${dk ? "rgba(255,215,0,0.1)" : "rgba(183,110,121,0.1)"}` }}
            >
              <h2 className={`text-xl uppercase font-bold tracking-tight ${dk ? "gold-shimmer-text" : "rose-gold-shimmer-text"}`}>
                Settings
              </h2>
              <button
                id="close-settings-btn"
                onClick={() => { playSound("click", settings.soundOn); onClose(); }}
                className="p-2 rounded-full cursor-pointer"
                style={{ color: dk ? "#ccc" : "#666" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  {dk ? <Moon size={16} style={{ color: accent }} /> : <Sun size={16} style={{ color: accent }} />}
                  Theme
                </span>
                <button
                  id="theme-toggle"
                  onClick={toggleTheme}
                  className="relative w-14 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300"
                  style={{ background: accent }}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md"
                    animate={{ x: dk ? 28 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {dk ? <Moon size={10} style={{ color: "#B8860B" }} /> : <Sun size={10} style={{ color: accent }} />}
                  </motion.div>
                </button>
              </div>

              {/* Board Size */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Grid3X3 size={16} style={{ color: accent }} />
                  Board Size
                </span>
                <div className="flex rounded-lg overflow-hidden"
                  style={{ border: `1px solid ${dk ? "rgba(255,215,0,0.15)" : "rgba(183,110,121,0.12)"}` }}
                >
                  {([3, 4] as BoardSize[]).map(size => (
                    <button
                      key={size}
                      id={`board-size-${size}-btn`}
                      onClick={() => setBoardSize(size)}
                      className="px-4 py-1.5 text-xs uppercase font-bold flex items-center gap-1 cursor-pointer transition-all"
                      style={{
                        background: settings.boardSize === size
                          ? (dk ? "linear-gradient(135deg, #FFD700, #FF8C00)" : "linear-gradient(135deg, #b76e79, #d4a574)")
                          : "transparent",
                        color: settings.boardSize === size
                          ? (dk ? "#000" : "#fff")
                          : (dk ? "#888" : "#888"),
                      }}
                    >
                      {size === 3 ? <Grid3X3 size={12} /> : <Grid size={12} />}
                      {size}×{size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  {settings.soundOn
                    ? <Volume2 size={16} style={{ color: accent }} className="animate-pulse" />
                    : <VolumeX size={16} style={{ color: "#999" }} />
                  }
                  Sound
                </span>
                <button
                  id="sound-toggle"
                  onClick={toggleSound}
                  className="relative w-14 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300"
                  style={{ background: settings.soundOn ? accent : "#666" }}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md"
                    animate={{ x: settings.soundOn ? 28 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {settings.soundOn
                      ? <Volume2 size={10} style={{ color: dk ? "#B8860B" : accent }} />
                      : <VolumeX size={10} style={{ color: "#999" }} />
                    }
                  </motion.div>
                </button>
              </div>
            </div>

            <div className="text-center mt-6 pt-4"
              style={{ borderTop: `1px solid ${dk ? "rgba(255,215,0,0.06)" : "rgba(183,110,121,0.06)"}` }}
            >
              <span className="font-mono text-[9px] uppercase" style={{ color: dk ? "rgba(255,215,0,0.3)" : "rgba(183,110,121,0.3)" }}>
                Arcade Engine v1.0
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
