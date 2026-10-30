import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ChatInterface from '../components/ChatInterface';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col text-slate-100">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 overflow-hidden flex flex-col h-[calc(100vh-4rem)]">
          <ChatInterface />
        </main>
      </div>
    </div>
  );
}

