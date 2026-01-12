import React, { useState } from 'react';
import { MapPin, User, Info, Save, Phone, AlertTriangle, Hammer, ImageIcon, X, Upload, Activity, Trees, Truck, Construction, ShieldAlert, Building2, Landmark, Flag } from 'lucide-react';
import { ObrasSelect, Option } from './ObrasSelect';

export const ObrasForm: React.FC = () => {
    const [images, setImages] = useState<string[]>([]);
    const [priority, setPriority] = useState('');
    const [type, setType] = useState('');
    const [zone, setZone] = useState('');

    // Mock generic upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setImages(prev => [...prev, event.target!.result as string]);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const priorityOptions: Option[] = [
        { value: 'normal', label: 'Normal', icon: Activity },
        { value: 'alta', label: 'Alta', icon: AlertTriangle },
        { value: 'urgencia', label: 'Urgência', icon: ShieldAlert },
    ];

    const typeOptions: Option[] = [
        { value: 'maquinario', label: 'Maquinário', icon: Truck },
        { value: 'buraco', label: 'Tapa Buraco', icon: Construction },
        { value: 'estrada', label: 'Manutenção de Estrada', icon: MapPin },
        { value: 'ponte', label: 'Reparo de Ponte', icon: Hammer },
        { value: 'arvore', label: 'Poda de Árvore', icon: Trees },
        { value: 'outros', label: 'Outros', icon: Info },
    ];

    const zoneOptions: Option[] = [
        { value: 'urbana', label: 'Urbana', icon: Building2 },
        { value: 'rural', label: 'Rural', icon: Trees },
    ];

    const inputClass = "w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all hover:bg-white hover:border-orange-200";
    const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2 ml-1";

    return (
        <div className="flex flex-col h-full animate-fade-in gap-4 pb-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between shrink-0 px-1">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <Hammer className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Nova Solicitação</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cadastrar demanda de serviço</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="overflow-y-auto custom-scrollbar p-6 md:p-8">
                    <form className="grid grid-cols-12 gap-x-6 gap-y-5 w-full max-w-[1600px] mx-auto">

                        {/* Row 1: Requester - Exclusive Line */}
                        <div className="col-span-12">
                            <label className={labelClass}>
                                <User className="w-3.5 h-3.5" /> Nome do Solicitante
                            </label>
                            <input
                                type="text"
                                className={inputClass}
                                placeholder="Nome completo do solicitante"
                            />
                        </div>

                        {/* Row 2: Basic Info & Contact & Zone */}
                        <div className="col-span-12 md:col-span-3">
                            <ObrasSelect
                                label="Prioridade"
                                value={priority}
                                onChange={setPriority}
                                options={priorityOptions}
                                icon={AlertTriangle}
                                placeholder="Selecione..."
                                required
                            />
                        </div>

                        <div className="col-span-12 md:col-span-3">
                            <ObrasSelect
                                label="Tipo de Demanda"
                                value={type}
                                onChange={setType}
                                options={typeOptions}
                                icon={Info}
                                placeholder="Selecione..."
                                required
                            />
                        </div>

                        <div className="col-span-12 md:col-span-3">
                            <ObrasSelect
                                label="Zona"
                                value={zone}
                                onChange={setZone}
                                options={zoneOptions}
                                icon={MapPin}
                                placeholder="Selecione..."
                                required
                            />
                        </div>

                        <div className="col-span-12 md:col-span-3">
                            <label className={labelClass}>
                                <Phone className="w-3.5 h-3.5" /> Contato
                            </label>
                            <input
                                type="text"
                                className={inputClass}
                                placeholder="(00) 00000-0000"
                            />
                        </div>

                        {/* Row 3: Detailed Address */}
                        <div className="col-span-12 md:col-span-5">
                            <label className={labelClass}>
                                <MapPin className="w-3.5 h-3.5" /> Logradouro
                            </label>
                            <input
                                type="text"
                                className={inputClass}
                                placeholder="Av. Principal, Rua das Flores..."
                            />
                        </div>

                        <div className="col-span-12 md:col-span-3">
                            <label className={labelClass}>
                                <Building2 className="w-3.5 h-3.5" /> Bairro
                            </label>
                            <input
                                type="text"
                                className={inputClass}
                                placeholder="Centro, Jd. Novo..."
                            />
                        </div>

                        <div className="col-span-12 md:col-span-4">
                            <label className={labelClass}>
                                <Landmark className="w-3.5 h-3.5" /> Localidade
                            </label>
                            <input
                                type="text"
                                className={inputClass}
                                placeholder="Distrito, Comunidade..."
                            />
                        </div>

                        {/* Row 4: Reference Point */}
                        <div className="col-span-12">
                            <label className={labelClass}>
                                <Flag className="w-3.5 h-3.5" /> Ponto de Referência
                            </label>
                            <input
                                type="text"
                                className={inputClass}
                                placeholder="Próximo à escola, em frente ao posto de saúde..."
                            />
                        </div>

                        {/* Row 5: Description (Large) */}
                        <div className="col-span-12">
                            <label className={labelClass}>
                                <Info className="w-3.5 h-3.5" /> Descrição da Demanda
                            </label>
                            <textarea
                                className={`${inputClass} min-h-[100px] resize-none`}
                                placeholder="Descreva detalhadamente o serviço a ser realizado..."
                            ></textarea>
                        </div>

                        {/* Row 6: Image Upload */}
                        <div className="col-span-12">
                            <label className={labelClass}>
                                <ImageIcon className="w-3.5 h-3.5" /> Fotos do Local
                            </label>
                            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                                <label className="shrink-0 w-28 h-28 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 hover:border-orange-400 transition-all group">
                                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-orange-500 mb-1 transition-colors" />
                                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-orange-500 uppercase tracking-wide text-center px-2">Adicionar</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>

                                {images.map((img, idx) => (
                                    <div key={idx} className="shrink-0 w-28 h-28 relative group rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                                        <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg backdrop-blur-sm transition-all shadow-sm"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer Actions - Sticky */}
                <div className="p-4 md:px-8 md:py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
                    <button type="button" className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-white hover:shadow-sm transition-all text-sm uppercase tracking-wide">
                        Cancelar
                    </button>
                    <button type="button" className="px-6 py-2.5 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all text-sm uppercase tracking-wide flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0">
                        <Save className="w-4 h-4" />
                        Registrar Solicitação
                    </button>
                </div>
            </div>
        </div>
    );
};
