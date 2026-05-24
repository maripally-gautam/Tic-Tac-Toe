import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";

interface Player {
  id: string;
  symbol: "X" | "O";
  username: string;
}

interface ChatMessage {
  sender: string;
  text: string;
  timestamp: string;
}

interface GameRoom {
  id: string;
  boardSize: number;
  players: Player[];
  board: (string | null)[];
  turn: "X" | "O";
  winner: string | null; // "X", "O", "draw" or null
  winningLine: number[] | null;
  chat: ChatMessage[];
  state: "waiting" | "playing" | "ended";
}

const app = express();
const httpServer = createServer(app);

// Configure Socket.IO Server with CORS support
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = parseInt(process.env.PORT || "8080", 10);

// In-memory room store
const rooms: Record<string, GameRoom> = {};

// Helper: Generate a unique uppercase alphanumeric code of 6 chars
function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789"; // Omit 'O' to avoid confusion with zero
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms[code] ? generateRoomCode() : code;
}

// Win checking function
function checkWinner(board: (string | null)[], size: number): { winner: string | null; line: number[] | null } {
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

  // Check draw
  if (board.every(cell => cell !== null)) {
    return { winner: "draw", line: null };
  }

  return { winner: null, line: null };
}

// Socket.IO event registrations
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // 1. Create Room
  socket.on("createRoom", (data: { boardSize?: number }) => {
    try {
      const boardSize = data.boardSize === 4 ? 4 : 3;
      const roomId = generateRoomCode();
      const newRoom: GameRoom = {
        id: roomId,
        boardSize,
        players: [
          { id: socket.id, symbol: "X", username: "Player 1" }
        ],
        board: Array(boardSize * boardSize).fill(null),
        turn: "X",
        winner: null,
        winningLine: null,
        chat: [],
        state: "waiting"
      };

      rooms[roomId] = newRoom;
      socket.join(roomId);

      // Notify owner they created the room
      socket.emit("roomCreated", { roomId, roomState: newRoom });
      console.log(`Room created: ${roomId} by client ${socket.id}`);
    } catch (err) {
      console.error(err);
      socket.emit("errorMsg", "Failed to create room.");
    }
  });

  // 2. Join Room
  socket.on("joinRoom", (data: { roomId: string }) => {
    try {
      const roomId = (data.roomId || "").trim().toUpperCase();
      const room = rooms[roomId];

      if (!room) {
        socket.emit("errorMsg", "Room not found. Make sure the code is correct!");
        return;
      }

      if (room.players.length >= 2) {
        socket.emit("errorMsg", "This room is already full.");
        return;
      }

      // Join the second player as O
      const newPlayer: Player = {
        id: socket.id,
        symbol: "O",
        username: "Player 2"
      };

      room.players.push(newPlayer);
      room.state = "playing";
      socket.join(roomId);

      // Broadcast room update to everyone inside
      io.to(roomId).emit("roomUpdated", room);
      console.log(`User ${socket.id} joined room ${roomId}`);
    } catch (err) {
      console.error(err);
      socket.emit("errorMsg", "Error while joining room.");
    }
  });

  // 3. Make Move
  socket.on("makeMove", (data: { roomId: string; index: number; symbol: "X" | "O" }) => {
    try {
      const { roomId, index, symbol } = data;
      const room = rooms[roomId];

      if (!room) {
        socket.emit("errorMsg", "Room has been closed or does not exist.");
        return;
      }

      if (room.state !== "playing") {
        socket.emit("errorMsg", "Game is not currently active.");
        return;
      }

      if (room.turn !== symbol) {
        socket.emit("errorMsg", "Wait for your turn!");
        return;
      }

      const activePlayer = room.players.find(p => p.id === socket.id);
      if (!activePlayer || activePlayer.symbol !== symbol) {
        socket.emit("errorMsg", "Unauthorized move - mismatched symbol.");
        return;
      }

      if (index < 0 || index >= room.board.length || room.board[index] !== null) {
        socket.emit("errorMsg", "Invalid tile or selection.");
        return;
      }

      // Write move to state
      room.board[index] = symbol;

      // Check results
      const gameResult = checkWinner(room.board, room.boardSize);
      if (gameResult.winner) {
        room.winner = gameResult.winner;
        room.winningLine = gameResult.line;
        room.state = "ended";
      } else {
        // Toggle turn
        room.turn = room.turn === "X" ? "O" : "X";
      }

      // Broadcast updated room state
      io.to(roomId).emit("roomUpdated", room);
    } catch (err) {
      console.error(err);
      socket.emit("errorMsg", "Failed to register turn.");
    }
  });

  // 4. Send Message (Private Chat inside Room)
  socket.on("sendChat", (data: { roomId: string; text: string }) => {
    try {
      const { roomId, text } = data;
      const room = rooms[roomId];

      if (!room) {
        socket.emit("errorMsg", "Room does not exist.");
        return;
      }

      const senderPlayer = room.players.find(p => p.id === socket.id);
      if (!senderPlayer) {
        socket.emit("errorMsg", "You are not connected to this room.");
        return;
      }

      const chatMessage: ChatMessage = {
        sender: senderPlayer.symbol,
        text: (text || "").substring(0, 150), // limits chat spamming
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      room.chat.push(chatMessage);
      io.to(roomId).emit("chatUpdated", { chat: room.chat });
    } catch (err) {
      console.error(err);
    }
  });

  // 5. Play Again request
  socket.on("playAgain", (data: { roomId: string }) => {
    try {
      const { roomId } = data;
      const room = rooms[roomId];

      if (!room) {
        socket.emit("errorMsg", "Room has been closed.");
        return;
      }

      // Reset the board but preserve player identities
      room.board = Array(room.boardSize * room.boardSize).fill(null);
      room.turn = "X"; // Reset to initial turn state
      room.winner = null;
      room.winningLine = null;
      room.state = "playing";

      // Notify all players that the game restarted
      io.to(roomId).emit("roomUpdated", room);
      console.log(`Room resetting for continuous play: ${roomId}`);
    } catch (err) {
      console.error(err);
    }
  });

  // 6. Handle DC and Clean Up
  socket.on("disconnecting", () => {
    // Check rooms the user is currently grouped in
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;

      const room = rooms[roomId];
      if (room) {
        // Filter out departing player
        room.players = room.players.filter(p => p.id !== socket.id);

        if (room.players.length === 0) {
          // No users left inside this room, delete completely
          delete rooms[roomId];
          console.log(`Cleaned up empty room: ${roomId}`);
        } else {
          // Notify the lonely remainder of disconnect
          room.state = "waiting";
          room.winner = null;
          room.winningLine = null;
          room.board = Array(room.boardSize * room.boardSize).fill(null);
          io.to(roomId).emit("opponentDisconnected", {
            msg: "Opponent disconnected. Room has returned to waiting mode.",
            roomState: room
          });
        }
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Serve API check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "alive", activeRooms: Object.keys(rooms).length });
});

// Configure Vite integration
async function integrateAppAndVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Tic Tac Toe server listening on port ${PORT}`);
  });
}

integrateAppAndVite().catch((error) => {
  console.error("Vite startup error: ", error);
});
