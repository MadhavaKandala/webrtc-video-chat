"use client";

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWebRTC } from '@/hooks/useWebRTC';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  MessageSquare, Users, Send, ChevronRight 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const {
    localStream,
    remoteStreams,
    messages,
    connectionStatus,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
    sendMessage
  } = useWebRTC(roomId);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  const handleHangup = () => {
    window.location.href = "/";
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage(chatInput);
      setChatInput("");
    }
  };

  const remoteUserIds = Object.keys(remoteStreams);
  const totalParticipants = remoteUserIds.length + 1;

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans text-white">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Header/Status */}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              connectionStatus === 'connected' ? "bg-green-500" : 
              connectionStatus === 'connecting' ? "bg-yellow-500" : "bg-red-500"
            )} />
            <span className="text-xs font-medium uppercase tracking-wider">
              {connectionStatus === 'connected' && <span data-test-id="status-connected">Connected</span>}
              {connectionStatus === 'connecting' && <span data-test-id="status-connecting">Connecting</span>}
              {connectionStatus === 'waiting' && <span data-test-id="status-waiting">Waiting for peers...</span>}
            </span>
          </div>
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
            <Users size={14} className="text-blue-400" />
            <span className="text-xs font-medium">{totalParticipants} Participants</span>
          </div>
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <span className="text-xs font-mono text-gray-400">Room: {roomId}</span>
          </div>
        </div>

        {/* Video Grid */}
        <div 
          data-test-id="remote-video-container"
          className={cn(
            "flex-1 p-6 grid gap-4 transition-all duration-500",
            totalParticipants === 1 ? "grid-cols-1" : 
            totalParticipants === 2 ? "grid-cols-1 md:grid-cols-2" : 
            totalParticipants <= 4 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"
          )}
        >
          {/* Local Video - Always present, but smaller if others are there */}
          <div className={cn(
            "relative rounded-3xl overflow-hidden bg-gray-900 border border-white/5 group transition-all duration-500",
            totalParticipants === 1 ? "h-full w-full" : "aspect-video"
          )}>
            <video
              ref={localVideoRef}
              data-test-id="local-video"
              autoPlay
              muted
              playsInline
              className={cn(
                "w-full h-full object-cover mirror",
                isCameraOff && "opacity-0"
              )}
            />
            {isCameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center border border-white/10">
                  <VideoOff size={32} className="text-gray-500" />
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-xs font-medium italic">You {isMuted && "(Muted)"}</span>
            </div>
          </div>

          {/* Remote Videos */}
          {remoteUserIds.map((userId) => (
            <div key={userId} className="relative rounded-3xl overflow-hidden bg-gray-900 border border-white/5 aspect-video">
              <RemoteVideo stream={remoteStreams[userId]} />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <span className="text-xs font-medium">Peer: {userId.slice(0, 4)}...</span>
              </div>
            </div>
          ))}
        </div>

        {/* Controls Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-black/40 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
          <button
            data-test-id="mute-mic-button"
            onClick={toggleMute}
            className={cn(
              "p-4 rounded-2xl transition-all duration-300 border",
              isMuted 
                ? "bg-red-500/20 border-red-500/50 text-red-500" 
                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
            )}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          <button
            data-test-id="toggle-camera-button"
            onClick={toggleCamera}
            className={cn(
              "p-4 rounded-2xl transition-all duration-300 border",
              isCameraOff 
                ? "bg-red-500/20 border-red-500/50 text-red-500" 
                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
            )}
          >
            {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={cn(
              "p-4 rounded-2xl transition-all duration-300 border",
              chatOpen 
                ? "bg-blue-500/20 border-blue-500/50 text-blue-500" 
                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
            )}
          >
            <MessageSquare size={24} />
          </button>

          <div className="w-px h-8 bg-white/10" />

          <button
            data-test-id="hangup-button"
            onClick={handleHangup}
            className="p-4 rounded-2xl bg-red-600 hover:bg-red-700 transition-all duration-300 border border-red-500/50 shadow-lg shadow-red-500/20"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className={cn(
        "bg-gray-950 border-l border-white/10 flex flex-col transition-all duration-500 ease-in-out",
        chatOpen ? "w-96" : "w-0 opacity-0 overflow-hidden"
      )}>
        <div className="p-6 border-bottom border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-400" />
            Chat
          </h2>
          <button 
            onClick={() => setChatOpen(false)}
            className="p-2 hover:bg-white/5 rounded-lg transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div 
          data-test-id="chat-log"
          className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/10"
        >
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-center gap-2">
              <MessageSquare size={32} strokeWidth={1} />
              <p className="text-xs">No messages yet. <br/> Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                data-test-id="chat-message"
                className={cn(
                  "flex flex-col gap-1 max-w-[85%]",
                  msg.sender === "self" ? "self-end items-end" : "self-start items-start"
                )}
              >
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                  msg.sender === "self" 
                    ? "bg-blue-600 text-white rounded-tr-sm" 
                    : "bg-gray-900 border border-white/10 text-gray-200 rounded-tl-sm"
                )}>
                  {msg.text}
                </div>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px] font-medium text-gray-500">{msg.timestamp}</span>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendChat} className="p-4 border-t border-white/10">
          <div className="relative">
            <input
              data-test-id="chat-input"
              type="text"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-blue-500 transition-all"
            />
            <button
              data-test-id="chat-submit"
              type="submit"
              className="absolute right-2 top-1.5 p-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>

      <style jsx global>{`
        .mirror {
          transform: scaleX(-1);
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

function RemoteVideo({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  );
}
