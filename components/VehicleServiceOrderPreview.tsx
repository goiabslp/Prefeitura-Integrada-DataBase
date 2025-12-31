import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AppState, VehicleSchedule, Vehicle, Person, Sector } from '../types';
import { PageWrapper } from './PageWrapper';
import { Car, User, MapPin, Calendar, Clock, Target, Building2, Ticket, X, Printer } from 'lucide-react';

interface VehicleServiceOrderPreviewProps {
    schedule: VehicleSchedule;
    vehicle: Vehicle;
    driver: Person;
    requester?: Person;
    sector?: Sector;
    state: AppState;
    onClose: () => void;
}

export const VehicleServiceOrderPreview: React.FC<VehicleServiceOrderPreviewProps> = ({
    schedule,
    vehicle,
    driver,
    requester,
    sector,
    state,
    onClose
}) => {
    // Construct a synthetic state for the PageWrapper to use standard headers/footers
    // We override specific content fields to match the context of a Service Order
    const previewState: AppState = {
        ...state,
        document: {
            ...state.document,
            showSignature: false
        },
        branding: {
            ...state.branding,
            watermark: {
                ...state.branding.watermark,
                enabled: false
            }
        },
        content: {
            ...state.content,
            title: "ORDEM DE TRÁFEGO / SERVIÇO",
            protocol: schedule.id.substring(0, 8).toUpperCase(), // Short ID for protocol
            signatureSector: sector?.name || 'Setor de Transportes',
            // We don't necessarily use the standard body text, we render custom children
        }
    };

    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownloadPdf = async () => {
        setIsGenerating(true);
        // Aguarda o re-render com escala 1.0 e sem sombras
        setTimeout(async () => {
            const element = document.getElementById('os-preview-content');
            if (element) {
                const opt = {
                    margin: 0,
                    filename: `Ordem-Servico-${schedule.id.substring(0, 8).toUpperCase()}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        letterRendering: true,
                        scrollY: 0,
                        scrollX: 0
                    },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak: { mode: 'css' }
                };
                // @ts-ignore
                await window.html2pdf().from(element).set(opt).save();
            }
            setIsGenerating(false);
        }, 300);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return createPortal(
        <div className={`fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md animate-fade-in ${isGenerating ? 'bg-white' : ''}`}>

            {/* Camada de Interface (Botões Fixos) */}
            {!isGenerating && (
                <div className="hidden xl:block">
                    <div className="fixed left-12 top-12 z-[100]">
                        <button
                            onClick={handleDownloadPdf}
                            disabled={isGenerating}
                            className="group px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all shadow-2xl shadow-indigo-500/30 active:scale-95 flex items-center gap-3 border border-indigo-400/50 disabled:opacity-50"
                        >
                            <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>{isGenerating ? 'Gerando...' : 'Gerar PDF / Imprimir'}</span>
                        </button>
                    </div>

                    <div className="fixed right-12 top-12 z-[100]">
                        <button
                            onClick={onClose}
                            className="group px-6 py-4 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all shadow-2xl border border-slate-200 active:scale-95 flex items-center gap-3"
                        >
                            <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            <span>Fechar Visualização</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Camada de Rolagem (Conteúdo do Documento) */}
            <div className={`fixed inset-0 overflow-y-auto flex items-start justify-center p-4 md:p-8 ${isGenerating ? 'p-0' : ''}`}>
                <div className={`relative w-full max-w-4xl min-h-full flex flex-col items-center py-12 ${isGenerating ? 'py-0' : ''}`}>
                    {/* Botões Mobile/Tablet (Scrollam com o conteúdo) */}
                    {!isGenerating && (
                        <div className="flex xl:hidden w-full max-w-[800px] gap-3 mb-8 px-4">
                            <button onClick={handleDownloadPdf} className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-xl flex items-center justify-center gap-2">
                                <Printer className="w-4 h-4" /> {isGenerating ? 'Gerando...' : 'PDF'}
                            </button>
                            <button onClick={onClose} className="flex-1 py-4 bg-white text-slate-500 font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center gap-2">
                                <X className="w-4 h-4" /> Fechar
                            </button>
                        </div>
                    )}

                    {/* Document Scale Wrapper */}
                    <div className={`${isGenerating ? 'bg-white p-0' : 'bg-slate-200/50 p-8 rounded-[2rem] shadow-2xl'} overflow-hidden w-full flex justify-center`}>
                        <div id="os-preview-content" className={`${isGenerating ? 'scale-100 transform-none' : 'scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.9]'} origin-top transition-all duration-300 bg-white`}>
                            <PageWrapper state={previewState} pageIndex={0} totalPages={1} isGenerating={isGenerating}>
                                <div className="flex flex-col gap-6 mt-4">

                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Vehicle Card */}
                                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative overflow-hidden">
                                            <div className="absolute right-0 top-0 p-4 opacity-5">
                                                <Car className="w-24 h-24" />
                                            </div>
                                            <div className="relative z-10">
                                                <h3 className="text-[10pt] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                                    <Car className="w-4 h-4" /> Dados do Veículo
                                                </h3>
                                                <div className="space-y-1">
                                                    <p className="text-[14pt] font-black text-slate-800">{vehicle.model}</p>
                                                    <div className="flex gap-4 text-[10pt]">
                                                        <span className="font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-600">{vehicle.plate}</span>
                                                        <span className="text-slate-500">{vehicle.type.toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Driver Card */}
                                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative overflow-hidden">
                                            <div className="absolute right-0 top-0 p-4 opacity-5">
                                                <User className="w-24 h-24" />
                                            </div>
                                            <div className="relative z-10">
                                                <h3 className="text-[10pt] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                                    <User className="w-4 h-4" /> Condutor Responsável
                                                </h3>
                                                <div className="space-y-1">
                                                    <p className="text-[12pt] font-bold text-slate-800">{driver.name}</p>
                                                    <p className="text-[10pt] text-slate-500">{driver.jobId ? 'Motorista Oficial' : 'Condutor Autorizado'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Requester Info */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col justify-center">
                                            <p className="text-[8pt] font-black uppercase text-slate-400 tracking-widest mb-1 flex items-center gap-1">
                                                <Building2 className="w-3 h-3" /> Setor Solicitante
                                            </p>
                                            <p className="text-[10pt] font-bold text-slate-700">{sector?.name || '---'}</p>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col justify-center">
                                            <p className="text-[8pt] font-black uppercase text-slate-400 tracking-widest mb-1 flex items-center gap-1">
                                                <User className="w-3 h-3" /> Solicitado Por
                                            </p>
                                            <p className="text-[10pt] font-bold text-slate-700">{requester?.name || '---'}</p>
                                        </div>
                                    </div>

                                    {/* Trip Details Section */}
                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                                            <h3 className="text-[10pt] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                <MapPin className="w-4 h-4" /> Detalhes da Viagem
                                            </h3>
                                        </div>
                                        <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-8 bg-white">

                                            <div className="space-y-2">
                                                <p className="text-[9pt] font-bold uppercase text-slate-400 tracking-wide flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" /> Data/Hora Saída
                                                </p>
                                                <p className="text-[12pt] font-medium text-slate-800">
                                                    {formatDate(schedule.departureDateTime)} <span className="text-slate-300 mx-2">|</span> {formatTime(schedule.departureDateTime)}
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-[9pt] font-bold uppercase text-slate-400 tracking-wide flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" /> Previsão Retorno
                                                </p>
                                                <p className="text-[12pt] font-medium text-slate-800">
                                                    {schedule.returnDateTime ? formatDate(schedule.returnDateTime) : '---'} <span className="text-slate-300 mx-2">|</span> {schedule.returnDateTime ? formatTime(schedule.returnDateTime) : '---'}
                                                </p>
                                            </div>

                                            <div className="col-span-2 space-y-2 pt-2 border-t border-dashed border-slate-100">
                                                <p className="text-[9pt] font-bold uppercase text-slate-400 tracking-wide flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5" /> Destino
                                                </p>
                                                <p className="text-[12pt] font-bold text-slate-800 uppercase">
                                                    {schedule.destination}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Objective Section */}
                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                                            <h3 className="text-[10pt] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                <Target className="w-4 h-4" /> Objetivo da Viagem
                                            </h3>
                                        </div>
                                        <div className="p-6 bg-white">
                                            <p className="text-[11pt] leading-relaxed text-justify text-slate-700">
                                                {schedule.purpose}
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            </PageWrapper>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
