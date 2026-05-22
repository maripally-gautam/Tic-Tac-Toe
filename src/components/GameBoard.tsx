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
  isDarkMode,
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

  // Calculate cell size based on board size
  const cellSize = boardSize === 3 ? "w-[90px] h-[90px]" : "w-[70px] h-[70px]";
  const gridGap = boardSize === 3 ? "gap-3" : "gap-2";

  return (
    <div className="relative mx-auto flex items-center justify-center">
      {/* Background glow behind board */}
      <div 
        className="absolute inset-0 rounded-3xl blur-3xl -z-10"
        style={{
          background: isDarkMode 
            ? "radial-gradient(circle, rgba(255,215,0,0.15) 0%, rgba(255,140,0,0.08) 50%, transparent 70%)"
            : "radial-gradient(circle, rgba(183,110,121,0.1) 0%, rgba(212,165,116,0.05) 50%, transparent 70%)",
          transform: "scale(1.3)"
        }}
      />

      {/* The grid */}
      <div 
        className={`grid ${gridGap} p-3 rounded-2xl`}
        style={{
          gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
          backgroundColor: isDarkMode ? "rgba(255,215,0,0.06)" : "rgba(183,110,121,0.05)",
          border: isDarkMode ? "1px solid rgba(255,215,0,0.15)" : "1px solid rgba(183,110,121,0.12)",
          backdropFilter: "blur(10px)",
        }}
      >
        {board.map((cell, idx) => {
          const isWinningTile = isWinnerCell(idx);

          return (
            <motion.button
              id={`cell-btn-${idx}`}
              key={idx}
              whileTap={{ scale: enabled && cell === null ? 0.92 : 1 }}
              whileHover={{ scale: enabled && cell === null ? 1.05 : 1 }}
              onClick={() => handleCellTap(idx)}
              disabled={!enabled || cell !== null}
              className={`${cellSize} relative flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 overflow-hidden`}
              style={{
                backgroundColor: isWinningTile
                  ? isDarkMode ? "rgba(255,215,0,0.2)" : "rgba(183,110,121,0.15)"
                  : cell !== null
                    ? isDarkMode ? "rgba(20,18,15,0.9)" : "rgba(255,255,255,0.9)"
                    : isDarkMode ? "rgba(15,13,10,0.85)" : "rgba(255,255,255,0.7)",
                border: isWinningTile
                  ? isDarkMode ? "2px solid #FFD700" : "2px solid #b76e79"
                  : isDarkMode ? "1.5px solid rgba(255,215,0,0.25)" : "1.5px solid rgba(183,110,121,0.2)",
                boxShadow: isWinningTile
                  ? isDarkMode 
                    ? "0 0 20px rgba(255,215,0,0.4), 0 0 40px rgba(255,215,0,0.15)" 
                    : "0 0 20px rgba(183,110,121,0.3)"
                  : isDarkMode 
                    ? "inset 0 2px 4px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)" 
                    : "inset 0 1px 3px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              {/* Cell symbol animations */}
              <AnimatePresence mode="wait">
                {cell === "X" && (
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    className="flex items-center justify-center w-full h-full"
                  >
                    <svg
                      className="w-3/5 h-3/5"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    >
                      <line x1="5" y1="5" x2="19" y2="19" stroke={isDarkMode ? "#FFD700" : "#b76e79"} />
                      <line x1="19" y1="5" x2="5" y2="19" stroke={isDarkMode ? "#FF8C00" : "#d4a574"} />
                    </svg>
                  </motion.div>
                )}

                {cell === "O" && (
                  <motion.div
                    initial={{ scale: 0, rotate: 90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    className="flex items-center justify-center w-full h-full"
                  >
                    <svg
                      className="w-3/5 h-3/5"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    >
                      <circle cx="12" cy="12" r="7.5" stroke={isDarkMode ? "#C0C0C0" : "#c49070"} />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hover highlight for empty cells */}
              {cell === null && enabled && (
                <div
                  className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200"
                  style={{
                    background: isDarkMode
                      ? "radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%)"
                      : "radial-gradient(circle, rgba(183,110,121,0.06) 0%, transparent 70%)"
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
