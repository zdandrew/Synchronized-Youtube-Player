const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require('cors');
const VideoState = require('./VideoState');
const { v4: uuidv4 } = require('uuid');
app.use(cors());

// Configure environment variables for CORS or use default
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"]
  }
});

// Sessions cache
const sessions = new Map();

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.post('/create_session', (req, res) => {
  try {
    const sessionId = uuidv4();
    const newState = new VideoState(sessionId);
    sessions.set(sessionId, newState);
    res.json({ sessionId, success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create session' });
  }
});

io.on('connection', (socket) => {
  // Get sessionId from query parameters if provided
  const sessionId = socket.handshake.query.sessionId;
  
  if (sessionId && sessions.has(sessionId)) {
    socket.join(sessionId);
  }
  
  // Play video event
  socket.on("play_video", (data) => {
    try {
      const sessionState = sessions.get(data.sessionId);
      if (sessionState) {
        sessionState.setPlaying(true);
        sessionState.setVideoTimestamp(data.timestamp);
        sessionState.setLastUpdated(Date.now());
        io.to(data.sessionId).emit("receiveVideoState", { 
          isPlaying: true, 
          videoTimestamp: data.timestamp, 
          origin: "play_video" 
        });
      }
    } catch (error) {
      socket.emit("error", { message: "Failed to update play state" });
    }
  });
  
  socket.on("pause_video", (data) => {
    try {
      const sessionState = sessions.get(data.sessionId);
      if (sessionState) {
        sessionState.setPlaying(false);
        sessionState.setVideoTimestamp(data.timestamp);
        sessionState.setLastUpdated(Date.now());
        io.to(data.sessionId).emit("receiveVideoState", { 
          isPlaying: false, 
          videoTimestamp: data.timestamp, 
          origin: "pause_video" 
        });
      }
    } catch (error) {
      socket.emit("error", { message: "Failed to update pause state" });
    }
  });

  socket.on("catch_up", (data) => {
    try {
      const sessionState = sessions.get(data.sessionId);
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
      socket.emit("error", { message: "Failed to process catch-up request" });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    // Optional: track client disconnections in session state
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});