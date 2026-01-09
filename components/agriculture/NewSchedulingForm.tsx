import React from 'react';
import { Calendar, Clock, MapPin, User, Info, Save, X } from 'lucide-react';

export const NewSchedulingForm: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Novo Agendamento</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Solicitar maquinário ou veículo</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 overflow-hidden flex-1">
                <form className="grid grid-cols-12 gap-6 w-full">
                    <div className="col-span-12 md:col-span-6 lg:col-span-3 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Info className="w-3.5 h-3.5" /> Tipo de Recurso
                        </label>
                        <select className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all">
                            <option value="">Selecione...</option>
                            <option value="trator">Trator Agrícola</option>
                            <option value="retroescavadeira">Retroescavadeira</option>
                            <option value="caminhao">Caminhão</option>
                            <option value="veiculo_passeio">Veículo de Passeio</option>
                        </select>
                    </div>

                    <div className="col-span-12 md:col-span-6 lg:col-span-3 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <User className="w-3.5 h-3.5" /> Solicitante
                        </label>
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all"
                            placeholder="Nome do produtor ou servidor"
                        />
                    </div>

                    <div className="col-span-12 md:col-span-6 lg:col-span-3 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" /> Data Início
                        </label>
                        <input
                            type="datetime-local"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all"
                        />
                    </div>

                    <div className="col-span-12 md:col-span-6 lg:col-span-3 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" /> Data Fim (Previsão)
                        </label>
                        <input
                            type="datetime-local"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all"
                        />
                    </div>

                    <div className="col-span-12 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" /> Local / Propriedade
                        </label>
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all"
                            placeholder="Endereço ou nome da propriedade rural"
                        />
                    </div>

                    <div className="col-span-12 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Info className="w-3.5 h-3.5" /> Descrição do Serviço
                        </label>
                        <textarea
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all min-h-[120px] resize-none"
                            placeholder="Descreva o serviço a ser realizado..."
                        ></textarea>
                    </div>

                    <div className="col-span-12 pt-6 flex justify-end gap-3">
                        <button type="button" className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all text-sm uppercase tracking-wide">
                            Cancelar
                        </button>
                        <button type="button" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all text-sm uppercase tracking-wide flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            Salvar Agendamento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
