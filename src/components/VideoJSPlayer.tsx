import React, { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

interface VideoJSPlayerProps {
  options: any;
  onReady?: (player: any) => void;
  onError?: (error: any) => void;
}

export const VideoJSPlayer: React.FC<VideoJSPlayerProps> = ({ options, onReady, onError }) => {
  const videoRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Make sure Video.js player is initialized only once
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add(
        "vjs-big-play-centered",
        "vjs-theme-forest",
        "vjs-fluid",
        "w-full",
        "h-full"
      );

      if (videoRef.current) {
        videoRef.current.appendChild(videoElement);
      }

      const player = (playerRef.current = videojs(videoElement, options, () => {
        if (onReady) {
          onReady(player);
        }
      }));

      player.on("error", () => {
        const err = player.error();
        console.warn("Video.js Player Error:", err);
        if (onError) {
          onError(err);
        }
      });
    } else {
      const player = playerRef.current;
      if (options.autoplay !== undefined) {
        player.autoplay(options.autoplay);
      }
      if (options.sources) {
        try {
          player.src(options.sources);
          player.load();
          if (options.autoplay) {
            player.play().catch(() => {
              // Ignore browser autoplay restrictions
            });
          }
        } catch (e) {
          console.warn("Error setting VideoJS source:", e);
        }
      }
    }
  }, [options, onReady, onError]);

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
    <div data-vjs-player className="w-full h-full flex items-center justify-center bg-black overflow-hidden relative">
      <div ref={videoRef} className="w-full h-full min-h-[300px]" />
    </div>
  );
};

export default VideoJSPlayer;
