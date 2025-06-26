'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  Monitor, 
  MonitorOff,
  Phone,
  MessageSquare,
  Users,
  Settings,
  MoreVertical,
  Share2,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  PenTool,
  FileText,
  Copy,
  UserPlus,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { VideoGrid } from '@/components/meeting/video-grid';
import { ChatPanel } from '@/components/meeting/chat-panel';
import { ParticipantsList } from '@/components/meeting/participants-list';
import { ScreenShare } from '@/components/meeting/screen-share';
import { Whiteboard } from '@/components/meeting/whiteboard';
import { MeetingControls } from '@/components/meeting/meeting-controls';
import { MeetingTimer } from '@/components/meeting/meeting-timer';
import { useSocket } from '@/hooks/use-socket';
import { useWebRTC } from '@/hooks/use-webrtc';

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  joinedAt: Date;
  stream?: MediaStream;
}

export default function MeetingRoom() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;
  
  const [userName, setUserName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [meetingStartTime, setMeetingStartTime] = useState<Date | null>(null);
  const [screenShareParticipant, setScreenShareParticipant] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const { socket, isConnected } = useSocket(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
  const { 
    localStream, 
    remoteStreams, 
    screenStream,
    startVideo, 
    stopVideo, 
    startAudio, 
    stopAudio,
    startScreenShare,
    stopScreenShare,
    addRemoteStream,
    removeRemoteStream
  } = useWebRTC();

  useEffect(() => {
    const storedUserName = localStorage.getItem('userName');
    if (!storedUserName) {
      router.push('/');
      return;
    }
    setUserName(storedUserName);
  }, [router]);

  useEffect(() => {
    if (socket && userName && !isJoined) {
      socket.emit('join-meeting', { meetingId, userName });
      setIsJoined(true);
      setConnectionStatus('connected');
      setMeetingStartTime(new Date());
    }
  }, [socket, userName, meetingId, isJoined]);

  useEffect(() => {
    if (!socket) return;

    socket.on('user-joined', (participant: Participant) => {
      setParticipants(prev => [...prev, participant]);
      toast.success(`${participant.name} toplantıya katıldı`);
    });

    socket.on('user-left', (participantId: string) => {
      setParticipants(prev => {
        const participant = prev.find(p => p.id === participantId);
        if (participant) {
          toast.info(`${participant.name} toplantıdan ayrıldı`);
        }
        return prev.filter(p => p.id !== participantId);
      });
      removeRemoteStream(participantId);
    });

    socket.on('participants-list', (participantsList: Participant[]) => {
      setParticipants(participantsList);
    });

    socket.on('participant-audio-changed', ({ participantId, isMuted }) => {
      setParticipants(prev => prev.map(p => 
        p.id === participantId ? { ...p, isMuted } : p
      ));
    });

    socket.on('participant-video-changed', ({ participantId, isVideoOff }) => {
      setParticipants(prev => prev.map(p => 
        p.id === participantId ? { ...p, isVideoOff } : p
      ));
    });

    socket.on('screen-share-started', ({ participantId, participantName }) => {
      setScreenShareParticipant(participantId);
      toast.info(`${participantName} ekran paylaşımı başlattı`);
    });

    socket.on('screen-share-stopped', ({ participantId }) => {
      setScreenShareParticipant(null);
      toast.info('Ekran paylaşımı durduruldu');
    });

    // WebRTC signaling
    socket.on('offer', async ({ offer, senderId }) => {
      // Handle WebRTC offer
    });

    socket.on('answer', async ({ answer, senderId }) => {
      // Handle WebRTC answer
    });

    socket.on('ice-candidate', async ({ candidate, senderId }) => {
      // Handle ICE candidate
    });

    return () => {
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('participants-list');
      socket.off('participant-audio-changed');
      socket.off('participant-video-changed');
      socket.off('screen-share-started');
      socket.off('screen-share-stopped');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
    };
  }, [socket, removeRemoteStream]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleToggleMute = () => {
    if (isMuted) {
      startAudio();
    } else {
      stopAudio();
    }
    setIsMuted(!isMuted);
    
    socket?.emit('toggle-audio', { meetingId, isMuted: !isMuted });
  };

  const handleToggleVideo = () => {
    if (isVideoOff) {
      startVideo();
    } else {
      stopVideo();
    }
    setIsVideoOff(!isVideoOff);
    
    socket?.emit('toggle-video', { meetingId, isVideoOff: !isVideoOff });
  };

  const handleToggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        stopScreenShare();
        setIsScreenSharing(false);
        socket?.emit('stop-screen-share', { meetingId });
        toast.success('Ekran paylaşımı durduruldu');
      } else {
        await startScreenShare();
        setIsScreenSharing(true);
        socket?.emit('start-screen-share', { meetingId, userName });
        toast.success('Ekran paylaşımı başlatıldı');
      }
    } catch (error) {
      toast.error('Ekran paylaşımı başlatılamadı');
    }
  };

  const handleLeaveMeeting = () => {
    socket?.emit('leave-meeting', { meetingId });
    router.push('/');
  };

  const handleCopyMeetingId = () => {
    navigator.clipboard.writeText(meetingId);
    toast.success('Toplantı ID\'si kopyalandı!');
  };

  const handleInviteParticipants = () => {
    const meetingLink = `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(meetingLink);
    toast.success('Toplantı bağlantısı kopyalandı! Katılımcıları davet edebilirsiniz.');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!userName) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Toplantıya bağlanılıyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      <Toaster />
      
      {/* Meeting Header - Fixed positioning to avoid overlap */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-40 p-4 bg-gradient-to-b from-black/70 to-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ 
          right: isChatOpen || isParticipantsOpen ? '320px' : '0',
          transition: 'right 0.3s ease-in-out'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-white text-sm font-medium">
                Toplantı ID: {meetingId}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyMeetingId}
                className="text-white hover:bg-white/20 h-8 px-2"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            
            <Badge variant="secondary" className="bg-white/20 text-white">
              {participants.length + 1} Katılımcı
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleInviteParticipants}
              className="text-white hover:bg-white/20"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Davet Et
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Meeting Timer - Fixed position bottom left */}
      {meetingStartTime && (
        <MeetingTimer 
          startTime={meetingStartTime}
          className="fixed bottom-6 left-6 z-30"
        />
      )}

      {/* Main Content Area */}
      <div className="flex h-screen pt-20 pb-24">
        {/* Video Grid */}
        <div className="flex-1 relative">
          {screenShareParticipant && screenStream ? (
            <div className="relative h-full">
              {/* Screen Share Display */}
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <ScreenShare 
                  stream={screenStream} 
                  participantName={participants.find(p => p.id === screenShareParticipant)?.name || 'Unknown'}
                />
              </div>
              
              {/* Small video grid overlay */}
              <div className="absolute top-4 right-4 w-80 h-60 bg-gray-800 rounded-lg overflow-hidden">
                <VideoGrid 
                  localStream={localStream}
                  remoteStreams={remoteStreams}
                  participants={participants}
                  userName={userName}
                  isVideoOff={isVideoOff}
                  isCompact={true}
                />
              </div>
            </div>
          ) : (
            <VideoGrid 
              localStream={localStream}
              remoteStreams={remoteStreams}
              participants={participants}
              userName={userName}
              isVideoOff={isVideoOff}
              maxParticipants={10}
            />
          )}

          {/* Whiteboard Overlay */}
          <AnimatePresence>
            {isWhiteboardOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 z-30"
              >
                <Whiteboard onClose={() => setIsWhiteboardOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side Panels - Fixed width and positioning */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 z-50 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-hidden"
              style={{ width: '320px' }}
            >
              <ChatPanel 
                meetingId={meetingId}
                userName={userName}
                socket={socket}
                onClose={() => setIsChatOpen(false)}
              />
            </motion.div>
          )}

          {isParticipantsOpen && !isChatOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 z-50 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-hidden"
              style={{ width: '320px' }}
            >
              <ParticipantsList 
                participants={participants}
                currentUser={userName}
                onClose={() => setIsParticipantsOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Meeting Controls - Fixed position at bottom center */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <MeetingControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
          isChatOpen={isChatOpen}
          isParticipantsOpen={isParticipantsOpen}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleChat={() => {
            setIsChatOpen(!isChatOpen);
            if (isParticipantsOpen) setIsParticipantsOpen(false);
          }}
          onToggleParticipants={() => {
            setIsParticipantsOpen(!isParticipantsOpen);
            if (isChatOpen) setIsChatOpen(false);
          }}
          onToggleWhiteboard={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
          onLeaveMeeting={handleLeaveMeeting}
        />
      </div>
    </div>
  );
}