const { createServer } = require('http');
const { Server } = require('socket.io');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store meeting data
const meetings = new Map();
const participants = new Map();

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
        createdAt: new Date()
      });
      participant.isHost = true;
    } else {
      meetings.get(meetingId).participants.add(socket.id);
    }

    // Notify others about new participant
    socket.to(meetingId).emit('user-joined', participant);

    // Send current participants list to new user
    const meeting = meetings.get(meetingId);
    const participantsList = Array.from(meeting.participants)
      .map(id => participants.get(id))
      .filter(Boolean);
    
    socket.emit('participants-list', participantsList);

    console.log(`${userName} joined meeting ${meetingId}`);
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
      
      // Clean up empty meetings
      if (meeting.participants.size === 0) {
        meetings.delete(meetingId);
      }
    }

    participants.delete(socket.id);
    console.log(`${participant.name} left meeting ${meetingId}`);
  });

  // Chat functionality
  socket.on('chat-message', ({ meetingId, message }) => {
    const meeting = meetings.get(meetingId);
    if (meeting) {
      meeting.messages.push(message);
      io.to(meetingId).emit('chat-message', message);
    }
  });

  socket.on('edit-message', ({ meetingId, messageId, newText }) => {
    const meeting = meetings.get(meetingId);
    if (meeting) {
      const message = meeting.messages.find(m => m.id === messageId);
      if (message) {
        message.message = newText;
        message.isEdited = true;
        io.to(meetingId).emit('message-edited', { messageId, newText });
      }
    }
  });

  socket.on('delete-message', ({ meetingId, messageId }) => {
    const meeting = meetings.get(meetingId);
    if (meeting) {
      meeting.messages = meeting.messages.filter(m => m.id !== messageId);
      io.to(meetingId).emit('message-deleted', messageId);
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

  socket.on('toggle-screen-share', ({ meetingId, isScreenSharing }) => {
    socket.to(meetingId).emit('screen-share-changed', {
      participantId: socket.id,
      isScreenSharing
    });
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

  socket.on('disconnect', () => {
    const participant = participants.get(socket.id);
    if (participant) {
      const meetingId = participant.meetingId;
      socket.to(meetingId).emit('user-left', socket.id);

      // Clean up
      const meeting = meetings.get(meetingId);
      if (meeting) {
        meeting.participants.delete(socket.id);
        if (meeting.participants.size === 0) {
          meetings.delete(meetingId);
        }
      }

      participants.delete(socket.id);
      console.log(`${participant.name} disconnected`);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});