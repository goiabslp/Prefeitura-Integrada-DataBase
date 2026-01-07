import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';

export const ChatWidget: React.FC = () => {
    const { unreadCount, isOpen, setIsOpen } = useChat();

    return (
        <button
            onClick={() => setIsOpen(!isOpen)}
            className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 chat-toggle-btn ${isOpen ? 'bg-white text-violet-600 border border-violet-100' : 'bg-violet-600 text-white shadow-violet-600/30'
                }`}
        >
            {isOpen ? <X className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
            {!isOpen && unreadCount > 0 && (
                <div className="absolute -right-1 -top-1 flex h-6 w-6">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                </div>
            )}
        </button>
    );
};
