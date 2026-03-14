import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Configure for production as needed
      methods: ["GET", "POST"]
    }
  });

  // Keep track of users in rooms
  const roomUsers: { [roomId: string]: string[] } = {};

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);

      if (!roomUsers[roomId]) {
        roomUsers[roomId] = [];
      }

      // Notify others in the room about the new user
      socket.to(roomId).emit('user-joined', socket.id);

      // Send the list of existing users to the new user
      const otherUsers = roomUsers[roomId].filter(id => id !== socket.id);
      socket.emit('all-users', otherUsers);

      roomUsers[roomId].push(socket.id);

      // Chat message handling
      socket.on('send-chat-message', (message: string) => {
        io.to(roomId).emit('chat-message', {
          id: `${socket.id}-${Date.now()}`,
          sender: socket.id,
          text: message,
          timestamp: new Date().toLocaleTimeString()
        });
      });

      // Signaling events: Forward to specific peer
      socket.on('offer', ({ to, offer }) => {
        io.to(to).emit('offer', { from: socket.id, offer });
      });

      socket.on('answer', ({ to, answer }) => {
        io.to(to).emit('answer', { from: socket.id, answer });
      });

      socket.on('ice-candidate', ({ to, candidate }) => {
        io.to(to).emit('ice-candidate', { from: socket.id, candidate });
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected from room ${roomId}`);
        roomUsers[roomId] = roomUsers[roomId].filter(id => id !== socket.id);
        socket.to(roomId).emit('user-left', socket.id);
        
        if (roomUsers[roomId].length === 0) {
          delete roomUsers[roomId];
        }
      });
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
