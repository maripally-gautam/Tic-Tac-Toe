# 🎮 Tic Tac Toe Arcade

A premium, high-fidelity **Tic Tac Toe Arcade** mobile game built with full focus on UI/UX, animations, tactile sensory feel, synthesized retro sound effects, light/dark modes, and synchronized multiplayer.

This workspace contains three parts:
1. **🚀 Fully Interactive Web Preview (React + Express + Socket.IO)**: Built directly into the workspace root. Play offline or online in real-time in your browser sandbox on port 3000!
2. **🤖 Standalone Socket.IO Backend (`/socket.io/`)**: Pure Node.js room coordinator designed for easy, zero-config deployment to platforms like Render.
3. **📱 Production Flutter App (`/flutter_app/`)**: Full modular Dart codebase complete with custom sound service hooks, state management, socket.io connectors, and elegant theme designs.

---

## 🏗️ Architecture & Features

### 🕹️ Custom Sensory Features (Web & Mobile)
- **Web Audio API Synth**: Eliminates massive, slow-loading assets! The app synthesizes playful Chiptune/8-bit retro sound frequencies on the fly using standard browser oscillators for maximum compatibility and zero input latency.
- **Micro-interactions**: High-tension button spring scales, tap ripples, pulsing tile glows, and gravity-offset confetti bursts.
- **Responsive Layout**: Designed within a sleek smartphone/cabinet boundary on desktop, morphs smoothly to full screen on raw mobile devices.
- **In-Memory Lobbying**: Pure volatile dictionary states, no database tracking, completely anonymous or low-friction temp sessions.

---

## 📁 Workspace Directory Structure

```
├── README.md                      # Deployment & setup documentation (THIS FILE)
├── package.json                   # Full-stack builder manifest
├── server.ts                      # Sandbox Express & Socket.IO server (Port 3000)
├── vite.config.ts                 # React assembly tool configuration
├── src/                           # High-fidelity preview client views
│   ├── main.tsx                   # Client bootstrap entry
│   ├── App.tsx                    # Screen Orchestration & Smartphone wireframe
│   ├── types.ts                   # Unified state declarations
│   ├── components/                # Modular client elements
│   │   ├── GameBoard.tsx          # Smooth vector grids & hover feedback
│   │   ├── ChatSection.tsx        # Responsive private chat bubbles drawer
│   │   ├── SettingsModal.tsx      # Slideover theme, size, and audio controller
│   │   ├── ParticleBackground.tsx # Canvas-based background blurs
│   │   └── ParticleExplosion.tsx  # Interactive win confetti bursts
│   └── utils/
│       └── audio.ts               # Custom oscillator synthesizer
│
├── socket.io/                     # Standalone Node.js Backend Project
│   ├── package.json               # Pure Node manifest for Render
│   └── server.js                  # Standalone match broker handler
│
└── flutter_app/                   # Full Mobile client codebase
    ├── pubspec.yaml               # App dependencies and assets config
    └── lib/
        ├── main.dart              # Flutter entry point
        ├── theme/
        │   └── arcade_theme.dart  # Neon orange and pink arcade themes
        ├── services/
        │   ├── sound_service.dart # Audioplayers asset triggers
        │   └── socket_service.dart# Realtime room event broker
        └── screens/
            ├── home_screen.dart   # Interactive dashboard & settings
            └── game_screen.dart   # Responsive grid, chat drawer & local plays
```

---

## 🚀 Setup & Execution Instructions

### A. How to play on the Interactive Web Preview
1. The preview server boots automatically on port `3000`.
2. **Play Offline Mode**: Instant multiplayer on the same physical device screen. Includes animated win lines and a 4-second redirect back home.
3. **Play Online Mode**: Open the application preview inside **two separate browser windows** simultaneously! 
   - Tab 1: Select "Play Online" and click **Draft New Lobby Code**.
   - Tab 1: Inside the lobby, click the **Code Container** to copy the generated 6-digit room key (e.g., `AC81D2`).
   - Tab 2: Select "Play Online", paste or type the lobby key into the input field, and click **Merge Into Room Code**.
   - Watch the game connect and start synchronously in less than 30ms! Send tactical chat messages between screens to experience the instant custom animations.

---

## 🌐 Standalone Socket.IO Deployment to Render (or Heroku)

To deploy the **`/socket.io/`** backend project to Render from GitHub:
1. Push only the contents of the `/socket.io/` directory to a new standalone GitHub repository (ensure `package.json` is at the root of that repo).
2. Create a new **Web Service** on **Render.com**.
3. Link your newly created GitHub repository.
4. Render will automatically detect Node.js and pre-fill the execution configurations:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click **Deploy Web Service**.
6. Once online, copy your service's live URL (e.g. `https://my-tictactoe-backend.onrender.com`).

---

## 📱 Importing Code to your Local Flutter SDK
1. Create a fresh Flutter template: `flutter create tictactoe_arcade`
2. Replace your local `/pubspec.yaml` with the contents from `/flutter_app/pubspec.yaml`.
3. Run `flutter pub get` in your terminal.
4. Copy the entire contents of the `/flutter_app/lib/` folder directly into your local `/lib/` folder.
5. Provide your sound clips inside the local `/assets/sounds/` path as specified in the pubspec.
6. Open `/lib/screens/game_screen.dart` and modify the backend connection URL to match your deployed Render URL:
   ```dart
   Provider.of<SocketService>(context, listen: false)
       .connectToServer('https://my-tictactoe-backend.onrender.com');
   ```
7. Plug in an Android Emulator/Device and hit run to experience beautiful retro-arcade gaming in native speed!
