import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import { chatService, ChatMessage } from '../services/chatService';
import { isMessageRelevant } from '../utils/chatUtils';

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
    lastUpdate: number;
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
    const [lastUpdate, setLastUpdate] = useState(Date.now());

    // Refs for Realtime Listener access without triggering re-renders/invalidation
    const activeChatRef = React.useRef(activeChat);
    const isOpenRef = React.useRef(isOpen);

    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);

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
                    data = await chatService.fetchSectorMessages(activeChat.id, user.id);
                }

                // MERGE STRATEGY: Combine fetched data with existing state to avoid race conditions
                // where Realtime inserts a message while fetch is in progress.
                setMessages(prev => {
                    // 1. Filter 'prev' to only keep messages relevant to the NEW active chat.
                    // This creates a clean slate while preserving any "just arrived" realtime messages for this chat.
                    const relevantPrev = prev.filter(m => isMessageRelevant(m, activeChat, user.id));

                    const fetchedIds = new Set(data.map(m => m.id));
                    // 2. Keep existing messages that are NOT in the fetched set (likely new realtime messages or optimistic updates)
                    const uniqueExisting = relevantPrev.filter(m => !fetchedIds.has(m.id));

                    // 3. Combine and sort
                    const combined = [...data, ...uniqueExisting].sort((a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );

                    return combined;
                });

                // Mark unread messages as read
                const unreadIds = data
                    .filter(m => !m.read && m.sender_id !== user.id)
                    .map(m => m.id);

                if (unreadIds.length > 0) {
                    await chatService.markAsRead(unreadIds);
                    await refreshUnreadCount();
                }
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        };

        loadMessages();
    }, [activeChat, user]);

    // Refresh Unread Count when Window Opens
    useEffect(() => {
        if (isOpen && user) {
            refreshUnreadCount();
        }
    }, [isOpen, user]);

    // Global Message Listener - STABLE CONNECTION
    // Depends ONLY on 'user', not on 'activeChat' or 'isOpen'
    useEffect(() => {
        if (!user) return;

        const globalChannel = supabase.channel('global_chat_channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_messages'
                },
                (payload) => {
                    const currentActiveChat = activeChatRef.current;
                    const currentIsOpen = isOpenRef.current;

                    if (payload.eventType === 'INSERT') {
                        const newMessage = payload.new as ChatMessage;

                        // 1. Check if it belongs to current active chat
                        const isRelevant = currentActiveChat && isMessageRelevant(newMessage, currentActiveChat, user.id);

                        if (isRelevant) {
                            setMessages(prev => {
                                // 1. If we already have this exact ID, ignore.
                                if (prev.some(m => m.id === newMessage.id)) return prev;

                                // 2. Check for optimistic duplicate (replace temp with real)
                                const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

                                if (newMessage.sender_id === user?.id) {
                                    const optimisticIdx = prev.findIndex(m =>
                                        !isUuid(m.id) &&
                                        m.sender_id === newMessage.sender_id &&
                                        m.message === newMessage.message
                                    );

                                    if (optimisticIdx !== -1) {
                                        const newMessages = [...prev];
                                        newMessages[optimisticIdx] = newMessage;
                                        return newMessages;
                                    }
                                }

                                return [...prev, newMessage];
                            });

                            // Mark as read in DB if it's from someone else and window is open
                            if (newMessage.sender_id !== user.id && currentIsOpen) {
                                chatService.markAsRead([newMessage.id]);
                                refreshUnreadCount();
                            }
                        } else {
                            // 2. Increment unread if for me/sector/global and not currently reading
                            const isForMe = newMessage.receiver_id === user.id;
                            const isForMySector = newMessage.sector_id && newMessage.sector_id === (user as any).sector;
                            const isGlobal = (newMessage.sector_id === 'global') || (!newMessage.receiver_id && !newMessage.sector_id);

                            if ((isForMe || isForMySector || isGlobal) && newMessage.sender_id !== user.id) {
                                setUnreadCount(prev => prev + 1);
                            }
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedMessage = payload.new as ChatMessage;
                        // Always refresh unread count on update because 'read' status might have changed
                        refreshUnreadCount();

                        // Update messages list if present
                        setMessages(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m));

                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = (payload.old as any)?.id;
                        if (deletedId) {
                            setMessages(prev => prev.filter(m => m.id !== deletedId));
                            // Refresh unread count just in case the deleted message was unread
                            refreshUnreadCount();
                        }
                    }

                    // Trigger global update for lists
                    setLastUpdate(Date.now());
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(globalChannel);
        };
    }, [user]); // Removed activeChat and isOpen from dependency array

    // Simple poller for unread count (as backup/sync)
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(refreshUnreadCount, 15000);
        return () => clearInterval(interval);
    }, [user]);

    const refreshUnreadCount = async () => {
        if (!user) return;
        const count = await chatService.fetchUnreadCount(user.id, (user as any).sector);
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
                receiver_id: activeChat.type === 'user' ? (activeChat.id === 'global-users' ? null : activeChat.id) : null,
                sector_id: activeChat.type === 'sector' ? activeChat.id : null,
                file_url: fileData?.url || null,
                file_name: fileData?.name || null,
                file_type: fileData?.type || null
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
            // We rely on Realtime to confirm it, which will replace the temp message or add it.
            // But we already have a replacement logic in the listener that matches by content/sender.
        } catch (error) {
            console.error('Failed to send message:', error);
            // Optionally remove the temp message on failure
            setMessages(prev => prev.filter(m => !m.id.includes('.'))); // Simple way to remove temp
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
            onlineUsers,
            lastUpdate
        }}>
            {children}
        </ChatContext.Provider>
    );
};
