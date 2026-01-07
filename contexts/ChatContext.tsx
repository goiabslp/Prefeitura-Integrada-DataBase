import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import { chatService, ChatMessage } from '../services/chatService';

interface ChatContextType {
    activeChat: { type: 'user' | 'sector', id: string, name: string } | null;
    setActiveChat: (chat: { type: 'user' | 'sector', id: string, name: string } | null) => void;
    messages: ChatMessage[];
    sendMessage: (content: string, fileData?: { url: string, name: string, type: string }) => Promise<void>;
    uploadAttachment: (file: File) => Promise<{ url: string, name: string, type: string }>;
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onlineUsers: Set<string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error('useChat must be used within a ChatProvider');
    return context;
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [activeChat, setActiveChat] = useState<{ type: 'user' | 'sector', id: string, name: string } | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    // Initial Unread Load
    useEffect(() => {
        if (user) {
            refreshUnreadCount();
        }
    }, [user]);

    // Load Messages when Active Chat Changes
    useEffect(() => {
        if (!user || !activeChat) {
            if (!activeChat) setMessages([]);
            return;
        }

        const loadMessages = async () => {
            try {
                let data: ChatMessage[] = [];
                if (activeChat.type === 'user') {
                    data = await chatService.fetchDirectMessages(user.id, activeChat.id);
                } else if (activeChat.type === 'sector') {
                    data = await chatService.fetchSectorMessages(activeChat.id);
                }
                setMessages(data);

                // Mark loaded messages as read if they are from the other person
                // For simplicity, we can do this in the UI or here.
                // Optimistic read local state update?
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        };

        loadMessages();

        // Subscribe to Realtime Changes for the Active Chat
        const channel = supabase.channel(`chat_${activeChat.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',

                    // filter: ... (removing complex filter, will filter client-side)
                },
                (payload) => {
                    const newMessage = payload.new as ChatMessage;
                    setMessages(prev => {
                        // Avoid duplicates from Realtime (especially for sender who has optimistic update)
                        if (prev.find(m => m.id === newMessage.id)) return prev;

                        // Check if it belongs to current active chat
                        if (activeChat.type === 'user') {
                            if ((newMessage.sender_id === activeChat.id && newMessage.receiver_id === user.id) ||
                                (newMessage.sender_id === user.id && newMessage.receiver_id === activeChat.id)) {
                                return [...prev, newMessage];
                            }
                        } else {
                            if (newMessage.sector_id === activeChat.id) {
                                return [...prev, newMessage];
                            }
                        }
                        return prev;
                    });
                }
            )
            .subscribe();

        // ALSO subscribe to a general channel to update Unread Count if chat is closed or different
        // This logic is complex, for MVP let's poll unread count or rely on a global listener.

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeChat, user]);

    // Global Message Listener for Unread Count
    useEffect(() => {
        if (!user) return;

        const globalChannel = supabase.channel('global_chat_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages'
                },
                (payload) => {
                    const newMessage = payload.new as ChatMessage;

                    // Logic to increment unread:
                    // 1. Message is for this user (receiver_id matches)
                    // 2. OR Message is for a sector (we might want to check if user belongs to sector, but for now any sector message can notify if we want)
                    // 3. AND Chat window is closed OR this message is NOT from the active conversation

                    const isForMe = newMessage.receiver_id === user.id;
                    const isForSector = !!newMessage.sector_id; // For now notify all sector messages if they want parity

                    if (isForMe || isForSector) {
                        // If chat is open and active on this conversation, the window handles it (marks read etc)
                        // If not, we increment unread count locally for immediate feedback
                        const isCurrentlyReading = activeChat && (
                            (activeChat.type === 'user' && activeChat.id === newMessage.sender_id) ||
                            (activeChat.type === 'sector' && activeChat.id === newMessage.sector_id)
                        );

                        if (!isOpen || !isCurrentlyReading) {
                            if (newMessage.sender_id !== user.id) { // Don't notify own messages
                                setUnreadCount(prev => prev + 1);
                            }
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(globalChannel);
        };
    }, [user, activeChat, isOpen]);

    // Simple poller for unread count (as backup/sync)
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(refreshUnreadCount, 15000);
        return () => clearInterval(interval);
    }, [user]);

    const refreshUnreadCount = async () => {
        if (!user) return;
        const count = await chatService.fetchUnreadCount(user.id);
        setUnreadCount(count);
    };

    // Presence Management
    useEffect(() => {
        if (!user) return;

        const presenceChannel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: user.id,
                },
            },
        });

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const newState = presenceChannel.presenceState();
                const userIds = Object.keys(newState);
                setOnlineUsers(new Set(userIds));
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                // console.log('User joined:', key, newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                // console.log('User left:', key, leftPresences);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            presenceChannel.unsubscribe();
        };
    }, [user]);

    const uploadAttachment = async (file: File) => {
        return await chatService.uploadAttachment(file);
    };

    const sendMessage = async (content: string, fileData?: { url: string, name: string, type: string }) => {
        if (!user || !activeChat) return;

        try {
            const newMessage = {
                sender_id: user.id,
                message: content,
                receiver_id: activeChat.type === 'user' ? activeChat.id : null,
                sector_id: activeChat.type === 'sector' ? activeChat.id : null,
                file_url: fileData?.url,
                file_name: fileData?.name,
                file_type: fileData?.type
            };

            // Optimistic update
            const tempMsg: ChatMessage = {
                ...newMessage,
                id: Math.random().toString(),
                created_at: new Date().toISOString(),
                read: false,
                receiver_id: newMessage.receiver_id || undefined,
                sector_id: newMessage.sector_id || undefined,
                file_url: newMessage.file_url || undefined,
                file_name: newMessage.file_name || undefined,
                file_type: newMessage.file_type || undefined
            };
            setMessages(prev => [...prev, tempMsg]);

            await chatService.sendMessage(newMessage);
            // Realtime will confirm it, or we replace the temp one. 
            // Since we listen to INSERT, we might get duplicate if we don't handle it.
            // Usually we wait for realtime to receive our own message if we want robust sync, 
            // OR we filter out our own realtime echo.
            // For now, let's just refetch or let realtime handle it (re-deduping might be needed).
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    return (
        <ChatContext.Provider value={{
            activeChat,
            setActiveChat,
            messages,
            sendMessage,
            uploadAttachment,
            unreadCount,
            refreshUnreadCount,
            isOpen,
            setIsOpen,
            onlineUsers
        }}>
            {children}
        </ChatContext.Provider>
    );
};
