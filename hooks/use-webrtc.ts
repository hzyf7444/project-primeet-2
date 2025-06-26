'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

export function useWebRTC() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      startLocalStream();
      isInitialized.current = true;
    }
    
    return () => {
      cleanup();
    };
  }, []);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
      });
      
      setLocalStream(stream);
      localStreamRef.current = stream;
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      // Try with lower constraints
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(fallbackStream);
        localStreamRef.current = fallbackStream;
      } catch (fallbackError) {
        console.error('Fallback media access failed:', fallbackError);
      }
    }
  };

  const startVideo = async () => {
    if (!localStreamRef.current) {
      await startLocalStream();
      return;
    }

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = true;
      setIsVideoEnabled(true);
    } else {
      // If no video track, get a new stream
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = videoStream.getVideoTracks()[0];
        
        if (localStreamRef.current) {
          localStreamRef.current.addTrack(videoTrack);
          setLocalStream(localStreamRef.current);
          setIsVideoEnabled(true);
        }
      } catch (error) {
        console.error('Error starting video:', error);
      }
    }
  };

  const stopVideo = () => {
    if (!localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = false;
      setIsVideoEnabled(false);
    }
  };

  const startAudio = async () => {
    if (!localStreamRef.current) {
      await startLocalStream();
      return;
    }

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = true;
      setIsAudioEnabled(true);
    } else {
      // If no audio track, get a new stream
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTrack = audioStream.getAudioTracks()[0];
        
        if (localStreamRef.current) {
          localStreamRef.current.addTrack(audioTrack);
          setLocalStream(localStreamRef.current);
          setIsAudioEnabled(true);
        }
      } catch (error) {
        console.error('Error starting audio:', error);
      }
    }
  };

  const stopAudio = () => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = false;
      setIsAudioEnabled(false);
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true,
      });
      
      setScreenStream(stream);
      
      // Handle screen share end
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });
      
      return stream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
  };

  const addRemoteStream = useCallback((participantId: string, stream: MediaStream) => {
    setRemoteStreams(prev => ({
      ...prev,
      [participantId]: stream
    }));
  }, []);

  const removeRemoteStream = useCallback((participantId: string) => {
    setRemoteStreams(prev => {
      const updated = { ...prev };
      delete updated[participantId];
      return updated;
    });
    
    // Close peer connection
    if (peerConnections.current[participantId]) {
      peerConnections.current[participantId].close();
      delete peerConnections.current[participantId];
    }
  }, []);

  const createPeerConnection = useCallback((participantId: string) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const peerConnection = new RTCPeerConnection(configuration);
    
    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      addRemoteStream(participantId, remoteStream);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer via signaling server
      }
    };

    peerConnections.current[participantId] = peerConnection;
    return peerConnection;
  }, [addRemoteStream]);

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }

    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
  };

  return {
    localStream,
    remoteStreams,
    screenStream,
    isVideoEnabled,
    isAudioEnabled,
    startVideo,
    stopVideo,
    startAudio,
    stopAudio,
    startScreenShare,
    stopScreenShare,
    addRemoteStream,
    removeRemoteStream,
    createPeerConnection,
  };
}