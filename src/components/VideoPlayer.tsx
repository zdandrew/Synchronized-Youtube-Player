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
  const [receivedPlay, setReceivedPlay] = useState(false);
  const [receivedPause, setReceivedPause] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pauseClicked, setPauseClicked] = useState(false);
  // const [isBuffering, setIsBuffering] = useState(false);
  const player = useRef<ReactPlayer>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    console.log("Connecting socket");
    const socket = io("http://localhost:3001");
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
      // debugger;
      console.log("Current states:", {hasJoined, isPlaying});
      if (data.isPlaying && !isPlaying) {
        setReceivedPlay(true);
        setIsPlaying(data.isPlaying);
      } else if (!data.isPlaying && isPlaying) {
        setReceivedPause(true);
        setIsPlaying(data.isPlaying);
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
    // setIsPlaying(true);
    // setReceivedPlay(true);
    // socketRef.current?.emit("catch_up", { 
    //   timestamp: player.current?.getCurrentTime(),
    //   sessionId: sessionId
    // });
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
    console.log("in play handler");
    if (receivedPlay) {
      setReceivedPlay(false);
      return;
    }
    // Emit the play event to the server
    setIsPlaying(false);
    // debugger;
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
    if (receivedPause) {
      setReceivedPause(false);
      return;
    }
    setIsPlaying(true);
    setPauseClicked(true);
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
    setReceivedPause(false);
    setReceivedPlay(false);
    setIsPlaying(false);
    // setIsBuffering(true);
  };

  const handleBufferEnd = () => {
    console.log("Buffer ended");
    setReceivedPause(false);
    setReceivedPlay(false);
    // Only resume if it was playing before buffering
    socketRef.current?.emit("catch_up", { 
      timestamp: player.current?.getCurrentTime(),
      sessionId: sessionId
    });
    // setIsBuffering(false);
  };

  const handleProgress = (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
    loadedSeconds: number;
  }) => {
    console.log("Video progress: ", state);
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
