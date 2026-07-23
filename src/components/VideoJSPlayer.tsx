import React, { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

interface VideoJSPlayerProps {
  options: any;
  onReady?: (player: any) => void;
}

export const VideoJSPlayer: React.FC<VideoJSPlayerProps> = ({ options, onReady }) => {
  const videoRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Make sure Video.js player is initialized only once
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add("vjs-big-play-centered", "vjs-theme-forest", "vjs-fluid");
      
      if (videoRef.current) {
        videoRef.current.appendChild(videoElement);
      }

      const player = (playerRef.current = videojs(videoElement, options, () => {
        if (onReady) {
          onReady(player);
        }
      }));
    } else {
      const player = playerRef.current;
      if (options.autoplay !== undefined) {
        player.autoplay(options.autoplay);
      }
      if (options.sources) {
        player.src(options.sources);
      }
    }
  }, [options, onReady]);

  // Dispose player on unmount
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player className="w-full h-full flex items-center justify-center bg-black rounded-2xl overflow-hidden">
      <div ref={videoRef} className="w-full h-full" />
    </div>
  );
};

export default VideoJSPlayer;
