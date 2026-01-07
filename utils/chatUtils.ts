import { ChatMessage } from '../services/chatService';

interface ActiveChat {
    type: 'user' | 'sector';
    id: string;
    name: string;
}

export const isMessageRelevant = (
    message: ChatMessage,
    activeChat: ActiveChat | null,
    currentUserId: string
): boolean => {
    if (!activeChat || !currentUserId) return false;

    const activeId = activeChat.id.toLowerCase();
    const userId = currentUserId.toLowerCase();
    const senderId = message.sender_id?.toLowerCase();
    const receiverId = message.receiver_id?.toLowerCase();
    const sectorId = message.sector_id?.toLowerCase();

    if (activeChat.type === 'user') {
        if (activeChat.id === 'global-users') {
            // Global Broadcast: Both receiver and sector are null
            return !message.receiver_id && !message.sector_id;
        }
        // Direct Message: Either (Sender=Active AND Receiver=Me) OR (Sender=Me AND Receiver=Active)
        return (
            (senderId === activeId && receiverId === userId) ||
            (senderId === userId && receiverId === activeId)
        );
    } else if (activeChat.type === 'sector') {
        if (activeChat.id === 'global') {
            return sectorId === 'global';
        }
        // Sector Message: Sector matches Active
        return sectorId === activeId;
    }

    return false;
};
