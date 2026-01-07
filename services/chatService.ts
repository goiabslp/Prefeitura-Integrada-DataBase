import { supabase } from './supabaseClient';

export interface ChatMessage {
    id: string;
    sender_id: string;
    receiver_id?: string;
    sector_id?: string;
    message: string;
    read: boolean;
    created_at: string;
    file_url?: string;
    file_name?: string;
    file_type?: string;
    sender?: {
        name: string;
        username: string;
    };
}

export interface RecentConversation {
    id: string;
    type: 'user' | 'sector';
    lastMessage: string;
    unreadCount: number;
    timestamp: string;
    originalRef?: ChatMessage;
}

export const chatService = {
    async sendMessage(message: Omit<ChatMessage, 'id' | 'created_at' | 'read' | 'sender'>) {
        const { data, error } = await supabase
            .from('chat_messages')
            .insert(message)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async uploadAttachment(file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
            .from('chat-attachments')
            .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(filePath);

        return {
            url: publicUrl,
            name: file.name,
            type: file.type
        };
    },

    async fetchDirectMessages(currentUserId: string, otherUserId: string) {
        let query = supabase
            .from('chat_messages')
            .select('*');

        if (otherUserId === 'global-users') {
            // Global users Mural: both receiver and sector are null
            query = query.filter('receiver_id', 'is', null).filter('sector_id', 'is', null);
        } else {
            // Direct message between two users
            const u1 = currentUserId.toLowerCase();
            const u2 = otherUserId.toLowerCase();
            // Use safer string construction
            query = query.or(`and(sender_id.eq.${u1},receiver_id.eq.${u2}),and(sender_id.eq.${u2},receiver_id.eq.${u1})`);
        }

        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) {
            console.error('Error in fetchDirectMessages:', error);
            throw error;
        }

        console.log(`[ChatService] Fetched ${data?.length} messages between ${currentUserId} and ${otherUserId}`);
        return data as ChatMessage[];
    },

    async fetchSectorMessages(sectorId: string) {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('sector_id', sectorId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as ChatMessage[];
    },

    async markAsRead(messageIds: string[]) {
        if (messageIds.length === 0) return;
        const { error } = await supabase
            .from('chat_messages')
            .update({ read: true })
            .in('id', messageIds);

        if (error) throw error;
    },

    async fetchUnreadCount(userId: string, userSector?: string) {
        let orFilter = `receiver_id.eq.${userId},sector_id.eq.global,and(receiver_id.is.null,sector_id.is.null)`;
        if (userSector) {
            orFilter += `,sector_id.eq.${userSector}`;
        }

        const { count, error } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('read', false)
            .neq('sender_id', userId)
            .or(orFilter);

        if (error) {
            console.error('Error fetching unread count', error);
            return 0;
        }
        return count || 0;
    },

    // Helper to get all users for the sidebar list
    async fetchChatUsers() {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, username, sector, role, jobTitle:job_title')
            .order('name');

        if (error) throw error;
        return data;
    },

    async fetchChatSectors() {
        const { data, error } = await supabase
            .from('sectors')
            .select('id, name')
            .order('name');

        if (error) throw error;
        return data;
    },

    async fetchRecentConversations(userId: string): Promise<{ userIds: string[], sectorIds: string[], metadata: Record<string, RecentConversation> }> {
        // Fetch last 300 messages to get a good history of recent interactions
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId},sector_id.neq.null`) // Check all relevant messages
            .order('created_at', { ascending: false })
            .limit(300);

        if (error) throw error;

        const recentUserIds = new Set<string>();
        const recentSectorIds = new Set<string>();
        const metadata: Record<string, RecentConversation> = {};

        // Helper to update metadata for a conversation key
        const updateMetadata = (key: string, type: 'user' | 'sector', msg: ChatMessage) => {
            if (!metadata[key]) {
                metadata[key] = {
                    id: key,
                    type,
                    lastMessage: msg.file_url ? (msg.file_type?.startsWith('image/') ? '📷 Imagem' : '📎 Arquivo') : msg.message,
                    unreadCount: 0,
                    timestamp: msg.created_at,
                    originalRef: msg
                };
            }

            // Count unread if I am the receiver (or it's a sector msg not from me) and it's not read
            if (!msg.read && msg.sender_id !== userId) {
                // For direct messages: correct
                // For sector messages: primitive "unread" logic (if not read by ANYONE? unread status is shared currently)
                metadata[key].unreadCount += 1;
            }
        };

        const mySectorId = (data.find(m => m.sender_id === userId)?.sender as any)?.sector; // This might be unreliable if not expanded, relying on client filtering mostly, but here filter helps.

        data.forEach(msg => {
            if (msg.sector_id) {
                // It's a sector message
                // Filter: Include if I sent it OR (it's my sector OR it's global) -- basic visibility logic similar to context
                // For simplicity in "Recent", we show everything fetched that has sector_id. 
                // Context usually filters strictly. Assuming API returns what user CAN see usually.
                recentSectorIds.add(msg.sector_id);
                updateMetadata(msg.sector_id, 'sector', msg);
            } else {
                // Direct message
                const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
                if (otherId) {
                    recentUserIds.add(otherId);
                    updateMetadata(otherId, 'user', msg);
                }
            }
        });

        return {
            userIds: Array.from(recentUserIds),
            sectorIds: Array.from(recentSectorIds),
            metadata
        };
    },

    async deleteConversation(currentUserId: string, targetId: string, type: 'user' | 'sector') {
        let query = supabase.from('chat_messages').delete();

        if (type === 'user') {
            // Delete all messages between these two users
            query = query.or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${currentUserId})`);
        } else {
            // targetId is the sector name or ID
            query = query.eq('sector_id', targetId);
        }

        const { error } = await query;
        if (error) throw error;
    }
};
