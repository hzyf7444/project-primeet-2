'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Monitor } from 'lucide-react';

interface ScreenShareProps {
  stream: MediaStream;
}

export function ScreenShare({ stream }: ScreenShareProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

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
        className="max-w-full max-h-full object-contain"
      />

      {/* Screen Share Indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-black/70 text-white rounded-lg">
        <Monitor className="w-4 h-4" />
        <span className="text-sm font-medium">Ekran Paylaşımı</span>
      </div>
    </motion.div>
  );
}