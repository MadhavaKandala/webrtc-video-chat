# Production-Ready WebRTC Video Chat Application

A robust, multi-peer video chat application built with **Next.js**, **TypeScript**, and **Socket.io**. This application supports up to 4 participants in a decentralized mesh topology and includes real-time text chat.

## Features

- 🎥 **Multi-Peer Video Calls**: Mesh network supporting up to 4 concurrent users.
- 💬 **Real-time Chat**: Instant messaging integrated into the call interface.
- 🛠️ **In-call Controls**: Mute microphone, toggle camera, and graceful hangup.
- 🔗 **Dynamic Rooms**: Room isolation using UUID-based routing.
- 🐳 **Dockerized**: Fully containerized for consistent deployment.
- ⚡ **Next.js & Tailwind CSS**: Modern tech stack for high performance and premium UI.

## Architecture

### Signaling Server
WebRTC requires a signaling mechanism to exchange metadata between peers. This project uses a custom Node.js server with **Socket.io** to handle:
- **`join-room`**: Managing user presence in specific rooms.
- **`offer/answer`**: Exchanging SDP (Session Description Protocol) session details.
- **`ice-candidate`**: Distributing network connection details for NAT traversal.
- **`chat-message`**: Broadcasting real-time messages.

### Mesh Topology
The application implements a mesh network where every participant is directly connected to every other participant. While simple for small groups, it eliminates the need for expensive media servers (SFUs/MCUs).

## Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose (for containerized deployment)

### Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Environment Variables**:
   Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

### Docker Deployment

1. **Build and Start**:
   ```bash
   docker-compose up --build
   ```

2. **Verify Installation**:
   Visit `http://localhost:3000/api/health` to confirm the application is running correctly.

## Core Requirements Checklist

- [x] Docker & Docker Compose setup
- [x] Persistent WebSocket signaling
- [x] Media stream permission & display
- [x] Multi-peer WebRTC connection logic
- [x] Mute/Unmute & Camera Toggle
- [x] Graceful disconnection & Resource cleanup
- [x] Real-time text chat
- [x] Connection status indicators

## Project Structure

```bash
/src
  /app          # App router pages & API
  /hooks        # Custom WebRTC & Signaling hooks
  /components   # Shared UI components
/server.ts      # Custom Node.js/Socket.io server
/Dockerfile     # App container instructions
/docker-compose # Service configuration
```
