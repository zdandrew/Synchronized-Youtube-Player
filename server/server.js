const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require('cors');
const VideoState = require('./VideoState');
const { v4: uuidv4 } = require('uuid');
const RedisSessionManager = require('./services/redisSessionManager');

app.use(cors());

// Configure environment variables for CORS or use default
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"]
  }
});

// Initialize Redis session manager
const sessions = new RedisSessionManager();

// Broadcast state every 8 seconds to keep all clients in sync
const BROADCAST_INTERVAL = 8000; // 8 seconds

setInterval(async () => {
  try {
    // Get all active sessions from Redis
    const activeSessions = await sessions.getAllSessions();
    
    for (const [sessionId, sessionState] of activeSessions) {
      if (sessionState.firstPlay) {
        continue;
      }
      if (sessionState.isPlaying) {
        // Calculate current timestamp based on elapsed time since last update
        const elapsedSecondsUpdate = (Date.now() - sessionState.lastUpdated) / 1000;
        
        // Broadcast current state to all clients in this session room
        io.to(sessionId).emit("receiveVideoState", {
          isPlaying: sessionState.isPlaying,
          videoTimestamp: sessionState.videoTimestamp + elapsedSecondsUpdate,
          origin: "sync_broadcast"
        });
      } else {
        // For paused videos, just send the current stored timestamp
        io.to(sessionId).emit("receiveVideoState", {
          isPlaying: sessionState.isPlaying,
          videoTimestamp: sessionState.videoTimestamp,
          origin: "sync_broadcast"
        });
      }
    }
  } catch (error) {
    console.error('Error broadcasting states:', error);
  }
}, BROADCAST_INTERVAL);

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.post('/create_session', async (req, res) => {
  try {
    const sessionId = uuidv4();
    const newState = new VideoState(sessionId);
    await sessions.setSession(sessionId, newState);
    res.json({ sessionId, success: true });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ success: false, error: 'Failed to create session' });
  }
});

io.on('connection', (socket) => {
  // Get sessionId from query parameters if provided
  const sessionId = socket.handshake.query.sessionId;
  
  if (sessionId) {
    // Check if session exists and join room (async)
    (async () => {
      if (await sessions.hasSession(sessionId)) {
        socket.join(sessionId);
      }
    })();
  }
  
  // Play video event
  socket.on("play_video", async (data) => {
    try {
      const sessionState = await sessions.getSession(data.sessionId);
      if (sessionState) {
        sessionState.setPlaying(true);
        sessionState.setVideoTimestamp(data.timestamp);
        sessionState.setLastUpdated(Date.now());
        
        // Save updated state to Redis
        await sessions.setSession(data.sessionId, sessionState);
        
        io.to(data.sessionId).emit("receiveVideoState", { 
          isPlaying: true, 
          videoTimestamp: data.timestamp, 
          origin: "play_video" 
        });
      }
    } catch (error) {
      console.error('Error handling play_video:', error);
      socket.emit("error", { message: "Failed to update play state" });
    }
  });
  
  socket.on("pause_video", async (data) => {
    try {
      const sessionState = await sessions.getSession(data.sessionId);
      if (sessionState) {
        sessionState.setPlaying(false);
        sessionState.setVideoTimestamp(data.timestamp);
        sessionState.setLastUpdated(Date.now());
        
        // Save updated state to Redis
        await sessions.setSession(data.sessionId, sessionState);
        
        io.to(data.sessionId).emit("receiveVideoState", { 
          isPlaying: false, 
          videoTimestamp: data.timestamp, 
          origin: "pause_video" 
        });
      }
    } catch (error) {
      console.error('Error handling pause_video:', error);
      socket.emit("error", { message: "Failed to update pause state" });
    }
  });

  socket.on("catch_up", async (data) => {
    try {
      const sessionState = await sessions.getSession(data.sessionId);
      if (sessionState) {
        // Also join the room if not joined yet
        socket.join(data.sessionId);
        
        if (sessionState.isPlaying && !sessionState.firstPlay) {
          const elapsedSeconds = (Date.now() - sessionState.lastUpdated) / 1000;
          socket.emit("receiveVideoState", { 
            isPlaying: true, 
            videoTimestamp: sessionState.videoTimestamp + elapsedSeconds 
          });
        } else if (sessionState.firstPlay) {
          sessionState.firstPlay = false;
          sessionState.setLastUpdated(Date.now());
          
          // Save updated state to Redis
          await sessions.setSession(data.sessionId, sessionState);
          
          socket.emit("receiveVideoState", { 
            isPlaying: true, 
            videoTimestamp: 0, 
            extra: "first play"
          });
        } else {
          socket.emit("receiveVideoState", { 
            isPlaying: false, 
            videoTimestamp: sessionState.videoTimestamp 
          });
        }
      }
    } catch (error) {
      console.error('Error handling catch_up:', error);
      socket.emit("error", { message: "Failed to process catch-up request" });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    // Optional: track client disconnections in session state
  });
});

// Graceful shutdown - close Redis connection
process.on('SIGINT', async () => {
  await sessions.disconnect();
  process.exit(0);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});