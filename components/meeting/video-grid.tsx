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
  stream?: MediaStream;
}

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  participants: Participant[];
  userName: string;
  isVideoOff: boolean;
  maxParticipants?: number;
  isCompact?: boolean;
}

export function VideoGrid({ 
  localStream, 
  remoteStreams, 
  participants, 
  userName, 
  isVideoOff,
  maxParticipants = 10,
  isCompact = false
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
    ...participants.slice(0, maxParticipants - 1)
  ];

  const getGridClass = (count: number, compact: boolean = false) => {
    if (compact) {
      if (count <= 2) return 'grid-cols-2';
      if (count <= 4) return 'grid-cols-2 grid-rows-2';
      return 'grid-cols-3 grid-rows-2';
    }

    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2 grid-rows-2';
    if (count <= 6) return 'grid-cols-3 grid-rows-2';
    if (count <= 9) return 'grid-cols-3 grid-rows-3';
    return 'grid-cols-4 grid-rows-3';
  };

  const getVideoSize = (count: number, compact: boolean = false) => {
    if (compact) return 'min-h-[60px]';
    
    if (count === 1) return 'min-h-[400px]';
    if (count <= 4) return 'min-h-[300px]';
    if (count <= 9) return 'min-h-[200px]';
    return 'min-h-[150px]';
  };

  return (
    <div className={`w-full h-full ${isCompact ? 'p-2' : 'p-4'}`}>
      <div className={`grid ${getGridClass(allParticipants.length, isCompact)} gap-${isCompact ? '2' : '4'} h-full`}>
        {allParticipants.map((participant, index) => (
          <motion.div
            key={participant.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`relative bg-gray-800 rounded-xl overflow-hidden group hover:ring-2 hover:ring-blue-500 transition-all ${getVideoSize(allParticipants.length, isCompact)}`}
          >
            {/* Video Element */}
            {participant.id === 'local' ? (
              isVideoOff ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <Avatar className={isCompact ? "w-8 h-8" : "w-20 h-20"}>
                    <AvatarFallback className="bg-blue-600 text-white font-semibold" style={{ fontSize: isCompact ? '12px' : '24px' }}>
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
                  <Avatar className={isCompact ? "w-8 h-8" : "w-20 h-20"}>
                    <AvatarFallback className="bg-gray-600 text-white font-semibold" style={{ fontSize: isCompact ? '12px' : '24px' }}>
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
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className={`text-white font-medium ${isCompact ? 'text-xs' : 'text-sm'}`}>
                    {participant.id === 'local' ? 'Siz' : participant.name}
                  </span>
                  {participant.isHost && !isCompact && (
                    <Badge variant="secondary" className="text-xs bg-blue-600 text-white">
                      Host
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {participant.isMuted ? (
                    <div className={`p-1 bg-red-500 rounded-full ${isCompact ? 'p-0.5' : 'p-1'}`}>
                      <MicOff className={`text-white ${isCompact ? 'w-2 h-2' : 'w-3 h-3'}`} />
                    </div>
                  ) : (
                    <div className={`p-1 bg-green-500 rounded-full ${isCompact ? 'p-0.5' : 'p-1'}`}>
                      <Mic className={`text-white ${isCompact ? 'w-2 h-2' : 'w-3 h-3'}`} />
                    </div>
                  )}
                  
                  {participant.isVideoOff && (
                    <div className={`p-1 bg-red-500 rounded-full ${isCompact ? 'p-0.5' : 'p-1'}`}>
                      <CameraOff className={`text-white ${isCompact ? 'w-2 h-2' : 'w-3 h-3'}`} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="absolute top-2 right-2">
              <div className={`bg-green-500 rounded-full animate-pulse ${isCompact ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Participant count indicator for compact view */}
      {isCompact && participants.length > maxParticipants - 1 && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          +{participants.length - (maxParticipants - 1)} daha
        </div>
      )}
    </div>
  );
}