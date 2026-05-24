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
            transition={{ duration: 0.12 }}
            onClick={() => { playSound("click", settings.soundOn); onClose(); }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.48)" }}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="fixed z-50 rounded-2xl"
            style={{
              top: 20,
              left: 16, right: 16,
              maxWidth: 380,
              margin: "0 auto",
              padding: 24,
              background: dk ? "rgba(16,12,10,0.96)" : "rgba(255,255,255,0.97)",
              border: `1.5px solid ${dk ? "rgba(255,215,0,0.18)" : "rgba(183,110,121,0.15)"}`,
              boxShadow: dk
                ? "0 16px 50px rgba(0,0,0,0.5), 0 4px 16px rgba(255,215,0,0.08)"
                : "0 16px 50px rgba(0,0,0,0.1), 0 4px 16px rgba(183,110,121,0.06)",
              color: dk ? "#fff" : "#333",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between"
              style={{ paddingBottom: 16, marginBottom: 24, borderBottom: `1px solid ${dk ? "rgba(255,215,0,0.1)" : "rgba(183,110,121,0.1)"}` }}
            >
              <h2 className={`text-xl uppercase font-bold tracking-tight ${dk ? "gold-shimmer-text" : "rose-gold-shimmer-text"}`}>
                Settings
              </h2>
              <motion.button
                id="close-settings-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { playSound("click", settings.soundOn); onClose(); }}
                className="flex items-center justify-center rounded-full cursor-pointer"
                style={{ width: 34, height: 34, color: dk ? "#ccc" : "#666", background: dk ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
              >
                <X size={16} />
              </motion.button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Theme */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center" style={{ gap: 10 }}>
                  {dk ? <Moon size={16} style={{ color: accent }} /> : <Sun size={16} style={{ color: accent }} />}
                  Theme
                </span>
                <button
                  id="theme-toggle"
                  onClick={toggleTheme}
                  className="relative rounded-full cursor-pointer"
                  style={{ width: 52, height: 28, padding: 3, background: accent, transition: "background 0.3s" }}
                >
                  <motion.div
                    className="bg-white rounded-full flex items-center justify-center"
                    style={{ width: 22, height: 22, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}
                    animate={{ x: dk ? 24 : 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    {dk ? <Moon size={10} style={{ color: "#B8860B" }} /> : <Sun size={10} style={{ color: accent }} />}
                  </motion.div>
                </button>
              </div>

              {/* Board Size */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center" style={{ gap: 10 }}>
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
                      className="flex items-center cursor-pointer"
                      style={{
                        padding: "7px 14px",
                        gap: 5,
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        transition: "all 0.2s",
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
                <span className="text-sm font-medium flex items-center" style={{ gap: 10 }}>
                  {settings.soundOn
                    ? <Volume2 size={16} style={{ color: accent }} />
                    : <VolumeX size={16} style={{ color: "#999" }} />
                  }
                  Sound
                </span>
                <button
                  id="sound-toggle"
                  onClick={toggleSound}
                  className="relative rounded-full cursor-pointer"
                  style={{ width: 52, height: 28, padding: 3, background: settings.soundOn ? accent : "#555", transition: "background 0.3s" }}
                >
                  <motion.div
                    className="bg-white rounded-full flex items-center justify-center"
                    style={{ width: 22, height: 22, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}
                    animate={{ x: settings.soundOn ? 24 : 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    {settings.soundOn
                      ? <Volume2 size={10} style={{ color: dk ? "#B8860B" : accent }} />
                      : <VolumeX size={10} style={{ color: "#999" }} />
                    }
                  </motion.div>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
