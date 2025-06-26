const { createServer } = require('http');
const { Server } = require('socket.io');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
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

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-meeting', ({ meetingId, userName }) => {
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

    console.log(`${userName} joined meeting ${meetingId} (${meeting.participants.size} participants)`);
  });

  socket.on('leave-meeting', ({ meetingId }) => {
    const participant = participants.get(socket.id);
    if (!participant) return;

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

  // Chat functionality
  socket.on('chat-message', ({ meetingId, message }) => {
    const meeting = meetings.get(meetingId);
    if (meeting) {
      const messageWithTimestamp = {
        ...message,
        timestamp: new Date()
      };
      meeting.messages.push(messageWithTimestamp);
      
      // Broadcast to all participants including sender
      io.to(meetingId).emit('chat-message', messageWithTimestamp);
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

  // Media controls
  socket.on('toggle-audio', ({ meetingId, isMuted }) => {
    const participant = participants.get(socket.id);
    if (participant) {
      participant.isMuted = isMuted;
      socket.to(meetingId).emit('participant-audio-changed', {
        participantId: socket.id,
        isMuted
      });
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
    }
  });

  // Screen sharing
  socket.on('start-screen-share', ({ meetingId, userName }) => {
    const meeting = meetings.get(meetingId);
    if (meeting) {
      meeting.screenShareParticipant = socket.id;
      socket.to(meetingId).emit('screen-share-started', {
        participantId: socket.id,
        participantName: userName
      });
    }
  });

  socket.on('stop-screen-share', ({ meetingId }) => {
    const meeting = meetings.get(meetingId);
    if (meeting && meeting.screenShareParticipant === socket.id) {
      meeting.screenShareParticipant = null;
      socket.to(meetingId).emit('screen-share-stopped', {
        participantId: socket.id
      });
    }
  });

  // WebRTC signaling
  socket.on('offer', ({ meetingId, offer, targetId }) => {
    socket.to(targetId).emit('offer', {
      offer,
      senderId: socket.id
    });
  });

  socket.on('answer', ({ meetingId, answer, targetId }) => {
    socket.to(targetId).emit('answer', {
      answer,
      senderId: socket.id
    });
  });

  socket.on('ice-candidate', ({ meetingId, candidate, targetId }) => {
    socket.to(targetId).emit('ice-candidate', {
      candidate,
      senderId: socket.id
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
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

  // Heartbeat to keep connection alive
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Periodic cleanup of old meetings (older than 24 hours)
setInterval(() => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  for (const [meetingId, meeting] of meetings.entries()) {
    if (meeting.createdAt < oneDayAgo && meeting.participants.size === 0) {
      meetings.delete(meetingId);
      console.log(`Cleaned up old meeting: ${meetingId}`);
    }
  }
}, 60 * 60 * 1000); // Run every hour

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log(`CORS enabled for: http://localhost:3000, http://127.0.0.1:3000`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});