export type BoardSize = 3 | 4;

export interface GameSettings {
  isDarkMode: boolean;
  boardSize: BoardSize;
  soundOn: boolean;
}

export type PlayerSymbol = "X" | "O";

export interface LocalGameState {
  board: (PlayerSymbol | null)[];
  turn: PlayerSymbol;
  winner: PlayerSymbol | "draw" | null;
  winningLine: number[] | null;
}

export interface Player {
  id: string;
  symbol: PlayerSymbol;
  username: string;
}

export interface ChatBubble {
  sender: PlayerSymbol;
  text: string;
  timestamp: string;
}

export interface OnlineRoomState {
  id: string;
  boardSize: BoardSize;
  players: Player[];
  board: (PlayerSymbol | null)[];
  turn: PlayerSymbol;
  winner: PlayerSymbol | "draw" | null;
  winningLine: number[] | null;
  chat: ChatBubble[];
  state: "waiting" | "playing" | "ended";
}
