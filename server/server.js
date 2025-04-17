const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require('cors');
const VideoState = require('./VideoState');
const { v4: uuidv4 } = require('uuid');
app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const cache = new Map();

app.get('/', (req, res) => {
  console.log('Hello console working!');
  res.json({ message: 'Hello finally working!' });
});

app.post('/create_session', (req, res) => {
  const sessionId = uuidv4();
  const newState = new VideoState(sessionId);
  cache.set(sessionId, newState);
  console.log("created session", sessionId);
  newState.printState(); 
  res.json({ sessionId: sessionId, success: true });
});

io.on('connection', (socket) => {
  console.log(`a user connected: ${socket.id}`);
  console.log("len of cache", cache.size);
  
  // Get sessionId from query parameters if provided
  const sessionId = socket.handshake.query.sessionId;
  
  if (sessionId && cache.has(sessionId)) {
    console.log(`Client connected to session: ${sessionId}`);
    socket.join(sessionId);
  }
  
  // Play video event
  socket.on("play_video", (data) => {
    console.log("received play video event");
    console.log(data);
    const curObj = cache.get(data.sessionId);
    if (curObj) {
      curObj.setPlaying(true);
      curObj.setVideoTimestamp(data.timestamp);
      curObj.setLastUpdated(Date.now());
      io.to(data.sessionId).emit("receiveVideoState", { isPlaying: true, videoTimestamp: data.timestamp, origin: "play_video" });
    }
  });
  
  socket.on("pause_video", (data) => {
    console.log("received pause video event");
    console.log(data);
    const curObj = cache.get(data.sessionId);
    if (curObj) {
      curObj.setPlaying(false);
      curObj.setVideoTimestamp(data.timestamp);
      curObj.setLastUpdated(Date.now());
      io.to(data.sessionId).emit("receiveVideoState", { isPlaying: false, videoTimestamp: data.timestamp, origin: "pause_video" });
    }
  });

  socket.on("catch_up", (data) => {
    console.log("received catch up event");
    console.log(data);
    const curObj = cache.get(data.sessionId);
    if (curObj) {
      // Also join the room if not joined yet
      socket.join(data.sessionId);
      
      if (curObj.isPlaying && !curObj.firstPlay) {
        const elapsedSeconds = (Date.now() - curObj.lastUpdated) / 1000;
        socket.emit("receiveVideoState", { 
          isPlaying: true, 
          videoTimestamp: curObj.videoTimestamp + elapsedSeconds 
        });
      } else if (curObj.firstPlay) {
        curObj.firstPlay = false;
        curObj.setLastUpdated(Date.now());
        console.log("first play");
        socket.emit("receiveVideoState", { isPlaying: true, videoTimestamp: 0 , extra: "first play"});
      } else {
        socket.emit("receiveVideoState", { isPlaying: false, videoTimestamp: curObj.videoTimestamp });
      }
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`Socket ${socket.id} disconnected`);
  });
});

server.listen(3001, () => {
  console.log('listening on *:3001');
});