const redis = require('redis');
const VideoState = require('../VideoState');

class RedisSessionManager {
  constructor(redisUrl = 'redis://localhost:6379') {
    // Create Redis client
    this.client = redis.createClient({
      url: redisUrl
    });
    
    // Handle Redis connection events
    this.client.on('error', (err) => console.error('Redis Error:', err));
    this.client.on('connect', () => console.log('Connected to Redis'));
    
    // Connect to Redis
    this.connect();
  }
  
  async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }
  
  async disconnect() {
    try {
      console.log('Closing Redis connection...');
      await this.client.quit();
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }
  
  async getSession(sessionId) {
    const data = await this.client.get(`session:${sessionId}`);
    if (!data) return null;
    
    // Convert JSON to VideoState object
    const sessionData = JSON.parse(data);
    const state = new VideoState(sessionId);
    Object.assign(state, sessionData);
    return state;
  }
  
  async setSession(sessionId, sessionState) {
    await this.client.set(`session:${sessionId}`, JSON.stringify(sessionState));
  }
  
  async hasSession(sessionId) {
    return await this.client.exists(`session:${sessionId}`) === 1;
  }
  
  async getAllSessions() {
    const keys = await this.client.keys('session:*');
    const sessions = [];
    
    for (const key of keys) {
      const sessionId = key.replace('session:', '');
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push([sessionId, session]);
      }
    }
    
    return sessions;
  }
}

module.exports = RedisSessionManager; 