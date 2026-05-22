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
    
    // Play coordinate click effects
    const symbol = board.filter(cell => cell !== null).length % 2 === 0 ? "x" : "o";
    playSound(symbol === "x" ? "move_x" : "move_o", soundOn);
    
    // Simulate haptic vibration on devices
    if (navigator.vibrate) {
      navigator.vibrate([15]);
    }
    
    onCellClick(index);
  };

  const gridColsClass = boardSize === 3 ? "grid-cols-3" : "grid-cols-4";
  const sizeSizing = boardSize === 3 ? "h-24 w-24 text-4xl" : "h-18 w-18 text-3xl";

  return (
    <div className="relative w-full max-w-[340px] aspect-square mx-auto flex items-center justify-center p-2 rounded-2xl">
      {/* Background neon shadows for game active feel */}
      <div 
        className={`absolute inset-0 rounded-2xl transition-all duration-500 blur-2xl opacity-20 -z-10 ${
          isDarkMode ? "bg-gradient-to-tr from-orange-500 via-pink-500 to-lime-500" : "bg-gradient-to-tr from-orange-400 to-pink-400"
        }`}
      />

      <div className={`grid ${gridColsClass} gap-3 w-full h-full`}>
        {board.map((cell, idx) => {
          const isWinningTile = isWinnerCell(idx);

          return (
            <motion.button
              id={`cell-btn-${idx}`}
              key={idx}
              whileTap={{ scale: enabled && cell === null ? 0.9 : 1 }}
              whileHover={{ scale: enabled && cell === null ? 1.04 : 1 }}
              onClick={() => handleCellTap(idx)}
              disabled={!enabled || cell !== null}
              className={`relative flex items-center justify-center rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer ${
                isWinningTile
                  ? "animate-pulse border-lime-400 bg-lime-500/15 shadow-[0_0_25px_rgba(132,204,22,0.45)]"
                  : cell !== null
                    ? isDarkMode
                      ? "bg-[#1d1411]/80 border-orange-500/20 shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                      : "bg-white border-orange-200 shadow-[0_2px_8px_rgba(255,112,67,0.06)]"
                    : isDarkMode
                      ? "bg-[#0e0a0a]/90 hover:bg-[#1a1210]/90 border-[#311f19]/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                      : "bg-orange-50/45 hover:bg-orange-50/90 border-orange-100 hover:border-orange-300 shadow-[inset_0_1px_2px_rgba(255,112,67,0.02)]"
              }`}
              style={{ aspectRatio: "1/1" }}
            >
              {/* Tile grid symbol animations */}
              <AnimatePresence mode="wait">
                {cell === "X" && (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1.1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="flex items-center justify-center w-full h-full"
                  >
                    {/* Animated Neon Cross */}
                    <svg
                      className="w-2/3 h-2/3"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    >
                      <line
                        x1="4"
                        y1="4"
                        x2="20"
                        y2="20"
                        className={
                          isWinningTile
                            ? "stroke-lime-400"
                            : "stroke-orange-500 drop-shadow-[0_0_8px_rgba(255,87,34,0.7)]"
                        }
                      />
                      <line
                        x1="20"
                        y1="4"
                        x2="4"
                        y2="20"
                        className={
                          isWinningTile
                            ? "stroke-lime-400"
                            : "stroke-pink-500 drop-shadow-[0_0_8px_rgba(233,30,99,0.7)]"
                        }
                      />
                    </svg>
                  </motion.div>
                )}

                {cell === "O" && (
                  <motion.div
                    initial={{ scale: 0, rotate: 45 }}
                    animate={{ scale: 1.1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="flex items-center justify-center w-full h-full"
                  >
                    {/* Animated Glowing Ring */}
                    <svg
                      className="w-2/3 h-2/3"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="8"
                        className={
                          isWinningTile
                            ? "stroke-lime-400"
                            : "stroke-lime-500 drop-shadow-[0_0_8px_rgba(50,205,50,0.8)]"
                        }
                      />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hover effect grid lines */}
              {cell === null && enabled && (
                <div
                  className={`absolute inset-0 opacity-0 hover:opacity-10 transition-opacity duration-300 ${
                    isDarkMode ? "bg-gradient-to-tr from-orange-500 to-pink-500" : "bg-gradient-to-tr from-orange-400 to-pink-400"
                  }`}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
