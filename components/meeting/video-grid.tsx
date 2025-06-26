'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Camera, CameraOff, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  joinedAt: Date;
}

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  participants: Participant[];
  userName: string;
  isVideoOff: boolean;
}

export function VideoGrid({ 
  localStream, 
  remoteStreams, 
  participants, 
  userName, 
  isVideoOff 
}: VideoGridProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Record<string, HTMLVideoElement>>({});

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    Object.entries(remoteStreams).forEach(([participantId, stream]) => {
      const videoElement = remoteVideoRefs.current[participantId];
      if (videoElement && stream) {
        videoElement.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  const allParticipants = [
    { id: 'local', name: userName, isHost: true, isMuted: false, isVideoOff, joinedAt: new Date() },
    ...participants
  ];

  const getGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2 grid-rows-2';
    if (count <= 6) return 'grid-cols-3 grid-rows-2';
    if (count <= 9) return 'grid-cols-3 grid-rows-3';
    return 'grid-cols-4 grid-rows-3';
  };

  return (
    <div className="w-full h-full p-4">
      <div className={`grid ${getGridClass(allParticipants.length)} gap-4 h-full`}>
        {allParticipants.map((participant, index) => (
          <motion.div
            key={participant.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="relative bg-gray-800 rounded-xl overflow-hidden group hover:ring-2 hover:ring-blue-500 transition-all"
          >
            {/* Video Element */}
            {participant.id === 'local' ? (
              isVideoOff ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <Avatar className="w-20 h-20">
                    <AvatarFallback className="bg-blue-600 text-white text-2xl font-semibold">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              participant.isVideoOff ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <Avatar className="w-20 h-20">
                    <AvatarFallback className="bg-gray-600 text-white text-2xl font-semibold">
                      {participant.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <video
                  ref={(el) => {
                    if (el) remoteVideoRefs.current[participant.id] = el;
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              )
            )}

            {/* Participant Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">
                    {participant.id === 'local' ? 'Siz' : participant.name}
                  </span>
                  {participant.isHost && (
                    <Badge variant="secondary" className="text-xs bg-blue-600 text-white">
                      Host
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {participant.isMuted ? (
                    <div className="p-1 bg-red-500 rounded-full">
                      <MicOff className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <div className="p-1 bg-green-500 rounded-full">
                      <Mic className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  {participant.isVideoOff && (
                    <div className="p-1 bg-red-500 rounded-full">
                      <CameraOff className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="absolute top-3 right-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}