class VideoState {
    constructor(sessionId, url = "") {
      this.sessionId = sessionId;
      this.url = url;
      this.isPlaying = true;
      this.videoTimestamp = 0;
      this.lastUpdated = Date.now();
      this.connectedClients = [];
    }
    
    updateTime(time) {
      this.currentTime = time;
      this.lastUpdated = Date.now();
    }
    
    setPlaying(isPlaying) {
      this.isPlaying = isPlaying;
    }
    
    addClient(clientId) {
      if (!this.connectedClients.includes(clientId)) {
        this.connectedClients.push(clientId);
      }
    }

    setVideoTimestamp(timestamp) {
      this.videoTimestamp = timestamp;
    }

    setLastUpdated(lastUpdated) {
      this.lastUpdated = lastUpdated;
    }
    
    removeClient(clientId) {
      this.connectedClients = this.connectedClients.filter(id => id !== clientId);
      return this.connectedClients.length;
    }

    printState() {
      console.log("Session ID: ", this.sessionId);
      console.log("URL: ", this.url);
      console.log("Is playing: ", this.isPlaying);
      console.log("Video timestamp: ", this.videoTimestamp);
      console.log("Last updated: ", this.lastUpdated);
    }   
  }
  
  module.exports = VideoState;