import React from 'react';
import { FileText, Search, Filter, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const RequestsList: React.FC = () => {
    // Mock Data
    const requests = [
        { id: 'REQ-2024-001', type: 'Solicitação de Insumos', requester: 'Associação Comunitária', date: '12/03/2024', status: 'Aprovado' },
        { id: 'REQ-2024-002', type: 'Manutenção de Estrada', requester: 'Sitio Alvorada', date: '14/03/2024', status: 'Pendente' },
        { id: 'REQ-2024-003', type: 'Gradeação de Solo', requester: 'Fazenda Estrela', date: '15/03/2024', status: 'Recusado' },
        { id: 'REQ-2024-004', type: 'Solicitação de Insumos', requester: 'Produtor Individual', date: '15/03/2024', status: 'Pendente' },
    ];

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'Aprovado': return { color: 'emerald', icon: CheckCircle2 };
            case 'Recusado': return { color: 'rose', icon: XCircle };
            default: return { color: 'amber', icon: Clock };
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Solicitações</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Acompanhamento de pedidos e ofícios</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar solicitações..."
                            className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 w-64 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Solicitante</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {requests.map(req => {
                                const statusCfg = getStatusConfig(req.status);
                                return (
                                    <tr key={req.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">{req.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{req.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-600">{req.requester}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-400">{req.date}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-${statusCfg.color}-50 text-${statusCfg.color}-600 border border-${statusCfg.color}-100`}>
                                                <statusCfg.icon className="w-3 h-3" />
                                                {req.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors hover:underline">
                                                Detalhes
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {requests.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-sm font-medium">Nenhuma solicitação encontrada.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
