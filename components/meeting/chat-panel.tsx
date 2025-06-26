'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  Download, 
  X, 
  Smile, 
  MoreVertical,
  Edit,
  Trash2,
  Reply,
  File,
  Image,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  replyTo?: string;
  isEdited?: boolean;
}

interface ChatPanelProps {
  meetingId: string;
  userName: string;
  socket: Socket | null;
  onClose: () => void;
}

export function ChatPanel({ meetingId, userName, socket, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('chat-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
    });

    socket.on('message-edited', ({ messageId, newText }: { messageId: string, newText: string }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, message: newText, isEdited: true }
          : msg
      ));
    });

    socket.on('message-deleted', (messageId: string) => {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    });

    socket.on('user-typing', (username: string) => {
      if (username !== userName) {
        setTypingUsers(prev => [...prev.filter(u => u !== username), username]);
      }
    });

    socket.on('user-stopped-typing', (username: string) => {
      setTypingUsers(prev => prev.filter(u => u !== username));
    });

    socket.on('chat-history', (history: ChatMessage[]) => {
      setMessages(history.map(msg => ({ ...msg, timestamp: new Date(msg.timestamp) })));
    });

    return () => {
      socket.off('chat-message');
      socket.off('message-edited');
      socket.off('message-deleted');
      socket.off('user-typing');
      socket.off('user-stopped-typing');
      socket.off('chat-history');
    };
  }, [socket, userName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: userName,
      message: newMessage,
      timestamp: new Date(),
      type: 'text',
      replyTo: replyTo?.id
    };

    socket.emit('chat-message', { meetingId, message });
    setNewMessage('');
    setReplyTo(null);
    handleStopTyping();
  };

  const handleEditMessage = (messageId: string, newText: string) => {
    if (!socket || !newText.trim()) return;

    socket.emit('edit-message', { meetingId, messageId, newText });
    setEditingMessage(null);
    setEditText('');
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!socket) return;
    socket.emit('delete-message', { meetingId, messageId });
  };

  const handleTyping = () => {
    if (!socket || isTyping) return;

    setIsTyping(true);
    socket.emit('typing', { meetingId, userName });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 3000);
  };

  const handleStopTyping = () => {
    if (!socket || !isTyping) return;

    setIsTyping(false);
    socket.emit('stop-typing', { meetingId, userName });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !socket) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dosya boyutu 10MB\'dan büyük olamaz');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('meetingId', meetingId);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { fileUrl } = await response.json();
        
        const message: ChatMessage = {
          id: Date.now().toString(),
          sender: userName,
          message: `${file.name} dosyası paylaşıldı`,
          timestamp: new Date(),
          type: 'file',
          fileUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        };

        socket.emit('chat-message', { meetingId, message });
        toast.success('Dosya başarıyla yüklendi');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('File upload failed:', error);
      toast.error('Dosya yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="w-4 h-4" />;
    
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sohbet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{messages.length} mesaj</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-3 group ${
                  message.sender === userName ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-blue-600 text-white text-xs">
                    {message.sender.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className={`flex flex-col max-w-[70%] ${
                  message.sender === userName ? 'items-end' : 'items-start'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {message.sender === userName ? 'Siz' : message.sender}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {formatDistanceToNow(message.timestamp, { addSuffix: true, locale: tr })}
                    </span>
                    {message.isEdited && (
                      <Badge variant="outline" className="text-xs">düzenlenmiş</Badge>
                    )}
                  </div>

                  {message.replyTo && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      Yanıtlanan mesaj
                    </div>
                  )}

                  <div className={`relative px-3 py-2 rounded-lg ${
                    message.sender === userName
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    {editingMessage === message.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEditMessage(message.id, editText);
                            }
                          }}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditMessage(message.id, editText)}
                          >
                            Kaydet
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingMessage(null);
                              setEditText('');
                            }}
                          >
                            İptal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {message.type === 'file' ? (
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className="flex-shrink-0">
                              {getFileIcon(message.fileType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{message.fileName}</p>
                              <p className="text-xs opacity-70">
                                {message.fileSize && formatFileSize(message.fileSize)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (message.fileUrl && message.fileName) {
                                  handleDownloadFile(message.fileUrl, message.fileName);
                                }
                              }}
                              className="flex-shrink-0 hover:bg-white/20"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                        )}

                        {message.sender === userName && message.type === 'text' && (
                          <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingMessage(message.id);
                                setEditText(message.message);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {message.sender !== userName && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 text-xs h-6"
                      onClick={() => setReplyTo(message)}
                    >
                      <Reply className="w-3 h-3 mr-1" />
                      Yanıtla
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
            >
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span>{typingUsers.join(', ')} yazıyor...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Reply Preview */}
      {replyTo && (
        <div className="p-2 mx-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-2 border-blue-500">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400">{replyTo.sender} kullanıcısına yanıt</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{replyTo.message}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyTo(null)}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-shrink-0"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>

          <div className="flex-1 relative">
            <Input
              placeholder="Mesajınızı yazın..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="pr-12"
              disabled={isUploading}
            />
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isUploading}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          accept="*/*"
        />
      </div>
    </div>
  );
}