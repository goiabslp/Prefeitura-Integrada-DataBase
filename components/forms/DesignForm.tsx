import React, { useRef, useState } from 'react';
import {
  Upload, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight,
  MapPin, Droplets, Maximize, Heading, Loader2, Sparkles, Palette, ChevronUp
} from 'lucide-react';
import { AppState, BrandingConfig, DocumentConfig } from '../../types';
import { uploadAsset } from '../../services/settingsService';

interface DesignFormProps {
  branding: BrandingConfig;
  docConfig: DocumentConfig;
  handleUpdate: (section: keyof AppState, key: string, value: any) => void;
  handleDeepUpdate: (section: keyof AppState, subSection: string, key: string, value: any) => void;
}

export const DesignForm: React.FC<DesignFormProps> = ({
  branding,
  docConfig,
  handleUpdate,
  handleDeepUpdate
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [watermarkUploading, setWatermarkUploading] = useState(false);
  const [activeSection, setActiveSection] = useState<'branding' | 'watermark' | 'typography'>('branding');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoUploading(true);
      const url = await uploadAsset(file, 'logos');
      if (url) {
        handleUpdate('branding', 'logoUrl', url);
      } else {
        alert('Erro ao fazer upload da imagem. Tente novamente.');
      }
      setLogoUploading(false);
    }
  };

  const handleWatermarkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setWatermarkUploading(true);
      const url = await uploadAsset(file, 'watermarks');
      if (url) {
        handleDeepUpdate('branding', 'watermark', 'imageUrl', url);
      } else {
        alert('Erro ao fazer upload da marca d\'água. Tente novamente.');
      }
      setWatermarkUploading(false);
    }
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1";
  const cardClass = "bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 relative overflow-hidden group hover:shadow-md transition-all duration-300";

  return (
    <div className="space-y-8 animate-fade-in pb-20">


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation / Sidebar (Optional for larger screens, or just layout preference) */}

        <div className="lg:col-span-12 space-y-8">

          {/* LOGO SECTION */}
          <section className={cardClass}>
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <ImageIcon className="w-40 h-40 text-purple-600" />
            </div>

            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Identidade Visual</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Logotipo e Alinhamento</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
              <div className="md:col-span-4 lg:col-span-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all group/upload relative overflow-hidden ${logoUploading ? 'pointer-events-none opacity-70' : ''}`}
                >
                  {branding.logoUrl ? (
                    <img src={branding.logoUrl} alt="Logo" className="w-3/4 h-3/4 object-contain transition-transform group-hover/upload:scale-110 duration-500" />
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover/upload:text-purple-500 transition-colors">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 group-hover/upload:text-purple-600">Carregar Logo</span>
                    </div>
                  )}

                  {logoUploading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                  )}

                  {branding.logoUrl && !logoUploading && (
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      <span className="px-3 py-1.5 bg-white rounded-lg text-xs font-bold text-slate-900 shadow-lg transform translate-y-2 group-hover/upload:translate-y-0 transition-transform">Alterar</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdate('branding', 'logoUrl', null); }}
                        className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 shadow-lg transform translate-y-2 group-hover/upload:translate-y-0 transition-transform delay-75"
                      >
                        <Upload className="w-4 h-4 rotate-45" /> {/* Using icon as X */}
                      </button>
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
              </div>

              <div className="md:col-span-8 lg:col-span-9 space-y-6">
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-2">
                      <Maximize className="w-3 h-3" /> Tamanho no Documento
                    </span>
                  </label>
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={branding.logoWidth}
                      onChange={(e) => handleUpdate('branding', 'logoWidth', Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs font-bold text-slate-400">Pequeno (20mm)</span>
                      <span className="px-3 py-1 bg-white rounded-lg shadow-sm border border-slate-200 text-xs font-black text-purple-600">{branding.logoWidth}mm</span>
                      <span className="text-xs font-bold text-slate-400">Grande (100mm)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Alinhamento</label>
                  <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100 w-full md:w-fit">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => handleUpdate('branding', 'logoAlignment', align)}
                        className={`px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-wide ${branding.logoAlignment === align ? 'bg-white shadow-md text-purple-600 ring-1 ring-purple-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                      >
                        {align === 'left' && <AlignLeft className="w-4 h-4" />}
                        {align === 'center' && <AlignCenter className="w-4 h-4" />}
                        {align === 'right' && <AlignRight className="w-4 h-4" />}
                        <span className="hidden sm:inline">{align === 'left' ? 'Esquerda' : align === 'center' ? 'Centro' : 'Direita'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* INFO & LOCATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className={cardClass}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Localização</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Cabeçalho Padrão</p>
                </div>
              </div>

              <div>
                <label className={labelClass}>Cidade do Documento</label>
                <input
                  type="text"
                  value={docConfig.city}
                  onChange={(e) => handleUpdate('document', 'city', e.target.value)}
                  className={inputClass}
                  placeholder="Ex: São José do Goiabal - MG"
                />
                <p className="text-[10px] text-slate-400 mt-2 font-medium flex items-center gap-1.5 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Aparece automaticamente no cabeçalho
                </p>
              </div>
            </section>

            <section className={cardClass}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                  <Heading className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Tipografia</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Estilo dos Títulos</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Tamanho da Fonte (pt)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="10"
                      max="72"
                      value={docConfig.titleStyle?.size || 32}
                      onChange={(e) => handleDeepUpdate('document', 'titleStyle', 'size', Number(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                    <span className="w-16 text-center px-2 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">{docConfig.titleStyle?.size || 32}pt</span>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Cor Principal</label>
                  <div className="flex items-center gap-3 p-1.5 bg-slate-50 border border-slate-200 rounded-xl w-fit pr-4">
                    <div className="relative overflow-hidden w-10 h-10 rounded-lg shadow-sm ring-1 ring-black/5">
                      <input
                        type="color"
                        value={docConfig.titleStyle?.color || branding.primaryColor}
                        onChange={(e) => handleDeepUpdate('document', 'titleStyle', 'color', e.target.value)}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] cursor-pointer p-0 border-0"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">HEX Code</span>
                      <span className="text-xs font-mono font-bold text-slate-700 uppercase">{docConfig.titleStyle?.color || branding.primaryColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* WATERMARK SECTION */}
          <section className={`${cardClass} border-l-4 ${branding.watermark.enabled ? 'border-l-indigo-500' : 'border-l-slate-200'}`}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${branding.watermark.enabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Marca d'Água</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Fundo dos Documentos</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={branding.watermark.enabled} onChange={(e) => handleDeepUpdate('branding', 'watermark', 'enabled', e.target.checked)} className="sr-only peer" />
                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
              </label>
            </div>

            <div className={`transition-all duration-500 overflow-hidden ${branding.watermark.enabled ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-50'}`}>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-8">

                <div className="lg:col-span-3">
                  <div className="text-center mb-4">
                    <label className={labelClass}>Pré-visualização</label>
                  </div>
                  <div
                    onClick={() => watermarkInputRef.current?.click()}
                    className={`aspect-[3/4] rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-all group/wm relative overflow-hidden`}
                  >
                    {branding.watermark.imageUrl ? (
                      <div className="relative w-full h-full p-4 flex items-center justify-center">
                        <img
                          src={branding.watermark.imageUrl}
                          alt="Watermark"
                          className="w-full h-full object-contain"
                          style={{
                            filter: branding.watermark.grayscale ? 'grayscale(100%)' : 'none',
                            opacity: branding.watermark.opacity / 100
                          }}
                        />
                        <div className="absolute inset-0 bg-indigo-900/10 backdrop-blur-[1px] opacity-0 group-hover/wm:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 shadow-lg">Alterar Imagem</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <span className="text-xs font-bold text-slate-400">Carregar</span>
                      </div>
                    )}

                    {watermarkUploading && (
                      <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                      </div>
                    )}
                  </div>
                  <input type="file" ref={watermarkInputRef} onChange={handleWatermarkUpload} accept="image/*" className="hidden" />
                </div>

                <div className="lg:col-span-9 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className={labelClass}>Opacidade ({branding.watermark.opacity}%)</label>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <input
                          type="range"
                          min="5"
                          max="100"
                          value={branding.watermark.opacity}
                          onChange={(e) => handleDeepUpdate('branding', 'watermark', 'opacity', Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Tamanho ({branding.watermark.size}%)</label>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={branding.watermark.size}
                          onChange={(e) => handleDeepUpdate('branding', 'watermark', 'size', Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={`${cardClass} flex items-center gap-4 cursor-pointer !p-4 !overflow-visible hover:!border-indigo-200`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${branding.watermark.grayscale ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <span className="block text-sm font-bold text-slate-900">Escala de Cinza</span>
                        <span className="block text-xs text-slate-500">Converter imagem para preto e branco automaticamente</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={branding.watermark.grayscale}
                        onChange={(e) => handleDeepUpdate('branding', 'watermark', 'grayscale', e.target.checked)}
                        className="w-6 h-6 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
