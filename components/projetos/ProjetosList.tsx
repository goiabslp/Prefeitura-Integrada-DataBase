import React, { useState, useEffect } from 'react';
import { Projeto, User, Sector } from '../../types';
import { getProjetos } from '../../services/projetosService';
import { Plus, Search, Filter, LayoutGrid, Clock, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

interface ProjetosListProps {
    userId: string;
    userRole: string;
    currentUserSector?: string;
    users: User[];
    sectors: Sector[];
    onNew: () => void;
    onViewProjeto: (id: string) => void;
}

export const ProjetosList: React.FC<ProjetosListProps> = ({
    userId,
    userRole,
    currentUserSector,
    users,
    sectors,
    onNew,
    onViewProjeto
}) => {
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const loadProjetos = async () => {
        setIsLoading(true);
        const data = await getProjetos();
        setProjetos(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadProjetos();
    }, []);

    // Filter logic based on user role
    const filteredProjetos = projetos.filter(p => {
        // Access logic: Admin sees all. Others see if they are the creator, the current owner, or if the project is in their sector.
        const canView = userRole === 'admin' ||
            p.created_by === userId ||
            p.current_owner_id === userId ||
            (currentUserSector && p.current_sector_id === currentUserSector);

        if (!canView) return false;

        // Search term
        const searchUpper = searchTerm.toUpperCase();
        const matchesSearch = p.name.toUpperCase().includes(searchUpper) ||
            users.find(u => u.id === p.responsible_id)?.name.toUpperCase().includes(searchUpper);

        // Status filter
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Aguardando Admin': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Em Andamento': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Concluído': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Cancelado': return 'bg-rose-100 text-rose-800 border-rose-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Aguardando Admin': return <Clock className="w-4 h-4" />;
            case 'Em Andamento': return <AlertCircle className="w-4 h-4" />;
            case 'Concluído': return <CheckCircle2 className="w-4 h-4" />;
            case 'Cancelado': return <Trash2 className="w-4 h-4" />;
            default: return null;
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-b-4 border-fuchsia-500 pb-1 inline-block">Projetos</h1>
                    <p className="text-slate-500 mt-2 font-medium">Gerencie e acompanhe todos os projetos da sua unidade.</p>
                </div>
                <button
                    onClick={onNew}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-slate-800 hover:shadow-lg transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Novo Projeto
                </button>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar projetos por nome ou responsável..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
                <div className="relative md:w-64">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none appearance-none font-medium text-slate-700"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="Aguardando Admin">Aguardando Admin</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Cancelado">Cancelado</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-fuchsia-600 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
                </div>
            ) : filteredProjetos.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <LayoutGrid className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum projeto encontrado</h3>
                    <p className="text-slate-500 max-w-md">Você ainda não tem projetos ou nenhum corresponde à sua busca atual.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjetos.map(projeto => {
                        const responsible = users.find(u => u.id === projeto.responsible_id);
                        const currentSectorName = sectors.find(s => s.id === projeto.current_sector_id)?.name || 'Geral';

                        return (
                            <div
                                key={projeto.id}
                                onClick={() => onViewProjeto(projeto.id)}
                                className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200 cursor-pointer overflow-hidden flex flex-col group"
                            >
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(projeto.status)}`}>
                                            {getStatusIcon(projeto.status)}
                                            {projeto.status}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-fuchsia-600 transition-colors">{projeto.name}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-3 mb-4">{projeto.description || 'Sem descrição.'}</p>

                                    <div className="grid grid-cols-2 gap-4 mt-auto">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsável</p>
                                            <p className="text-sm font-semibold text-slate-700 truncate">{responsible?.name || 'Desconhecido'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Setor Atual</p>
                                            <p className="text-sm font-semibold text-slate-700 truncate">{currentSectorName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Início</p>
                                            <p className="text-sm font-semibold text-slate-700 truncate">{projeto.start_date ? new Date(projeto.start_date).toLocaleDateString('pt-BR') : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Término</p>
                                            <p className="text-sm font-semibold text-slate-700 truncate">{projeto.end_date ? new Date(projeto.end_date).toLocaleDateString('pt-BR') : '-'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center text-xs font-medium text-slate-500">
                                    <span>Criado em: {new Date(projeto.created_at || '').toLocaleDateString('pt-BR')}</span>
                                    <span className="text-fuchsia-600 font-bold group-hover:underline">Ver detalhes &rarr;</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
