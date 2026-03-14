import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface PeerConnection {
  connection: RTCPeerConnection;
  stream: MediaStream | null;
}

export const useWebRTC = (roomId: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [id: string]: MediaStream }>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'waiting' | 'connecting' | 'connected'>('waiting');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const peerConnections = useRef<{ [id: string]: RTCPeerConnection }>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  const ICE_SERVERS = {
    iceServers: [
      { urls: process.env.NEXT_PUBLIC_STUN_SERVER || 'stun:stun.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        localStreamRef.current = stream;

        // 2. Connect to signaling server
        socketRef.current = io();

        const socket = socketRef.current;

        socket.on('connect', () => {
          console.log('Connected to signaling server');
          socket.emit('join-room', roomId);
        });

        // Handle existing users in the room
        socket.on('all-users', (users: string[]) => {
          console.log('Existing users:', users);
          if (users.length > 0) {
            setConnectionStatus('connecting');
            users.forEach(userId => {
              createPeerConnection(userId, true);
            });
          }
        });

        // Handle new user joining
        socket.on('user-joined', (userId: string) => {
          console.log('User joined:', userId);
          setConnectionStatus('connecting');
          createPeerConnection(userId, false);
        });

        // Handle signaling messages
        socket.on('offer', async ({ from, offer }) => {
          console.log('Received offer from:', from);
          const pc = getOrCreatePeerConnection(from);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', { to: from, answer });
        });

        socket.on('answer', async ({ from, answer }) => {
          console.log('Received answer from:', from);
          const pc = peerConnections.current[from];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });

        socket.on('ice-candidate', ({ from, candidate }) => {
          console.log('Received ice-candidate from:', from);
          const pc = peerConnections.current[from];
          if (pc) {
            pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
          }
        });

        // Handle user leaving
        socket.on('user-left', (userId: string) => {
          console.log('User left:', userId);
          if (peerConnections.current[userId]) {
            peerConnections.current[userId].close();
            delete peerConnections.current[userId];
          }
          setRemoteStreams(prev => {
            const next = { ...prev };
            delete next[userId];
            if (Object.keys(next).length === 0) {
              setConnectionStatus('waiting');
            }
            return next;
          });
        });

        // Handle chat messages
        socket.on('chat-message', (message: Message) => {
          setMessages(prev => [...prev, message]);
        });

      } catch (err) {
        console.error('WebRTC initialization error:', err);
      }
    };

    init();

    return () => {
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.values(peerConnections.current).forEach(pc => pc.close());
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  const createPeerConnection = (userId: string, isInitiator: boolean) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[userId] = pc;

    // Add local tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log('Received remote track from:', userId);
      setRemoteStreams(prev => ({
        ...prev,
        [userId]: event.streams[0]
      }));
      setConnectionStatus('connected');
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', {
          to: userId,
          candidate: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${userId}: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
      }
    };

    // If initiator, create and send offer
    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current?.emit('offer', { to: userId, offer });
        } catch (e) {
          console.error('Error creating offer:', e);
        }
      };
    }

    return pc;
  };

  const getOrCreatePeerConnection = (userId: string) => {
    return peerConnections.current[userId] || createPeerConnection(userId, false);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  const sendMessage = (text: string) => {
    if (text.trim() && socketRef.current) {
      socketRef.current.emit('send-chat-message', text);
    }
  };

  return {
    localStream,
    remoteStreams,
    messages,
    connectionStatus,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
    sendMessage
  };
};
