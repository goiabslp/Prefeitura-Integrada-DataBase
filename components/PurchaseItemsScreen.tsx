import React, { useState, useEffect } from 'react';
import {
    PackageSearch, PackagePlus, ArrowLeft, Search, Filter,
    MoreVertical, Edit2, Trash2, CheckCircle2, XCircle,
    AlertCircle, Package, Construction, Utensils, Wrench,
    Briefcase, Sparkles, Plus, Archive, History, FileText
} from 'lucide-react';
import { InventoryItem, InventoryCategory } from '../types';
import { getInventoryItems, addToInventory, updateInventoryItem, deleteInventoryItem, restoreItemToTendered } from '../services/comprasService';
import { normalizeText } from '../utils/stringUtils';

interface PurchaseItemsScreenProps {
    onBack: () => void;
    userRole: string;
}

type TabType = 'tendered' | 'untendered';

export const PurchaseItemsScreen: React.FC<PurchaseItemsScreenProps> = ({ onBack, userRole }) => {
    const [activeTab, setActiveTab] = useState<TabType>('tendered');
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | ''>('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [formData, setFormData] = useState<Partial<InventoryItem>>({
        name: '', brand: '', details: '', quantity: 0, unit: 'Unidade', category: 'Material de Uso', is_tendered: true
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchItems();
    }, [activeTab]);

    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const data = await getInventoryItems(activeTab === 'tendered');
            setItems(data);
        } catch (error) {
            console.error("Error fetching inventory:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.category || !formData.unit) return;
        setIsSaving(true);
        try {
            if (editingItem) {
                const updated = await updateInventoryItem(editingItem.id, formData);
                setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
            } else {
                const newItem = await addToInventory({
                    ...formData as any,
                    is_tendered: activeTab === 'tendered'
                });
                setItems(prev => [newItem, ...prev]);
            }
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            alert('Erro ao salvar item.');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este item?')) return;
        try {
            await deleteInventoryItem(id);
            setItems(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            alert('Erro ao excluir.');
        }
    };

    const handleRestore = async (item: InventoryItem) => {
        if (!confirm(`Deseja restaurar "${item.name}" para Licitados? Isso também atualizará o pedido original para "Disponível".`)) return;
        try {
            await restoreItemToTendered(item.id);
            // Remove from current list (since we are likely in untendered tab)
            setItems(prev => prev.filter(i => i.id !== item.id));
            alert('Item restaurado com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao restaurar item.');
        }
    };

    const resetForm = () => {
        setEditingItem(null);
        setFormData({ name: '', brand: '', details: '', quantity: 0, unit: 'Unidade', category: 'Material de Uso', is_tendered: activeTab === 'tendered' });
    };

    const openNewItemModal = () => {
        resetForm();
        setFormData(prev => ({ ...prev, is_tendered: activeTab === 'tendered' }));
        setIsModalOpen(true);
    };

    const openEditModal = (item: InventoryItem) => {
        setEditingItem(item);
        setFormData(item);
        setIsModalOpen(true);
    };

    const normalizedSearch = normalizeText(searchTerm);

    const filteredItems = items.filter(item => {
        const matchesSearch = !normalizedSearch ||
            normalizeText(item.name).includes(normalizedSearch) ||
            (item.brand && normalizeText(item.brand).includes(normalizedSearch));
        const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'Construção': return <Construction className="w-4 h-4" />;
            case 'Alimentação': return <Utensils className="w-4 h-4" />;
            case 'Ferramentas': return <Wrench className="w-4 h-4" />;
            case 'Serviços': return <Briefcase className="w-4 h-4" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 animate-fade-in pt-24">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm px-6 py-5">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-2xl transition-all active:scale-95 group"
                        >
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <PackageSearch className="w-8 h-8 text-indigo-600" />
                                Gestão de Itens
                            </h1>
                            <p className="text-sm font-medium text-slate-500">
                                Catálogo de Produtos e Serviços
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openNewItemModal}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden md:inline uppercase tracking-wider text-xs">Novo Item</span>
                    </button>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Tabs */}
                    <div className="flex bg-slate-100 p-1.5 rounded-xl w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('tendered')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'tendered' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <CheckCircle2 className="w-4 h-4" /> Licitados
                        </button>
                        <button
                            onClick={() => setActiveTab('untendered')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'untendered' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <AlertCircle className="w-4 h-4" /> Não Licitados
                        </button>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar itens..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value as any)}
                            className="pl-4 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
                        >
                            <option value="">Todas Categorias</option>
                            <option value="Construção">Construção</option>
                            <option value="Limpeza">Limpeza</option>
                            <option value="Alimentação">Alimentação</option>
                            <option value="Material de Uso">Material de Uso</option>
                            <option value="Ferramentas">Ferramentas</option>
                            <option value="Serviços">Serviços</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-4">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-bold uppercase tracking-widest">Carregando itens...</p>
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredItems.map(item => (
                            <div key={item.id} className={`bg-white rounded-2xl p-5 hover:shadow-lg transition-all group relative overflow-hidden border-2 ${item.is_tendered ? 'border-slate-100 hover:border-indigo-100' : 'border-rose-500 shadow-lg shadow-rose-500/10'}`}>
                                <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 transition-colors ${item.is_tendered ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                                {!item.is_tendered && (
                                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
                                        <div className="bg-rose-500 text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-lg shadow-rose-500/20 animate-bounce">
                                            Não Licitado
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${item.is_tendered ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'}`}>
                                        {getCategoryIcon(item.category)}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEditModal(item)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider mb-2">
                                        {item.category}
                                    </span>
                                    <h3 className="font-bold text-slate-800 leading-tight mb-1 line-clamp-2" title={item.name}>{item.name}</h3>
                                    <p className="text-xs text-slate-400 font-medium mb-1">{item.brand || 'Marca n/a'}</p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estoque</span>
                                        <span className="text-sm font-bold text-slate-700 font-mono">{item.quantity} {item.unit}</span>
                                    </div>
                                    {!item.is_tendered && (
                                        <div className="flex flex-col items-end gap-2">
                                            {item.original_order_protocol && (
                                                <div className="bg-rose-50 px-2 py-1 rounded text-[9px] font-bold text-rose-600 uppercase tracking-wide border border-rose-100">
                                                    Origem: {item.original_order_protocol}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleRestore(item)}
                                                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors flex items-center gap-1"
                                                title="Enviar para aba Licitados e atualizar pedido original"
                                            >
                                                <History className="w-3 h-3" /> Restaurar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-60">
                        <PackageSearch className="w-20 h-20 text-slate-200 mb-4" />
                        <h3 className="text-lg font-bold text-slate-400">Nenhum item encontrado</h3>
                        <p className="text-sm text-slate-400">Tente ajustar os filtros ou adicione um novo item.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[24px] w-full max-w-lg p-8 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                {editingItem ? <Edit2 className="w-5 h-5 text-indigo-500" /> : <PackagePlus className="w-5 h-5 text-indigo-500" />}
                                {editingItem ? 'Editar Item' : 'Novo Item'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800"><XCircle className="w-6 h-6" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome do Item <span className="text-rose-500">*</span></label>
                                <input
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none font-bold text-slate-700"
                                    placeholder="Ex: Cimento CP II"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Categoria <span className="text-rose-500">*</span></label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none font-bold text-slate-700 bg-white"
                                        value={formData.category || ''}
                                        onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                    >
                                        <option value="Construção">Construção</option>
                                        <option value="Limpeza">Limpeza</option>
                                        <option value="Alimentação">Alimentação</option>
                                        <option value="Material de Uso">Material de Uso</option>
                                        <option value="Ferramentas">Ferramentas</option>
                                        <option value="Serviços">Serviços</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Marca</label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none font-bold text-slate-700"
                                        placeholder="Ex: Votorantim"
                                        value={formData.brand || ''}
                                        onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Detalhes/Especificações</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none font-medium text-slate-600 h-24 resize-none"
                                    placeholder="Detalhes adicionais..."
                                    value={formData.details || ''}
                                    onChange={e => setFormData({ ...formData, details: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Quantidade Inicial</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none font-bold text-slate-700"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Unidade <span className="text-rose-500">*</span></label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none font-bold text-slate-700"
                                        list="units"
                                        placeholder="Ex: Unidade"
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                    />
                                    <datalist id="units">
                                        <option value="Unidade" />
                                        <option value="Caixa" />
                                        <option value="Pacote" />
                                        <option value="Kg" />
                                        <option value="Litro" />
                                        <option value="Serviço" />
                                        <option value="Metro Cúbico (m³)" />
                                    </datalist>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? 'Salvando...' : 'Salvar Item'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
