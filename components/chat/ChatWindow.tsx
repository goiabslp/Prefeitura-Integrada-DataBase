import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Send, File, Image, CheckCheck, Users, Building2, User, MessageCircle, ArrowLeft, MoreVertical, Clock, Trash2, AlertTriangle, Globe, UserPlus, Smile, Paperclip } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { chatService } from '../../services/chatService';

export const ChatWindow: React.FC = () => {
    const { isOpen, setIsOpen, activeChat, setActiveChat, messages, sendMessage, onlineUsers, refreshUnreadCount } = useChat();
    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [sidebarSearch, setSidebarSearch] = useState('');
    const [usersList, setUsersList] = useState<any[]>([]);
    const [sectorsList, setSectorsList] = useState<any[]>([]);
    const [recentList, setRecentList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSidebarTab, setActiveSidebarTab] = useState<'recent' | 'users' | 'sectors'>('recent');
    const [deleteConfirm, setDeleteConfirm] = useState<{ targetId: string, type: 'user' | 'sector', name: string } | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const { uploadAttachment } = useChat();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const windowRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (windowRef.current && !windowRef.current.contains(event.target as Node)) {
                const isToggleButton = (event.target as Element).closest('.chat-toggle-btn');
                if (!isToggleButton) {
                    setIsOpen(false);
                }
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, setIsOpen]);

    // Close emoji picker on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const commonEmojis = ['😊', '😂', '❤️', '🔥', '👍', '🙌', '🚀', '✅', '⚠️', '📁', '📍', '⭐'];

    const handleEmojiClick = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileData = await uploadAttachment(file);
            await sendMessage('', fileData);
        } catch (err) {
            console.error('Upload error:', err);
            alert('Falha ao enviar arquivo.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Fetch users and sectors
    const loadSidebarData = async () => {
        if (!isOpen) return;
        setIsLoading(true);
        setError(null);

        try {
            const [users, sectors, recent] = await Promise.all([
                chatService.fetchChatUsers(),
                chatService.fetchChatSectors(),
                chatService.fetchRecentConversations(user?.id || '')
            ]);

            const finalUsers = users ? users.filter(u => u.id !== user?.id) : [];
            const finalSectors = sectors || [];

            // Categorize Recent
            const recentItems: any[] = [];
            const userIdsSet = new Set(recent.userIds);
            const sectorIdsSet = new Set(recent.sectorIds);

            const remainingUsers = finalUsers.filter(u => {
                if (userIdsSet.has(u.id)) {
                    recentItems.push({ ...u, type: 'user' });
                    return false;
                }
                return true;
            });

            const remainingSectors = finalSectors.filter(s => {
                if (sectorIdsSet.has(s.id)) {
                    recentItems.push({ ...s, type: 'sector' });
                    return false;
                }
                return true;
            });

            // Special check for Global Items in Recent
            if (sectorIdsSet.has('global')) {
                recentItems.push({ id: 'global', name: 'Todos os Setores', type: 'sector', isGlobal: true });
            }
            if (sectorIdsSet.has('global-users')) {
                recentItems.push({ id: 'global-users', name: 'Todos os Usuários', type: 'user', isGlobal: true });
            }

            setUsersList(remainingUsers);
            setSectorsList(remainingSectors);
            setRecentList(recentItems);
        } catch (err) {
            console.error('Error fetching chat data:', err);
            setError('Erro ao carregar lista. Verifique sua conexão.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSidebarData();
    }, [isOpen, user]);

    const handleDeleteConversation = (e: React.MouseEvent, targetId: string, type: 'user' | 'sector', name: string) => {
        e.stopPropagation();
        setDeleteConfirm({ targetId, type, name });
    };

    const confirmDelete = async () => {
        if (!user || !deleteConfirm) return;

        try {
            await chatService.deleteConversation(user.id, deleteConfirm.targetId, deleteConfirm.type);
            await loadSidebarData();
            await refreshUnreadCount();
            if (activeChat && activeChat.id === deleteConfirm.targetId && activeChat.type === deleteConfirm.type) {
                setActiveChat(null);
            }
        } catch (err) {
            console.error('Error deleting conversation:', err);
            alert('Não foi possível excluir a conversa.');
        } finally {
            setDeleteConfirm(null);
        }
    };

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeChat]);

    if (!isOpen) return null;

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        await sendMessage(newMessage);
        setNewMessage('');
    };

    // Filtered lists for search
    const filteredRecent = recentList.filter(item => {
        const search = sidebarSearch.toLowerCase();
        const name = (item.name || item.username || '').toLowerCase();
        return name.includes(search);
    });

    const filteredUsersList = usersList.filter(u => {
        const search = sidebarSearch.toLowerCase();
        const name = (u.name || '').toLowerCase();
        const username = (u.username || '').toLowerCase();
        return name.includes(search) || username.includes(search);
    });

    const filteredSectorsList = sectorsList.filter(s => {
        const search = sidebarSearch.toLowerCase();
        const name = (s.name || '').toLowerCase();
        return name.includes(search);
    });

    return (
        <div
            ref={windowRef}
            className="fixed bottom-24 right-6 z-50 flex h-[500px] max-h-[calc(100vh-160px)] w-[360px] overflow-hidden rounded-2xl border border-white/40 bg-white/90 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-10 fade-in duration-300 flex-col"
        >
            {/* Header */}
            <div className="h-16 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-between shrink-0">
                {activeChat ? (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setActiveChat(null)}
                            className="p-1 rounded-full text-white/80 hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            {activeChat.type === 'user' ? (
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white font-bold text-sm border border-white/30">
                                    {activeChat.name.charAt(0)}
                                </div>
                            ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-white border border-white/30">
                                    <Building2 className="h-5 w-5" />
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="text-white font-semibold text-sm leading-tight">{activeChat.name}</span>
                                <span className={`text-[10px] flex items-center gap-1 ${onlineUsers.has(activeChat.id) ? 'text-white/60' : 'text-slate-200'}`}>
                                    <span className={`block h-1.5 w-1.5 rounded-full ${onlineUsers.has(activeChat.id) ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                                    {onlineUsers.has(activeChat.id) ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-6 w-6 text-white" />
                        <span className="text-white font-bold text-lg">Mensagens</span>
                    </div>
                )}

                <div className="flex items-center gap-1">
                    <button className="p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                        <MoreVertical className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-slate-50 flex flex-col">
                {!activeChat ? (
                    <>
                        {/* Search Bar */}
                        <div className="p-3 bg-white border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={sidebarSearch}
                                    onChange={(e) => setSidebarSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Tabs Switcher */}
                        <div className="px-3 py-2 bg-white">
                            <div className="flex p-1 bg-slate-100/50 rounded-xl gap-1">
                                <button
                                    onClick={() => setActiveSidebarTab('recent')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${activeSidebarTab === 'recent'
                                        ? 'bg-white text-violet-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <Clock className="h-3.5 w-3.5" />
                                    Recentes
                                </button>
                                <button
                                    onClick={() => setActiveSidebarTab('users')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${activeSidebarTab === 'users'
                                        ? 'bg-white text-violet-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <Users className="h-3.5 w-3.5" />
                                    Usuários
                                </button>
                                <button
                                    onClick={() => setActiveSidebarTab('sectors')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${activeSidebarTab === 'sectors'
                                        ? 'bg-white text-violet-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <Building2 className="h-3.5 w-3.5" />
                                    Setores
                                </button>
                            </div>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-hide">


                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-3">
                                    <div className="h-6 w-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[10px] text-slate-500 font-medium">Carregando...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Recent Tab Content */}
                                    {activeSidebarTab === 'recent' && (
                                        <div className="space-y-1 animate-in fade-in slide-in-from-left-2 duration-300">
                                            {filteredRecent.length > 0 ? (
                                                filteredRecent.map(item => (
                                                    <div key={`${item.type}-${item.id}`} className="relative group">
                                                        <button
                                                            onClick={() => setActiveChat({
                                                                type: item.type,
                                                                id: item.id,
                                                                name: item.name || item.username
                                                            })}
                                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100"
                                                        >
                                                            <div className="relative">
                                                                {item.isGlobal ? (
                                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm ring-2 ring-white group-hover:scale-105 transition-transform ${item.id === 'global' ? 'bg-violet-600' : 'bg-indigo-600'}`}>
                                                                        {item.id === 'global' ? <Globe className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold uppercase overflow-hidden ring-2 ring-white shadow-sm ${item.type === 'user' ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-600'}`}>
                                                                            {(item.name || item.username || '?').substring(0, 2)}
                                                                        </div>
                                                                        {item.type === 'user' && (
                                                                            <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white shadow-sm ${onlineUsers.has(item.id) ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 text-left min-w-0">
                                                                <p className="truncate text-xs font-bold text-slate-700">
                                                                    {item.name || item.username}
                                                                </p>
                                                                <p className="truncate text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                                                    {item.isGlobal
                                                                        ? (item.id === 'global' ? 'Chat Global' : 'Mural Geral')
                                                                        : (item.type === 'user' ? 'Direto' : 'Setor')}
                                                                </p>
                                                            </div>
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteConversation(e, item.id, item.type, item.name || item.username)}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-100"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                                    <Clock className="h-8 w-8 text-slate-300 mb-2" />
                                                    <p className="text-[10px] text-slate-500 italic">Nenhuma conversa recente</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Users Tab Content */}
                                    {activeSidebarTab === 'users' && (
                                        <div className="space-y-1 animate-in fade-in slide-in-from-right-2 duration-300">
                                            {/* Global Users Chat Option */}
                                            <button
                                                onClick={() => setActiveChat({ type: 'user', id: 'global-users', name: 'Todos os Usuários' })}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border border-transparent hover:border-indigo-100 group ${activeChat?.id === 'global-users' ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' : 'hover:bg-white hover:shadow-sm'}`}
                                            >
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-indigo-200 shadow-lg group-hover:scale-110 transition-transform">
                                                    <UserPlus className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 text-left min-w-0">
                                                    <p className="truncate text-xs font-bold text-slate-700">
                                                        Todos os Usuários
                                                    </p>
                                                    <p className="truncate text-[10px] text-indigo-600 font-bold uppercase tracking-tighter">
                                                        Mural Geral
                                                    </p>
                                                </div>
                                            </button>

                                            <div className="h-px bg-slate-100 my-2 mx-3" />

                                            {filteredUsersList.length > 0 ? (
                                                filteredUsersList.map(u => (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => setActiveChat({ type: 'user', id: u.id, name: u.name || u.username })}
                                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100 group"
                                                    >
                                                        <div className="relative shrink-0">
                                                            {/* The original code here was for `item` not `u`, and had `isGlobal` which `u` doesn't have.
                                                                Assuming `u` is always a user, and `item` was a placeholder for a more generic list item.
                                                                Reverting to user-specific rendering for `u`.
                                                                If the intent was to generalize this list to include global chat or sectors,
                                                                the `filteredUsersList` and its mapping logic would need to be adjusted upstream.
                                                                For now, applying the user-specific part of the provided change.
                                                            */}
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                                                                {(u.name || u.username || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white shadow-sm ${onlineUsers.has(u.id) ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                                        </div>
                                                        <div className="flex-1 text-left min-w-0">
                                                            <p className="truncate text-xs font-bold text-slate-700">
                                                                {u.name || u.username}
                                                            </p>
                                                            <p className="truncate text-[10px] text-slate-400">
                                                                {u.jobTitle || u.role || 'Colaborador'}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                                    <Search className="h-8 w-8 text-slate-300 mb-2" />
                                                    <p className="text-[10px] text-slate-500 italic">Nenhum usuário encontrado</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Sectors Tab Content */}
                                    {activeSidebarTab === 'sectors' && (
                                        <div className="space-y-1 animate-in fade-in slide-in-from-right-2 duration-300">
                                            {/* Global Chat Option */}
                                            <button
                                                onClick={() => setActiveChat({ type: 'sector', id: 'global', name: 'Todos os Setores' })}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border border-transparent hover:border-violet-100 group ${activeChat?.id === 'global' ? 'bg-violet-50/50 border-violet-100 shadow-sm' : 'hover:bg-white hover:shadow-sm'}`}
                                            >
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-violet-200 shadow-lg group-hover:scale-110 transition-transform">
                                                    <Globe className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 text-left min-w-0">
                                                    <p className="truncate text-xs font-bold text-slate-700">
                                                        Todos os Setores
                                                    </p>
                                                    <p className="truncate text-[10px] text-violet-600 font-bold uppercase tracking-tighter">
                                                        Chat Global
                                                    </p>
                                                </div>
                                            </button>

                                            <div className="h-px bg-slate-100 my-2 mx-3" />

                                            {filteredSectorsList.length > 0 ? (
                                                filteredSectorsList.map(sector => (
                                                    <button
                                                        key={sector.id}
                                                        onClick={() => setActiveChat({ type: 'sector', id: sector.id, name: sector.name })}
                                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100 group"
                                                    >
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:scale-105 transition-transform">
                                                            <Building2 className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex-1 text-left min-w-0">
                                                            <p className="truncate text-xs font-bold text-slate-700">
                                                                {sector.name}
                                                            </p>
                                                            <p className="truncate text-[10px] text-slate-400">
                                                                Canal do Setor
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                                    <Building2 className="h-8 w-8 text-slate-300 mb-2" />
                                                    <p className="text-[10px] text-slate-500 italic">Nenhum setor encontrado</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    /* Chat View Implementation */
                    <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat opacity-100">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                        <MessageCircle className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <p className="text-sm">Nenhuma mensagem ainda.<br />Diga olá para começar!</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.sender_id === user?.id;
                                    return (
                                        <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                            <div className={`max-w-[85%] group relative ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                                <div className={`
                                                    px-4 py-2.5 text-[13px] shadow-sm relative leading-relaxed
                                                    ${isMe
                                                        ? 'bg-violet-600 text-white rounded-[18px] rounded-br-sm'
                                                        : 'bg-white text-slate-700 rounded-[18px] rounded-bl-sm border border-slate-100'
                                                    }
                                                `}>
                                                    {msg.file_url && (
                                                        <div className="mb-2 overflow-hidden rounded-lg">
                                                            {msg.file_type?.startsWith('image/') ? (
                                                                <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="block">
                                                                    <img src={msg.file_url} alt={msg.file_name} className="max-w-full h-auto object-cover hover:opacity-90 transition-opacity" />
                                                                </a>
                                                            ) : (
                                                                <a
                                                                    href={msg.file_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`flex items-center gap-2 p-2 rounded-lg text-[11px] font-bold ${isMe ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}
                                                                >
                                                                    <File className="h-4 w-4 shrink-0" />
                                                                    <span className="truncate flex-1">{msg.file_name}</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                    {msg.message && <p>{msg.message}</p>}
                                                </div>
                                                <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400 font-medium">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {isMe && <CheckCheck className="h-3 w-3 text-violet-500" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 bg-white border-t border-slate-100 relative">
                            {isUploading && (
                                <div className="absolute -top-10 left-0 right-0 h-10 bg-white/80 backdrop-blur-sm flex items-center justify-center gap-2 border-t border-slate-100 animate-in slide-in-from-bottom-2">
                                    <div className="h-3 w-3 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enviando...</span>
                                </div>
                            )}

                            {showEmojiPicker && (
                                <div
                                    ref={emojiPickerRef}
                                    className="absolute bottom-full left-3 mb-2 p-2 bg-white rounded-2xl shadow-2xl border border-slate-100 grid grid-cols-4 gap-1 animate-in zoom-in-95"
                                >
                                    {commonEmojis.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleEmojiClick(emoji)}
                                            className="h-10 w-10 flex items-center justify-center text-xl hover:bg-slate-50 rounded-xl transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleSend} className="flex items-center gap-1.5 px-1">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                <div className="flex items-center gap-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className={`h-9 w-9 flex items-center justify-center rounded-full transition-all ${showEmojiPicker ? 'bg-violet-100 text-violet-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                                    >
                                        <Smile className="h-5 w-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-9 w-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                                    >
                                        <Paperclip className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="flex-1 flex items-end gap-2 bg-slate-100 rounded-[22px] p-1.5 pl-4 border border-transparent focus-within:border-violet-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-50 transition-all">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Mensagem..."
                                        className="flex-1 bg-transparent py-1.5 text-sm text-slate-700 focus:outline-none placeholder:text-slate-400"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() && !isUploading}
                                        className="h-9 w-9 flex items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[280px] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="p-5 flex flex-col items-center text-center">
                            <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-4">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-800 mb-2">Apagar Conversa?</h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                Você está prestes a excluir permanentemente todas as mensagens com <span className="font-bold text-slate-700">"{deleteConfirm.name}"</span>.
                            </p>
                        </div>
                        <div className="flex border-t border-slate-50">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-3 text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition-colors border-r border-slate-50 uppercase"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-3 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors uppercase"
                            >
                                Sim, Apagar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
