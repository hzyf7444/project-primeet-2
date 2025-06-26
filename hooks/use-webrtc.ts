'use client';

import { useEffect, useState, useRef } from 'react';

export function useWebRTC() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});

  useEffect(() => {
    startLocalStream();
    
    return () => {
      cleanup();
    };
  }, []);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      setLocalStream(stream);
      localStreamRef.current = stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
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
        video: true,
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

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }

    Object.values(peerConnections.current).forEach(pc => pc.close());
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
  };
}