const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require('cors');
const VideoState = require('./VideoState');
const { v4: uuidv4 } = require('uuid');
const redis = require('redis'); // Add Redis client
app.use(cors());

// Configure environment variables for CORS or use default
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"]
  }
});

// Connect to Redis
const redisClient = redis.createClient({
  url: 'redis://localhost:6379'
});

// Handle Redis connection events
redisClient.on('error', (err) => console.error('Redis Error:', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

// Connect to Redis (this is async)
(async () => {
  await redisClient.connect();
})();

// Redis-based session operations
const sessions = {
  async get(sessionId) {
    const data = await redisClient.get(`session:${sessionId}`);
    if (!data) return null;
    
    // Convert JSON to VideoState object
    const sessionData = JSON.parse(data);
    const state = new VideoState(sessionId);
    Object.assign(state, sessionData);
    return state;
  },
  
  async set(sessionId, sessionState) {
    await redisClient.set(`session:${sessionId}`, JSON.stringify(sessionState));
  },
  
  async has(sessionId) {
    return await redisClient.exists(`session:${sessionId}`) === 1;
  },
  
  async getAll() {
    const keys = await redisClient.keys('session:*');
    const sessions = [];
    
    for (const key of keys) {
      const sessionId = key.replace('session:', '');
      const session = await this.get(sessionId);
      if (session) {
        sessions.push([sessionId, session]);
      }
    }
    
    return sessions;
  }
};

// Broadcast state every 5 seconds to keep all clients in sync
const BROADCAST_INTERVAL = 5000; // 5 seconds

setInterval(async () => {
  try {
    // Get all active sessions from Redis
    const activeSessions = await sessions.getAll();
    
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
    await sessions.set(sessionId, newState);
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
      if (await sessions.has(sessionId)) {
        socket.join(sessionId);
      }
    })();
  }
  
  // Play video event
  socket.on("play_video", async (data) => {
    try {
      const sessionState = await sessions.get(data.sessionId);
      if (sessionState) {
        sessionState.setPlaying(true);
        sessionState.setVideoTimestamp(data.timestamp);
        sessionState.setLastUpdated(Date.now());
        
        // Save updated state to Redis
        await sessions.set(data.sessionId, sessionState);
        
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
      const sessionState = await sessions.get(data.sessionId);
      if (sessionState) {
        sessionState.setPlaying(false);
        sessionState.setVideoTimestamp(data.timestamp);
        sessionState.setLastUpdated(Date.now());
        
        // Save updated state to Redis
        await sessions.set(data.sessionId, sessionState);
        
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
      const sessionState = await sessions.get(data.sessionId);
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
          await sessions.set(data.sessionId, sessionState);
          
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
  console.log('Closing Redis connection...');
  await redisClient.quit();
  process.exit(0);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});