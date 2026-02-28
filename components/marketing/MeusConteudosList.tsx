import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { FileText, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MeusConteudosListProps {
    userId: string;
    onOpenDetails: (id: string) => void;
}

export const MeusConteudosList: React.FC<MeusConteudosListProps> = ({ userId, onOpenDetails }) => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                // Fetch requests and their contents
                const { data, error } = await supabase
                    .from('marketing_requests')
                    .select(`
                        id,
                        protocol,
                        status,
                        created_at,
                        marketing_contents ( content_type )
                    `)
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setRequests(data || []);
            } catch (err) {
                console.error("Erro ao buscar requests de marketing:", err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchRequests();
        }
    }, [userId]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'Em Análise': return { color: 'amber', icon: Clock };
            case 'Aprovado': return { color: 'emerald', icon: CheckCircle2 };
            case 'Rejeitado': return { color: 'rose', icon: AlertCircle };
            default: return { color: 'slate', icon: FileText };
        }
    };

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                <p className="text-sm font-semibold tracking-wide">Carregando solicitações...</p>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-base font-medium text-slate-500">Nenhuma solicitação encontrada.</p>
                <p className="text-xs mt-1">Clique em "Novo Conteúdo" para começar.</p>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm">
                    <tr className="border-b border-slate-100 uppercase text-[10px] tracking-wider text-slate-400 font-bold">
                        <th className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap">ID / Protocolo</th>
                        <th className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap">Tipos de Conteúdo</th>
                        <th className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap">Data</th>
                        <th className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map((req) => {
                        const statusConfig = getStatusConfig(req.status);
                        const StatusIcon = statusConfig.icon;
                        const types = req.marketing_contents?.map((c: any) => c.content_type).join(', ') || 'Nenhum';

                        return (
                            <tr
                                key={req.id}
                                onClick={() => onOpenDetails(req.id)}
                                className="group border-b border-slate-50 hover:bg-slate-50/80 cursor-pointer transition-colors"
                            >
                                <td className="py-3 px-4 md:py-4 md:px-6">
                                    <div className="font-bold text-slate-700 text-xs md:text-sm">{req.protocol}</div>
                                </td>
                                <td className="py-3 px-4 md:py-4 md:px-6">
                                    <div className="text-xs md:text-sm text-slate-500 max-w-[150px] md:max-w-[200px] truncate" title={types}>
                                        {types}
                                    </div>
                                </td>
                                <td className="py-3 px-4 md:py-4 md:px-6">
                                    <div className="text-xs md:text-sm text-slate-500">
                                        {format(new Date(req.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                    </div>
                                </td>
                                <td className="py-3 px-4 md:py-4 md:px-6">
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-${statusConfig.color}-50 text-${statusConfig.color}-700 border border-${statusConfig.color}-100`}>
                                        <StatusIcon className={`w-3 h-3 md:w-4 md:h-4 text-${statusConfig.color}-500`} />
                                        <span className="text-[10px] md:text-xs font-black tracking-wide">{req.status}</span>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
