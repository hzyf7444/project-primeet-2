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
      initializeMedia();
      isInitialized.current = true;
    }
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeMedia = async () => {
    try {
      console.log('Initializing media devices...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
      });
      
      console.log('Media stream obtained:', stream);
      setLocalStream(stream);
      localStreamRef.current = stream;
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      // Try with lower constraints
      try {
        console.log('Trying fallback media constraints...');
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log('Fallback media stream obtained:', fallbackStream);
        setLocalStream(fallbackStream);
        localStreamRef.current = fallbackStream;
        setIsVideoEnabled(true);
        setIsAudioEnabled(true);
      } catch (fallbackError) {
        console.error('Fallback media access failed:', fallbackError);
      }
    }
  };

  const startVideo = async () => {
    console.log('Starting video...');
    
    if (!localStreamRef.current) {
      console.log('No local stream, initializing...');
      await initializeMedia();
      return;
    }

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      console.log('Enabling existing video track');
      videoTrack.enabled = true;
      setIsVideoEnabled(true);
    } else {
      console.log('No video track found, requesting new video stream...');
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 15 }
          }
        });
        const newVideoTrack = videoStream.getVideoTracks()[0];
        
        if (localStreamRef.current && newVideoTrack) {
          // Remove old video tracks
          localStreamRef.current.getVideoTracks().forEach(track => {
            localStreamRef.current?.removeTrack(track);
            track.stop();
          });
          
          // Add new video track
          localStreamRef.current.addTrack(newVideoTrack);
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          setIsVideoEnabled(true);
          console.log('New video track added');
        }
      } catch (error) {
        console.error('Error starting video:', error);
      }
    }
  };

  const stopVideo = () => {
    console.log('Stopping video...');
    if (!localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = false;
      setIsVideoEnabled(false);
      console.log('Video track disabled');
    }
  };

  const startAudio = async () => {
    console.log('Starting audio...');
    
    if (!localStreamRef.current) {
      console.log('No local stream, initializing...');
      await initializeMedia();
      return;
    }

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      console.log('Enabling existing audio track');
      audioTrack.enabled = true;
      setIsAudioEnabled(true);
    } else {
      console.log('No audio track found, requesting new audio stream...');
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        const newAudioTrack = audioStream.getAudioTracks()[0];
        
        if (localStreamRef.current && newAudioTrack) {
          // Remove old audio tracks
          localStreamRef.current.getAudioTracks().forEach(track => {
            localStreamRef.current?.removeTrack(track);
            track.stop();
          });
          
          // Add new audio track
          localStreamRef.current.addTrack(newAudioTrack);
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          setIsAudioEnabled(true);
          console.log('New audio track added');
        }
      } catch (error) {
        console.error('Error starting audio:', error);
      }
    }
  };

  const stopAudio = () => {
    console.log('Stopping audio...');
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = false;
      setIsAudioEnabled(false);
      console.log('Audio track disabled');
    }
  };

  const startScreenShare = async () => {
    try {
      console.log('Starting screen share...');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 15 }
        },
        audio: true,
      });
      
      console.log('Screen share stream obtained:', stream);
      setScreenStream(stream);
      
      // Handle screen share end
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('Screen share ended by user');
        stopScreenShare();
      });
      
      return stream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  };

  const stopScreenShare = () => {
    console.log('Stopping screen share...');
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        track.stop();
        console.log('Screen share track stopped:', track.kind);
      });
      setScreenStream(null);
    }
  };

  const addRemoteStream = useCallback((participantId: string, stream: MediaStream) => {
    console.log('Adding remote stream for participant:', participantId);
    setRemoteStreams(prev => ({
      ...prev,
      [participantId]: stream
    }));
  }, []);

  const removeRemoteStream = useCallback((participantId: string) => {
    console.log('Removing remote stream for participant:', participantId);
    setRemoteStreams(prev => {
      const updated = { ...prev };
      delete updated[participantId];
      return updated;
    });
    
    // Close peer connection
    if (peerConnections.current[participantId]) {
      peerConnections.current[participantId].close();
      delete peerConnections.current[participantId];
      console.log('Peer connection closed for:', participantId);
    }
  }, []);

  const createPeerConnection = useCallback((participantId: string) => {
    console.log('Creating peer connection for:', participantId);
    
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    };

    const peerConnection = new RTCPeerConnection(configuration);
    
    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('Adding track to peer connection:', track.kind);
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      const [remoteStream] = event.streams;
      addRemoteStream(participantId, remoteStream);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate generated for:', participantId);
        // Send ICE candidate to remote peer via signaling server
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Peer connection state changed:', peerConnection.connectionState);
    };

    peerConnections.current[participantId] = peerConnection;
    return peerConnection;
  }, [addRemoteStream]);

  const cleanup = () => {
    console.log('Cleaning up WebRTC resources...');
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Local track stopped:', track.kind);
      });
    }
    
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        track.stop();
        console.log('Screen share track stopped:', track.kind);
      });
    }

    Object.entries(peerConnections.current).forEach(([id, pc]) => {
      pc.close();
      console.log('Peer connection closed for:', id);
    });
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