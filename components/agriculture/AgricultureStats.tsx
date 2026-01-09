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
import { Tractor, Users, Calendar, AlertCircle, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

export const AgricultureStats: React.FC = () => {
    // Mock Data for Charts
    const servicesData = [
        { name: 'Jan', servicos: 12, horas: 48 },
        { name: 'Fev', servicos: 19, horas: 76 },
        { name: 'Mar', servicos: 15, horas: 60 },
        { name: 'Abr', servicos: 22, horas: 88 },
        { name: 'Mai', servicos: 28, horas: 112 },
        { name: 'Jun', servicos: 25, horas: 100 },
    ];

    const machineryData = [
        { name: 'Tratores', value: 45 },
        { name: 'Retro.', value: 30 },
        { name: 'Caminhões', value: 25 },
    ];

    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Indicadores e Métricas</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Serviços Realizados</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-900">124</span>
                        <span className="text-xs font-bold text-emerald-600 mb-1.5">+12%</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Tractor className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Maquinário Ativo</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-900">8/10</span>
                        <span className="text-xs font-bold text-slate-400 mb-1.5">Disponíveis</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Solicitações Pendentes</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-900">5</span>
                        <span className="text-xs font-bold text-amber-600 mb-1.5">Aguardando</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Produtores Atendidos</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-900">42</span>
                        <span className="text-xs font-bold text-purple-600 mb-1.5">Este mês</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Evolução de Serviços</h3>
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
                                <Bar dataKey="servicos" name="Qtd. Serviços" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={32} />
                                <Bar dataKey="horas" name="Horas Máquina" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Demanda Mensal</h3>
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
                                <Line type="monotone" dataKey="servicos" name="Solicitações" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
