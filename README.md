# Tic Tac Toe

React + Socket.IO Tic Tac Toe app with offline play, online rooms, chat, and a Capacitor Android build.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Android

Set the online server URL before building the APK:

```bash
VITE_SOCKET_URL="https://your-render-url.onrender.com"
```

Then build and install:

```bash
npm run build
npx cap sync android
npx cap run android
```

The Render deployment should run the root project with:

```bash
npm install
npm run build
npm start
```
