class VideoState {
    constructor(sessionId, url = "") {
      this.sessionId = sessionId;
      this.url = url;
      this.isPlaying = true;
      this.videoTimestamp = 0;
      this.lastUpdated = Date.now();
      this.firstPlay = true;
    }
    
    updateTime(time) {
      this.currentTime = time;
      this.lastUpdated = Date.now();
    }
    
    setPlaying(isPlaying) {
      this.isPlaying = isPlaying;
    }

    setVideoTimestamp(timestamp) {
      this.videoTimestamp = timestamp;
    }

    setLastUpdated(lastUpdated) {
      this.lastUpdated = lastUpdated;
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