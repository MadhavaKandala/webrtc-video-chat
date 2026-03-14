"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Video, ArrowRight } from "lucide-react";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const handleCreateRoom = () => {
    const newRoomId = uuidv4();
    router.push(`/room/${newRoomId}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.push(`/room/${roomId.trim()}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-black text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex flex-col">
        <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          GPP Video Chat
        </h1>
        <p className="text-xl mb-12 text-gray-400 text-center max-w-2xl">
          Secure, real-time, multi-peer video communication built with WebRTC and Next.js.
        </p>

        <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl">
          <button
            onClick={handleCreateRoom}
            className="flex-1 flex items-center justify-center gap-2 p-6 bg-blue-600 hover:bg-blue-700 transition-all rounded-2xl text-xl font-bold shadow-lg shadow-blue-500/20"
          >
            <Video size={24} />
            Create New Room
          </button>

          <form onSubmit={handleJoinRoom} className="flex-1 flex flex-col gap-2">
            <div className="flex bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-all shadow-lg">
              <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="flex-1 bg-transparent p-6 outline-none text-xl"
              />
              <button
                type="submit"
                className="p-6 bg-gray-800 hover:bg-gray-700 transition-all"
              >
                <ArrowRight size={24} />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-800">
          <h3 className="text-xl font-bold mb-2">Multi-Peer Mesh</h3>
          <p className="text-gray-400 text-sm">
            Supports up to 4 participants in a decentralized mesh topology.
          </p>
        </div>
        <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-800">
          <h3 className="text-xl font-bold mb-2">Real-time Chat</h3>
          <p className="text-gray-400 text-sm">
            Instant messaging alongside your video calls for seamless collaboration.
          </p>
        </div>
        <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-800">
          <h3 className="text-xl font-bold mb-2">Full Control</h3>
          <p className="text-gray-400 text-sm">
            Easily toggle your camera, mute your microphone, or end calls gracefully.
          </p>
        </div>
      </div>
    </main>
  );
}
