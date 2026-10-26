import React, { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

export interface SubtitleTrack {
  label: string;
  src: string;
  srcLang: string;
  default?: boolean;
}

interface VideoJSPlayerProps {
  options: any;
  initialTime?: number;
  subtitles?: SubtitleTrack[];
  onReady?: (player: any) => void;
  onError?: (error: any) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export const VideoJSPlayer: React.FC<VideoJSPlayerProps> = ({
  options,
  initialTime = 0,
  subtitles = [],
  onReady,
  onError,
  onTimeUpdate
}) => {
  const videoRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const lastReportedTime = useRef<number>(0);
  const hasSeekedInitial = useRef<boolean>(false);

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

      const mergedOptions = {
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        controlBar: {
          skipButtons: {
            forward: 10,
            backward: 10
          },
          subsCapsButton: true
        },
        html5: {
          vhs: {
            overrideNative: true,
            withCredentials: false
          },
          nativeAudioTracks: false,
          nativeVideoTracks: false
        },
        ...options
      };

      const player = (playerRef.current = videojs(videoElement, mergedOptions, () => {
        // Add subtitle tracks if available
        if (subtitles && subtitles.length > 0) {
          subtitles.forEach((sub) => {
            player.addRemoteTextTrack(
              {
                kind: "subtitles",
                label: sub.label,
                srclang: sub.srcLang,
                src: sub.src,
                default: sub.default || false
              },
              false
            );
          });
        }

        if (onReady) {
          onReady(player);
        }
      }));

      // Seek to initial time once playback is ready
      player.on("loadedmetadata", () => {
        if (initialTime > 0 && !hasSeekedInitial.current) {
          try {
            player.currentTime(initialTime);
            hasSeekedInitial.current = true;
          } catch (e) {
            console.warn("Could not seek to initial time:", e);
          }
        }
      });

      // Throttle time updates every 4 seconds to track playback progress
      player.on("timeupdate", () => {
        const current = player.currentTime();
        const duration = player.duration();
        if (onTimeUpdate && Math.abs(current - lastReportedTime.current) >= 4) {
          lastReportedTime.current = current;
          onTimeUpdate(current, duration || 0);
        }
      });

      player.on("pause", () => {
        const current = player.currentTime();
        const duration = player.duration();
        if (onTimeUpdate && current > 0) {
          onTimeUpdate(current, duration || 0);
        }
      });

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
          hasSeekedInitial.current = false;
          player.src(options.sources);
          player.load();
          if (options.autoplay) {
            player.play().catch(() => {
              // Ignore autoplay restrictions
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
        // Record final position on exit
        try {
          const current = player.currentTime();
          const duration = player.duration();
          if (onTimeUpdate && current > 0) {
            onTimeUpdate(current, duration || 0);
          }
        } catch (e) {
          // ignore
        }
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player className="w-full h-full flex items-center justify-center bg-black overflow-hidden relative">
      <div ref={videoRef} className="w-full h-full min-h-[320px]" />
    </div>
  );
};

export default VideoJSPlayer;
