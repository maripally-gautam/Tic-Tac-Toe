const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend clients (e.g. Flutter Web, React, or Mobile)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// In-memory room store (no persistent database required)
const rooms = {};

// Helper: Generate a unique uppercase alphanumeric code of 6 characters
function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789"; // Omit 'O' to avoid zero confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms[code] ? generateRoomCode() : code;
}

// Winner calculation helper
function checkWinner(board, size) {
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

  // Draw check
  if (board.every(cell => cell !== null)) {
    return { winner: "draw", line: null };
  }

  return { winner: null, line: null };
}

// Base root endpoint for health checks
app.get("/", (req, res) => {
  res.send({ status: "alive", activeRoomsCount: Object.keys(rooms).length });
});

// Socket.IO event system
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Create game lobby
  socket.on("createRoom", (data) => {
    try {
      const boardSize = (data && data.boardSize === 4) ? 4 : 3;
      const roomId = generateRoomCode();
      
      const newRoom = {
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

      socket.emit("roomCreated", { roomId, roomState: newRoom });
      console.log(`Lobby ${roomId} provisioned by client ${socket.id}`);
    } catch (err) {
      console.error(err);
      socket.emit("errorMsg", "Failed to draft multiplayer lobby.");
    }
  });

  // Join existing lobby
  socket.on("joinRoom", (data) => {
    try {
      if (!data || !data.roomId) {
        socket.emit("errorMsg", "Missing lobby code.");
        return;
      }
      
      const roomId = data.roomId.trim().toUpperCase();
      const room = rooms[roomId];

      if (!room) {
        socket.emit("errorMsg", "Lobby not found. Double-check your entry code!");
        return;
      }

      if (room.players.length >= 2) {
        socket.emit("errorMsg", "This room lobby is already full.");
        return;
      }

      const activePlayer = {
        id: socket.id,
        symbol: "O",
        username: "Player 2"
      };

      room.players.push(activePlayer);
      room.state = "playing";
      socket.join(roomId);

      io.to(roomId).emit("roomUpdated", room);
      console.log(`Client ${socket.id} merged into lobby ${roomId}`);
    } catch (err) {
      console.error(err);
      socket.emit("errorMsg", "Failed to connect to this lobby.");
    }
  });

  // Placing symbol
  socket.on("makeMove", (data) => {
    try {
      if (!data) return;
      const { roomId, index, symbol } = data;
      const room = rooms[roomId];

      if (!room) {
        socket.emit("errorMsg", "Room has timed out or expired.");
        return;
      }

      if (room.state !== "playing") {
        socket.emit("errorMsg", "Game has ended or has not started.");
        return;
      }

      if (room.turn !== symbol) {
        socket.emit("errorMsg", "It is not your turn!");
        return;
      }

      // Check tile integrity
      if (index < 0 || index >= room.board.length || room.board[index] !== null) {
        socket.emit("errorMsg", "Invalid grid location.");
        return;
      }

      // Register move
      room.board[index] = symbol;

      // Scan win states
      const result = checkWinner(room.board, room.boardSize);
      if (result.winner) {
        room.winner = result.winner;
        room.winningLine = result.line;
        room.state = "ended";
      } else {
        room.turn = room.turn === "X" ? "O" : "X";
      }

      io.to(roomId).emit("roomUpdated", room);
    } catch (err) {
      console.error(err);
      socket.emit("errorMsg", "Fatal error processing grid selection.");
    }
  });

  // Client sent custom chat bubble
  socket.on("sendChat", (data) => {
    try {
      if (!data || !data.roomId || !data.text) return;
      const { roomId, text } = data;
      const room = rooms[roomId];

      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      const chatNode = {
        sender: player.symbol,
        text: text.substring(0, 150),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      room.chat.push(chatNode);
      io.to(roomId).emit("chatUpdated", { chat: room.chat });
    } catch (err) {
      console.error(err);
    }
  });

  // Continuous rematch session
  socket.on("playAgain", (data) => {
    try {
      if (!data || !data.roomId) return;
      const { roomId } = data;
      const room = rooms[roomId];

      if (!room) return;

      room.board = Array(room.boardSize * room.boardSize).fill(null);
      room.turn = "X";
      room.winner = null;
      room.winningLine = null;
      room.state = "playing";

      io.to(roomId).emit("roomUpdated", room);
    } catch (err) {
      console.error(err);
    }
  });

  // Garbage collector inside room states on sockets disconnect
  socket.on("disconnecting", () => {
    socket.rooms.forEach((roomId) => {
      if (roomId === socket.id) return;
      const room = rooms[roomId];
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        
        if (room.players.length === 0) {
          delete rooms[roomId];
          console.log(`Room ${roomId} purged from index (all users left)`);
        } else {
          // Reset room properties for residual player
          room.state = "waiting";
          room.winner = null;
          room.winningLine = null;
          room.board = Array(room.boardSize * room.boardSize).fill(null);
          io.to(roomId).emit("opponentDisconnected", {
            msg: "Your opponent disconnected from the match.",
            roomState: room
          });
        }
      }
    });
  });

  socket.on("disconnect", () => {
    console.log(`Socket left: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Standalone Socket.IO Server running on node port ${PORT}`);
});
