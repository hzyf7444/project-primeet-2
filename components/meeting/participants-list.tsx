'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Crown, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  MoreVertical,
  UserX,
  Shield,
  VolumeX,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  joinedAt: Date;
}

interface ParticipantsListProps {
  participants: Participant[];
  currentUser: string;
  onClose: () => void;
}

export function ParticipantsList({ participants, currentUser, onClose }: ParticipantsListProps) {
  const [mutedParticipants, setMutedParticipants] = useState<Set<string>>(new Set());

  const allParticipants = [
    { 
      id: 'current', 
      name: currentUser, 
      isHost: true, 
      isMuted: false, 
      isVideoOff: false, 
      joinedAt: new Date() 
    },
    ...participants
  ];

  const handleMuteParticipant = (participantId: string) => {
    setMutedParticipants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(participantId)) {
        newSet.delete(participantId);
      } else {
        newSet.add(participantId);
      }
      return newSet;
    });
  };

  const handleRemoveParticipant = (participantId: string) => {
    // Implementation for removing participant
    console.log('Remove participant:', participantId);
  };

  const handleMakeHost = (participantId: string) => {
    // Implementation for making participant host
    console.log('Make host:', participantId);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Katılımcılar</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {allParticipants.length} kişi
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Participants List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {allParticipants.map((participant) => (
            <motion.div
              key={participant.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-blue-600 text-white font-semibold">
                      {participant.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Connection Status */}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {participant.id === 'current' ? 'Siz' : participant.name}
                    </p>
                    
                    {participant.isHost && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <Crown className="w-3 h-3 mr-1" />
                        Host
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(participant.joinedAt, { addSuffix: true, locale: tr })} katıldı
                  </p>
                </div>
              </div>

              {/* Status Icons */}
              <div className="flex items-center gap-2">
                {participant.isMuted || mutedParticipants.has(participant.id) ? (
                  <div className="p-1 bg-red-100 dark:bg-red-900 rounded-full">
                    <MicOff className="w-3 h-3 text-red-600 dark:text-red-400" />
                  </div>
                ) : (
                  <div className="p-1 bg-green-100 dark:bg-green-900 rounded-full">
                    <Mic className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                )}

                {participant.isVideoOff ? (
                  <div className="p-1 bg-red-100 dark:bg-red-900 rounded-full">
                    <CameraOff className="w-3 h-3 text-red-600 dark:text-red-400" />
                  </div>
                ) : (
                  <div className="p-1 bg-green-100 dark:bg-green-900 rounded-full">
                    <Camera className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                )}

                {/* Actions Menu (only for host and not current user) */}
                {participant.id !== 'current' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleMuteParticipant(participant.id)}>
                        {mutedParticipants.has(participant.id) ? (
                          <>
                            <Volume2 className="w-4 h-4 mr-2" />
                            Sesini Aç
                          </>
                        ) : (
                          <>
                            <VolumeX className="w-4 h-4 mr-2" />
                            Sesini Kapat
                          </>
                        )}
                      </DropdownMenuItem>
                      
                      {!participant.isHost && (
                        <DropdownMenuItem onClick={() => handleMakeHost(participant.id)}>
                          <Crown className="w-4 h-4 mr-2" />
                          Host Yap
                        </DropdownMenuItem>
                      )}
                      
                      <Separator />
                      
                      <DropdownMenuItem 
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Toplantıdan Çıkar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>Toplantı süresi: {formatDistanceToNow(new Date(Date.now() - 30 * 60 * 1000), { locale: tr })}</p>
        </div>
      </div>
    </div>
  );
}