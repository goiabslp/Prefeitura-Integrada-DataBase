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
        const { data, error } = await supabase
            .from('chat_messages')
            .select(`
                *,
                sender:profiles!sender_id (name, username)
            `)
            .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as ChatMessage[];
    },

    async fetchSectorMessages(sectorId: string) {
        const { data, error } = await supabase
            .from('chat_messages')
            .select(`
                *,
                 sender:profiles!sender_id (name, username)
            `)
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

    async fetchRecentConversations(userId: string) {
        // Fetch last 100 messages involving the user to determine recent chats
        const { data, error } = await supabase
            .from('chat_messages')
            .select('sender_id, receiver_id, sector_id')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        const recentUserIds = new Set<string>();
        const recentSectorIds = new Set<string>();

        data.forEach(msg => {
            if (msg.sector_id) {
                recentSectorIds.add(msg.sector_id);
            } else if (msg.sender_id === userId && msg.receiver_id) {
                recentUserIds.add(msg.receiver_id);
            } else if (msg.receiver_id === userId && msg.sender_id) {
                recentUserIds.add(msg.sender_id);
            }
        });

        return {
            userIds: Array.from(recentUserIds),
            sectorIds: Array.from(recentSectorIds)
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
