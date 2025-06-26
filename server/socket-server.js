const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const httpServer = createServer();

// Enhanced CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000", 
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001"
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store meeting data
const meetings = new Map();
const participants = new Map();

// Helper function to clean up empty meetings
const cleanupMeeting = (meetingId) => {
  const meeting = meetings.get(meetingId);
  if (meeting && meeting.participants.size === 0) {
    meetings.delete(meetingId);
    console.log(`Meeting ${meetingId} cleaned up`);
  }
};

// Helper function to broadcast to meeting
const broadcastToMeeting = (meetingId, event, data, excludeSocket = null) => {
  const meeting = meetings.get(meetingId);
  if (!meeting) return;

  meeting.participants.forEach(participantId => {
    const socket = io.sockets.sockets.get(participantId);
    if (socket && socket !== excludeSocket) {
      socket.emit(event, data);
    }
  });
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send connection confirmation
  socket.emit('connected', { socketId: socket.id });

  socket.on('join-meeting', ({ meetingId, userName }) => {
    console.log(`${userName} attempting to join meeting ${meetingId}`);
    
    socket.join(meetingId);
    
    // Store participant info
    const participant = {
      id: socket.id,
      name: userName,
      meetingId,
      isHost: false,
      isMuted: false,
      isVideoOff: false,
      joinedAt: new Date()
    };

    participants.set(socket.id, participant);

    // Initialize meeting if it doesn't exist
    if (!meetings.has(meetingId)) {
      meetings.set(meetingId, {
        id: meetingId,
        participants: new Set([socket.id]),
        messages: [],
        createdAt: new Date(),
        screenShareParticipant: null
      });
      participant.isHost = true;
      console.log(`Meeting ${meetingId} created with host ${userName}`);
    } else {
      const meeting = meetings.get(meetingId);
      meeting.participants.add(socket.id);
      
      // If first participant is host
      if (meeting.participants.size === 1) {
        participant.isHost = true;
      }
    }

    // Notify others about new participant
    socket.to(meetingId).emit('user-joined', participant);

    // Send current participants list to new user
    const meeting = meetings.get(meetingId);
    const participantsList = Array.from(meeting.participants)
      .map(id => participants.get(id))
      .filter(Boolean);
    
    socket.emit('participants-list', participantsList);

    // Send chat history to new user
    socket.emit('chat-history', meeting.messages);

    // Send join confirmation
    socket.emit('join-confirmed', { 
      meetingId, 
      participantId: socket.id,
      isHost: participant.isHost 
    });

    console.log(`${userName} joined meeting ${meetingId} (${meeting.participants.size} participants)`);
  });

  socket.on('leave-meeting', ({ meetingId }) => {
    const participant = participants.get(socket.id);
    if (!participant) return;

    console.log(`${participant.name} leaving meeting ${meetingId}`);

    socket.leave(meetingId);
    socket.to(meetingId).emit('user-left', socket.id);

    // Remove participant from meeting
    const meeting = meetings.get(meetingId);
    if (meeting) {
      meeting.participants.delete(socket.id);
      
      // If this was the screen sharing participant, stop screen share
      if (meeting.screenShareParticipant === socket.id) {
        meeting.screenShareParticipant = null;
        socket.to(meetingId).emit('screen-share-stopped', { participantId: socket.id });
      }
      
      // Clean up empty meetings
      cleanupMeeting(meetingId);
    }

    participants.delete(socket.id);
    console.log(`${participant.name} left meeting ${meetingId}`);
  });

  // Enhanced chat functionality
  socket.on('chat-message', ({ meetingId, message }) => {
    console.log(`Chat message in ${meetingId} from ${message.sender}: ${message.message}`);
    
    const meeting = meetings.get(meetingId);
    if (meeting) {
      const messageWithTimestamp = {
        ...message,
        timestamp: new Date(),
        id: message.id || Date.now().toString()
      };
      
      meeting.messages.push(messageWithTimestamp);
      
      // Broadcast to all participants in the meeting
      io.to(meetingId).emit('chat-message', messageWithTimestamp);
      console.log(`Message broadcasted to ${meeting.participants.size} participants`);
    } else {
      console.error(`Meeting ${meetingId} not found for chat message`);
    }
  });

  socket.on('edit-message', ({ meetingId, messageId, newText }) => {
    const meeting = meetings.get(meetingId);
    if (meeting) {
      const message = meeting.messages.find(m => m.id === messageId);
      if (message && message.sender === participants.get(socket.id)?.name) {
        message.message = newText;
        message.isEdited = true;
        io.to(meetingId).emit('message-edited', { messageId, newText });
        console.log(`Message ${messageId} edited in meeting ${meetingId}`);
      }
    }
  });

  socket.on('delete-message', ({ meetingId, messageId }) => {
    const meeting = meetings.get(meetingId);
    const participant = participants.get(socket.id);
    if (meeting && participant) {
      const messageIndex = meeting.messages.findIndex(m => 
        m.id === messageId && m.sender === participant.name
      );
      if (messageIndex !== -1) {
        meeting.messages.splice(messageIndex, 1);
        io.to(meetingId).emit('message-deleted', messageId);
        console.log(`Message ${messageId} deleted in meeting ${meetingId}`);
      }
    }
  });

  // Typing indicators
  socket.on('typing', ({ meetingId, userName }) => {
    socket.to(meetingId).emit('user-typing', userName);
  });

  socket.on('stop-typing', ({ meetingId, userName }) => {
    socket.to(meetingId).emit('user-stopped-typing', userName);
  });

  // Enhanced media controls
  socket.on('toggle-audio', ({ meetingId, isMuted }) => {
    const participant = participants.get(socket.id);
    if (participant) {
      participant.isMuted = isMuted;
      socket.to(meetingId).emit('participant-audio-changed', {
        participantId: socket.id,
        isMuted
      });
      console.log(`${participant.name} ${isMuted ? 'muted' : 'unmuted'} audio`);
    }
  });

  socket.on('toggle-video', ({ meetingId, isVideoOff }) => {
    const participant = participants.get(socket.id);
    if (participant) {
      participant.isVideoOff = isVideoOff;
      socket.to(meetingId).emit('participant-video-changed', {
        participantId: socket.id,
        isVideoOff
      });
      console.log(`${participant.name} ${isVideoOff ? 'turned off' : 'turned on'} video`);
    }
  });

  // Enhanced screen sharing
  socket.on('start-screen-share', ({ meetingId, userName }) => {
    const meeting = meetings.get(meetingId);
    if (meeting) {
      // Stop any existing screen share
      if (meeting.screenShareParticipant && meeting.screenShareParticipant !== socket.id) {
        const existingSharer = participants.get(meeting.screenShareParticipant);
        if (existingSharer) {
          io.to(meeting.screenShareParticipant).emit('force-stop-screen-share');
        }
      }
      
      meeting.screenShareParticipant = socket.id;
      socket.to(meetingId).emit('screen-share-started', {
        participantId: socket.id,
        participantName: userName
      });
      console.log(`${userName} started screen sharing in meeting ${meetingId}`);
    }
  });

  socket.on('stop-screen-share', ({ meetingId }) => {
    const meeting = meetings.get(meetingId);
    if (meeting && meeting.screenShareParticipant === socket.id) {
      meeting.screenShareParticipant = null;
      socket.to(meetingId).emit('screen-share-stopped', {
        participantId: socket.id
      });
      
      const participant = participants.get(socket.id);
      console.log(`${participant?.name || 'Unknown'} stopped screen sharing in meeting ${meetingId}`);
    }
  });

  // WebRTC signaling with enhanced error handling
  socket.on('offer', ({ meetingId, offer, targetId }) => {
    console.log(`WebRTC offer from ${socket.id} to ${targetId} in meeting ${meetingId}`);
    socket.to(targetId).emit('offer', {
      offer,
      senderId: socket.id
    });
  });

  socket.on('answer', ({ meetingId, answer, targetId }) => {
    console.log(`WebRTC answer from ${socket.id} to ${targetId} in meeting ${meetingId}`);
    socket.to(targetId).emit('answer', {
      answer,
      senderId: socket.id
    });
  });

  socket.on('ice-candidate', ({ meetingId, candidate, targetId }) => {
    console.log(`ICE candidate from ${socket.id} to ${targetId} in meeting ${meetingId}`);
    socket.to(targetId).emit('ice-candidate', {
      candidate,
      senderId: socket.id
    });
  });

  // Enhanced heartbeat system
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  // Handle disconnect with enhanced cleanup
  socket.on('disconnect', (reason) => {
    console.log(`Socket ${socket.id} disconnected: ${reason}`);
    
    const participant = participants.get(socket.id);
    if (participant) {
      const meetingId = participant.meetingId;
      socket.to(meetingId).emit('user-left', socket.id);

      // Clean up
      const meeting = meetings.get(meetingId);
      if (meeting) {
        meeting.participants.delete(socket.id);
        
        // If this was the screen sharing participant, stop screen share
        if (meeting.screenShareParticipant === socket.id) {
          meeting.screenShareParticipant = null;
          socket.to(meetingId).emit('screen-share-stopped', { participantId: socket.id });
        }
        
        cleanupMeeting(meetingId);
      }

      participants.delete(socket.id);
      console.log(`${participant.name} disconnected from meeting ${meetingId}`);
    }
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Enhanced periodic cleanup
setInterval(() => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  for (const [meetingId, meeting] of meetings.entries()) {
    if (meeting.createdAt < oneDayAgo && meeting.participants.size === 0) {
      meetings.delete(meetingId);
      console.log(`Cleaned up old meeting: ${meetingId}`);
    }
  }
  
  // Log current status
  console.log(`Active meetings: ${meetings.size}, Active participants: ${participants.size}`);
}, 60 * 60 * 1000); // Run every hour

// Server status logging
setInterval(() => {
  console.log(`Server status - Meetings: ${meetings.size}, Participants: ${participants.size}, Connected sockets: ${io.engine.clientsCount}`);
}, 5 * 60 * 1000); // Every 5 minutes

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log(`CORS enabled for: http://localhost:3000, http://127.0.0.1:3000`);
  console.log(`Server ready to accept connections`);
});

// Enhanced graceful shutdown
const gracefulShutdown = () => {
  console.log('Shutting down gracefully...');
  
  // Notify all connected clients
  io.emit('server-shutdown', { message: 'Server is shutting down' });
  
  // Close all connections
  io.close(() => {
    console.log('All socket connections closed');
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.log('Force exit');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});