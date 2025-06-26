'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Monitor, User } from 'lucide-react';

interface ScreenShareProps {
  stream: MediaStream;
  participantName?: string;
}

export function ScreenShare({ stream, participantName }: ScreenShareProps) {
  const videoRef = useRef<HTMLVideoVideo>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full h-full bg-black flex items-center justify-center relative"
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
      />

      {/* Screen Share Indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-black/80 text-white rounded-lg backdrop-blur-sm">
        <Monitor className="w-5 h-5" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">Ekran Paylaşımı</span>
          {participantName && (
            <span className="text-xs text-gray-300">{participantName} tarafından</span>
          )}
        </div>
      </div>

      {/* Quality indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-black/80 text-white rounded-lg backdrop-blur-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs">HD</span>
      </div>
    </motion.div>
  );
}