'use client';

import { motion } from 'framer-motion';
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
  PenTool,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MeetingControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleWhiteboard: () => void;
  onLeaveMeeting: () => void;
}

export function MeetingControls({
  isMuted,
  isVideoOff,
  isScreenSharing,
  isChatOpen,
  isParticipantsOpen,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onToggleWhiteboard,
  onLeaveMeeting,
}: MeetingControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40"
    >
      <div className="flex items-center gap-3 px-6 py-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-full shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Audio Control */}
        <Button
          variant={isMuted ? "destructive" : "default"}
          size="lg"
          onClick={onToggleMute}
          className="rounded-full w-12 h-12 p-0"
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        {/* Video Control */}
        <Button
          variant={isVideoOff ? "destructive" : "default"}
          size="lg"
          onClick={onToggleVideo}
          className="rounded-full w-12 h-12 p-0"
        >
          {isVideoOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
        </Button>

        {/* Screen Share */}
        <Button
          variant={isScreenSharing ? "default" : "outline"}
          size="lg"
          onClick={onToggleScreenShare}
          className="rounded-full w-12 h-12 p-0"
        >
          {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </Button>

        {/* Chat */}
        <Button
          variant={isChatOpen ? "default" : "outline"}
          size="lg"
          onClick={onToggleChat}
          className="rounded-full w-12 h-12 p-0"
        >
          <MessageSquare className="w-5 h-5" />
        </Button>

        {/* Participants */}
        <Button
          variant={isParticipantsOpen ? "default" : "outline"}
          size="lg"
          onClick={onToggleParticipants}
          className="rounded-full w-12 h-12 p-0"
        >
          <Users className="w-5 h-5" />
        </Button>

        {/* Whiteboard */}
        <Button
          variant="outline"
          size="lg"
          onClick={onToggleWhiteboard}
          className="rounded-full w-12 h-12 p-0"
        >
          <PenTool className="w-5 h-5" />
        </Button>

        {/* More Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-12 h-12 p-0"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" sideOffset={10}>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Ayarlar
            </DropdownMenuItem>
            <DropdownMenuItem>
              Toplantıyı Kaydet
            </DropdownMenuItem>
            <DropdownMenuItem>
              Tam Ekran
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Leave Meeting */}
        <Button
          variant="destructive"
          size="lg"
          onClick={onLeaveMeeting}
          className="rounded-full w-12 h-12 p-0 ml-2"
        >
          <Phone className="w-5 h-5 rotate-[135deg]" />
        </Button>
      </div>
    </motion.div>
  );
}