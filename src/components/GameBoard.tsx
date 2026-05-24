import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { PlayerSymbol, BoardSize } from "../types";
import { playSound } from "../utils/audio";

interface GameBoardProps {
  board: (PlayerSymbol | null)[];
  onCellClick: (index: number) => void;
  boardSize: BoardSize;
  winningLine: number[] | null;
  isDarkMode: boolean;
  soundOn: boolean;
  enabled: boolean;
}

export default function GameBoard({
  board,
  onCellClick,
  boardSize,
  winningLine,
  isDarkMode: dk,
  soundOn,
  enabled
}: GameBoardProps) {
  const isWinnerCell = (index: number) => {
    return winningLine ? winningLine.includes(index) : false;
  };

  const handleCellTap = (index: number) => {
    if (!enabled || board[index] !== null) return;
    
    const symbol = board.filter(cell => cell !== null).length % 2 === 0 ? "x" : "o";
    playSound(symbol === "x" ? "move_x" : "move_o", soundOn);
    
    if (navigator.vibrate) {
      navigator.vibrate([15]);
    }
    
    onCellClick(index);
  };

  // Responsive sizing based on board size
  const cellSize = boardSize === 3 ? 88 : 68;
  const gapSize = boardSize === 3 ? 10 : 8;
  const boardPad = boardSize === 3 ? 14 : 10;

  const accent = dk ? "#FFD700" : "#b76e79";
  const accentSecondary = dk ? "#FF8C00" : "#d4a574";

  return (
    <div className="relative mx-auto flex items-center justify-center">
      {/* Background glow behind board */}
      <div 
        className="absolute rounded-3xl pointer-events-none"
        style={{
          inset: -20,
          background: dk 
            ? "radial-gradient(circle, rgba(255,215,0,0.12) 0%, rgba(255,140,0,0.06) 40%, transparent 70%)"
            : "radial-gradient(circle, rgba(183,110,121,0.08) 0%, rgba(212,165,116,0.04) 40%, transparent 70%)",
          filter: "blur(20px)",
          zIndex: -1,
        }}
      />

      {/* The grid */}
      <div 
        className="grid rounded-2xl"
        style={{
          gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
          gap: gapSize,
          padding: boardPad,
          backgroundColor: dk ? "rgba(255,215,0,0.05)" : "rgba(183,110,121,0.04)",
          border: dk ? "1.5px solid rgba(255,215,0,0.12)" : "1.5px solid rgba(183,110,121,0.1)",
          boxShadow: dk
            ? "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,215,0,0.06)"
            : "0 8px 40px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        {board.map((cell, idx) => {
          const isWinningTile = isWinnerCell(idx);

          return (
            <motion.button
              id={`cell-btn-${idx}`}
              key={idx}
              whileTap={{ scale: enabled && cell === null ? 0.9 : 1 }}
              whileHover={{ scale: enabled && cell === null ? 1.06 : 1 }}
              onClick={() => handleCellTap(idx)}
              disabled={!enabled || cell !== null}
              className={`relative flex items-center justify-center rounded-xl cursor-pointer overflow-hidden ${isWinningTile ? "win-cell-pulse" : ""}`}
              style={{
                width: cellSize, height: cellSize,
                transition: "background-color 0.2s, border-color 0.2s, box-shadow 0.2s",
                backgroundColor: isWinningTile
                  ? dk ? "rgba(255,215,0,0.18)" : "rgba(183,110,121,0.13)"
                  : cell !== null
                    ? dk ? "rgba(20,18,15,0.9)" : "rgba(255,255,255,0.92)"
                    : dk ? "rgba(16,14,10,0.85)" : "rgba(255,255,255,0.75)",
                border: isWinningTile
                  ? dk ? "2px solid #FFD700" : "2px solid #b76e79"
                  : dk ? "1.5px solid rgba(255,215,0,0.18)" : "1.5px solid rgba(183,110,121,0.14)",
                boxShadow: isWinningTile
                  ? dk 
                    ? "0 0 24px rgba(255,215,0,0.4), 0 0 50px rgba(255,215,0,0.12), inset 0 0 20px rgba(255,215,0,0.08)" 
                    : "0 0 24px rgba(183,110,121,0.3), inset 0 0 16px rgba(183,110,121,0.06)"
                  : dk 
                    ? "inset 0 2px 6px rgba(0,0,0,0.4), 0 2px 10px rgba(0,0,0,0.25)" 
                    : "inset 0 1px 4px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              {/* Cell symbol animations */}
              <AnimatePresence mode="wait">
                {cell === "X" && (
                  <motion.div
                    initial={{ scale: 0, rotate: -120, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.14, ease: "easeOut" }}
                    className="flex items-center justify-center w-full h-full"
                  >
                    <svg
                      className="w-3/5 h-3/5"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    >
                      <line x1="5" y1="5" x2="19" y2="19" stroke={accent} />
                      <line x1="19" y1="5" x2="5" y2="19" stroke={accentSecondary} />
                    </svg>
                  </motion.div>
                )}

                {cell === "O" && (
                  <motion.div
                    initial={{ scale: 0, rotate: 120, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.14, ease: "easeOut" }}
                    className="flex items-center justify-center w-full h-full"
                  >
                    <svg
                      className="w-3/5 h-3/5"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    >
                      <circle cx="12" cy="12" r="7.5" stroke={dk ? "#C0C0C0" : "#c49070"} />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hover highlight for empty cells */}
              {cell === null && enabled && (
                <div
                  className="absolute inset-0 opacity-0 hover:opacity-100"
                  style={{
                    transition: "opacity 0.2s ease",
                    background: dk
                      ? "radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%)"
                      : "radial-gradient(circle, rgba(183,110,121,0.07) 0%, transparent 70%)"
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
