"use client";

import React, { useRef, useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Image from "next/image";

interface BackgroundVideoProps {
  videoSrc: string;
  opacity?: number; // Valor entre 0 y 1
  filter?: string; // Por ejemplo: "blur(5px)" o "brightness(50%)"
}

const BackgroundVideo: React.FC<BackgroundVideoProps> = ({
  videoSrc,
  opacity = 0.5,
  filter = "brightness(50%)",
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoBlob, setVideoBlob] = useState<string | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        console.log("Fetching video from:", videoSrc);
        const response = await fetch(videoSrc);
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);
        console.log("Video fetched and blob URL created");
        setVideoBlob(videoUrl);
      } catch (error) {
        console.error("Error fetching video:", error);
      }
    };

    if (isDesktop) {
      fetchVideo();
    }

    return () => {
      if (videoBlob) {
        URL.revokeObjectURL(videoBlob);
      }
    };
  }, [videoSrc, isDesktop]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoBlob) return;

    const handleLoadedData = () => {
      console.log("Video data loaded");
      setIsVideoLoaded(true);
      video.currentTime = 0.1;
    };

    video.addEventListener("loadeddata", handleLoadedData);

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [videoBlob]);

  useEffect(() => {
    if (isVideoLoaded && videoRef.current) {
      console.log("Starting video playback");
      const timeoutId = setTimeout(() => {
        videoRef.current
          ?.play()
          .then(() => setShowVideo(true))
          .catch((error) => console.error("Error playing video:", error));
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [isVideoLoaded]);

  if (!isDesktop) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-[0]">
      {videoBlob && (
        <video
          ref={videoRef}
          className={`absolute min-w-full min-h-full object-cover transition-opacity duration-500 ${showVideo ? "opacity-100" : "opacity-0"}`}
          loop
          muted
          playsInline
          style={{
            opacity: opacity,
            filter: filter,
          }}
        >
          <source src={videoBlob} type="video/mp4" />
          Tu navegador no soporta el tag de video.
        </video>
      )}
    </div>
  );
};

export default BackgroundVideo;
