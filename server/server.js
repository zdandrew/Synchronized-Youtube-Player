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
  // Play video event
  socket.on("play_video", (data) => {
    console.log("received play video event");
    console.log(data);
    const curObj = cache.get(data.sessionId);
    curObj.setPlaying(true);
    curObj.setVideoTimestamp(data.timestamp);
    curObj.setLastUpdated(Date.now());
    io.emit("receiveVideoState", { isPlaying: true, videoTimestamp: data.timestamp });
  });
  
  socket.on("pause_video", (data) => {
    console.log("received pause video event");
    console.log(data);
    const curObj = cache.get(data.sessionId);
    curObj.setPlaying(false);
    curObj.setVideoTimestamp(data.timestamp);
    curObj.setLastUpdated(Date.now());
    io.emit("receiveVideoState", { isPlaying: false, videoTimestamp: data.timestamp});
  });

  socket.on("catch_up", (data) => {
    console.log("received catch up event");
    console.log(data);
    const curObj = cache.get(data.sessionId);
    if (curObj.isPlaying) {
      io.emit("receiveVideoState", { isPlaying: true, videoTimestamp: curObj.videoTimestamp + Date.now() - curObj.lastUpdated });
    } else {
      io.emit("receiveVideoState", { isPlaying: false, videoTimestamp: curObj.videoTimestamp });
    }  
  });



});

// io.on('disconnect', (socket) => {
//   console.log('user disconnected');
// });

server.listen(3001, () => {
  console.log('listening on *:3001');
});