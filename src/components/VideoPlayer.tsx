import { Box, Button } from "@mui/material";
import React, { useRef, useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { io, Socket } from "socket.io-client";

interface VideoPlayerProps {
  url: string;
  hideControls?: boolean;
  sessionId: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, hideControls, sessionId }) => {
  const [hasJoined, setHasJoined] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const receivedPlayRef = useRef(false);
  const receivedPauseRef = useRef(false);
  const lastSecondRef = useRef(0);
  const isFirstPlayRef = useRef(true);
  const isBufferingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const player = useRef<ReactPlayer>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    console.log("Connecting socket");
    const socket = io(`http://localhost:3001?sessionId=${sessionId}`);
    socketRef.current = socket;

    return () => {
      console.log("Disconnecting socket");
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;
    
    const handleVideoState = (data: any) => {
      console.log("Current states:", {hasJoined, isPlaying, data});
      
      // Get current player time
      const currentTime = player.current?.getCurrentTime() || 0;
      
      // Set a threshold (in seconds) for when to seek
      const SEEK_THRESHOLD = 2; // Adjust this value as needed
      isFirstPlayRef.current = false;
  
      
      // Check if we need to seek based on timestamp difference
      if (data.videoTimestamp !== undefined && Math.abs(currentTime - data.videoTimestamp) > SEEK_THRESHOLD) {
        console.log(`Difference (${Math.abs(currentTime - data.videoTimestamp)}) > threshold, seeking to:`, data.videoTimestamp);
        player.current?.seekTo(data.videoTimestamp);
      } else if (data.videoTimestamp !== undefined) {
        console.log(`Timestamp difference (${Math.abs(currentTime - data.videoTimestamp)}) within threshold, not seeking`);
      }
      
      // Handle play/pause state
      receivedPauseRef.current = false;
      if (data.isPlaying && !isPlaying) {
        console.log("setting received play to true");
        receivedPlayRef.current = true;
        setIsPlaying(true);
      } else if (!data.isPlaying && isPlaying) {
        receivedPauseRef.current = true;
        setIsPlaying(false);
      }
    };

    socketRef.current.on("receiveVideoState", handleVideoState);
    
    return () => {
      socketRef.current?.off("receiveVideoState", handleVideoState);
    };
  }, [hasJoined, isPlaying]);
  

  const handleReady = () => {
    console.log("handleReady");
    setIsReady(true);
  };

  const handleEnd = () => {
    console.log("Video ended");
  };

  const handleSeek = (seconds: number) => {
    // Ideally, the seek event would be fired whenever the user moves the built in Youtube video slider to a new timestamp.
    // However, the youtube API no longer supports seek events (https://github.com/cookpete/react-player/issues/356), so this no longer works

    // You'll need to find a different way to detect seeks (or just write your own seek slider and replace the built in Youtube one.)
    // Note that when you move the slider, you still get play, pause, buffer, and progress events, can you use those?

    console.log(
      "This never prints because seek decetion doesn't work: ",
      seconds
    );
  };

  const handlePlay = () => {
    console.log("receivedPlay", receivedPlayRef.current);
    if (isFirstPlayRef.current) {
      console.log("First play skipping play handler");
      return;
    }
    if (receivedPlayRef.current) {
      receivedPlayRef.current = false;
      console.log("skipped play handler");
      return;
    }
    setIsPlaying(true);
    isFirstPlayRef.current = false;
    console.log(
      "User played video at time: ",
      player.current?.getCurrentTime()
    );

    console.log("emitting play video event");
    socketRef.current?.emit("play_video", { 
      timestamp: player.current?.getCurrentTime(),
      sessionId: sessionId
    });
    
  };

  const handlePause = () => {
    console.log("in pause handler");
    if (isFirstPlayRef.current) {
      console.log("First play skipping pause handler");
      return;
    }
    if (receivedPauseRef.current) {
      receivedPauseRef.current = false;
      return;
    }
    setIsPlaying(false);
    isFirstPlayRef.current = false;
    console.log(
      "User paused video at time: ",
      player.current?.getCurrentTime()
    );
    console.log("emitting pause video event");
    socketRef.current?.emit("pause_video", { 
      timestamp: player.current?.getCurrentTime(),
      sessionId: sessionId
    });
    
  };

  const handleBuffer = () => {
    console.log("Video buffered");
    receivedPauseRef.current = true;
    isBufferingRef.current = true;
    setIsPlaying(false);
  };

  const handleBufferEnd = () => {
    console.log("Buffer ended");
    receivedPauseRef.current = false;
    isBufferingRef.current = false;
    setIsPlaying(true);
  };

  const handleProgress = (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
    loadedSeconds: number;
  }) => {
    console.log("Video progress: ", state);
    if (isFirstPlayRef.current) {
      console.log("First play skipping progress handler");
      return;
    }
    if (state.playedSeconds >= 0 && isPlaying) {
      console.log("Progress handler - catching up");
      socketRef.current?.emit("catch_up", { 
        timestamp: state.playedSeconds,
        sessionId: sessionId
      });
    } 
    else if (player.current && !isPlaying && !isBufferingRef.current && Math.abs(player.current.getCurrentTime() - lastSecondRef.current) > 2) {
      console.log("Progress handler - Seeking in Pause");
      socketRef.current?.emit("pause_video", { 
        timestamp: player.current?.getCurrentTime(),
        sessionId: sessionId
      });
    }
    lastSecondRef.current = state.playedSeconds;
  };

  const handleButtonClick = () => {
    setHasJoined(true);
    socketRef.current?.emit("catch_up", { 
      timestamp: player.current?.getCurrentTime(),
      sessionId: sessionId
    });
  };

  return (
    <Box
      width="100%"
      height="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
    >
      <Box
        width="100%"
        height="100%"
        display={hasJoined ? "flex" : "none"}
        flexDirection="column"
      >
        <ReactPlayer
          ref={player}
          url={url}
          playing={hasJoined && isPlaying}
          controls={!hideControls}
          onReady={handleReady}
          onEnded={handleEnd}
          onSeek={handleSeek}
          onPlay={handlePlay}
          onPause={handlePause}
          onBuffer={handleBuffer}
          onBufferEnd={handleBufferEnd}
          onProgress={handleProgress}
          width="100%"
          height="100%"
          style={{ pointerEvents: hideControls ? "none" : "auto" }}
        />
      </Box>
      {!hasJoined && isReady && (
        // Youtube doesn't allow autoplay unless you've interacted with the page already
        // So we make the user click "Join Session" button and then start playing the video immediately after
        // This is necessary so that when people join a session, they can seek to the same timestamp and start watching the video with everyone else
        <Button
          variant="contained"
          size="large"
          onClick={handleButtonClick}
        >
          Watch Session
        </Button>
      )}
    </Box>
  );
};

export default VideoPlayer;
