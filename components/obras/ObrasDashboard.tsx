import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend
} from 'recharts';
import { Hammer, Users, AlertTriangle, TrendingUp, CheckCircle2, Cone, Activity, Clock } from 'lucide-react';

export const ObrasDashboard: React.FC = () => {
    // Mock Data for Charts (Obras Context)
    const servicesData = [
        { name: 'Jan', servicos: 34, equipe: 12 },
        { name: 'Fev', servicos: 45, equipe: 14 },
        { name: 'Mar', servicos: 28, equipe: 12 },
        { name: 'Abr', servicos: 52, equipe: 15 },
        { name: 'Mai', servicos: 48, equipe: 15 },
        { name: 'Jun', servicos: 60, equipe: 16 },
    ];

    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard de Obras</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Indicadores e Métricas Operacionais</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Obras Concluídas</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-900">267</span>
                        <span className="text-xs font-bold text-emerald-600 mb-1.5">+8%</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <Cone className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Em Execução</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-900">14</span>
                        <span className="text-xs font-bold text-slate-400 mb-1.5">Obras Ativas</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Urgências</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-900">3</span>
                        <span className="text-xs font-bold text-red-600 mb-1.5">Pendentes</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tempo Médio</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-900">4.5</span>
                        <span className="text-xs font-bold text-blue-600 mb-1.5">Dias</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Evolução Mensal de Obras</h3>
                    <div className="flex-1 w-full min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={servicesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="servicos" name="Obras Realizadas" fill="#ea580c" radius={[6, 6, 0, 0]} barSize={32} />
                                <Bar dataKey="equipe" name="Equipes Ativas" fill="#fdba74" radius={[6, 6, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Demanda x Capacidade</h3>
                    <div className="flex-1 w-full min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={servicesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="servicos" name="Solicitações" stroke="#ea580c" strokeWidth={3} dot={{ r: 4, fill: '#ea580c', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
