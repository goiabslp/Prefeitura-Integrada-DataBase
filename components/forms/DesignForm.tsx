import React, { useRef, useState } from 'react';
import {
  Upload, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight,
  MapPin, Droplets, Maximize, Heading, Loader2
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

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> Logotipo do Documento
        </h3>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-3">Imagem do Logo (PDF)</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden relative group">
                {logoUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                ) : branding.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-xs text-slate-400 font-medium text-center px-2">Clique para carregar</span>
                )}

                {!logoUploading && branding.logoUrl && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => handleUpdate('branding', 'logoUrl', null)} className="text-white text-xs hover:underline">Remover</button>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={logoUploading}
                  className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {logoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {logoUploading ? 'Enviando...' : 'Alterar Imagem'}
                </button>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Recomendado: PNG ou JPG com fundo transparente.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Largura no PDF (mm)</label>
              <input type="range" min="20" max="100" value={branding.logoWidth} onChange={(e) => handleUpdate('branding', 'logoWidth', Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
              <div className="text-right text-xs text-slate-400 mt-1 font-bold">{branding.logoWidth}mm</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Alinhamento</label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button key={align} onClick={() => handleUpdate('branding', 'logoAlignment', align)} className={`flex-1 p-1.5 rounded flex items-center justify-center transition-all ${branding.logoAlignment === align ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>
                    {align === 'left' && <AlignLeft className="w-4 h-4" />}
                    {align === 'center' && <AlignCenter className="w-4 h-4" />}
                    {align === 'right' && <AlignRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Informações Locais
        </h3>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <label className="block text-xs font-semibold text-slate-500 mb-2">Cidade do Documento (Valor Padrão)</label>
          <input
            type="text"
            value={docConfig.city}
            onChange={(e) => handleUpdate('document', 'city', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Ex: São José do Goiabal - MG"
          />
          <p className="text-[10px] text-slate-400 mt-2 italic">* Este valor aparece automaticamente no cabeçalho em cascata.</p>
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Droplets className="w-4 h-4" /> Marca d'Água
          </h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={branding.watermark.enabled} onChange={(e) => handleDeepUpdate('branding', 'watermark', 'enabled', e.target.checked)} className="sr-only peer" />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {branding.watermark.enabled && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-3">Imagem da Marca d'Água</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden relative group">
                  {watermarkUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  ) : branding.watermark.imageUrl ? (
                    <img
                      src={branding.watermark.imageUrl}
                      alt="Watermark"
                      className="w-full h-full object-contain p-1"
                      style={{ filter: branding.watermark.grayscale ? 'grayscale(100%)' : 'none' }}
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Nenhuma</span>
                  )}
                </div>
                <div className="flex-1">
                  <input type="file" ref={watermarkInputRef} onChange={handleWatermarkUpload} accept="image/*" className="hidden" />
                  <button
                    onClick={() => watermarkInputRef.current?.click()}
                    disabled={watermarkUploading}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {watermarkUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {watermarkUploading ? 'Enviando...' : 'Carregar Imagem'}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5"><Maximize className="w-3 h-3" /> Tamanho (%)</label>
                <input
                  type="range" min="10" max="100"
                  value={branding.watermark.size}
                  onChange={(e) => handleDeepUpdate('branding', 'watermark', 'size', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-right text-[10px] text-slate-400 mt-1 font-bold">{branding.watermark.size}%</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5"><Droplets className="w-3 h-3" /> Opacidade (%)</label>
                <input
                  type="range" min="5" max="100"
                  value={branding.watermark.opacity}
                  onChange={(e) => handleDeepUpdate('branding', 'watermark', 'opacity', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-right text-[10px] text-slate-400 mt-1 font-bold">{branding.watermark.opacity}%</div>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={branding.watermark.grayscale}
                  onChange={(e) => handleDeepUpdate('branding', 'watermark', 'grayscale', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Converter para Monocromático (Escala de Cinza)</span>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Heading className="w-4 h-4" /> Estilo do Título
        </h3>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Tamanho (pt)</label>
              <input type="range" min="10" max="72" value={docConfig.titleStyle?.size || 32} onChange={(e) => handleDeepUpdate('document', 'titleStyle', 'size', Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
              <div className="text-right text-xs text-slate-400 mt-1 font-bold">{docConfig.titleStyle?.size || 32}pt</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Cor do Título</label>
              <div className="flex items-center gap-2">
                <input type="color" value={docConfig.titleStyle?.color || branding.primaryColor} onChange={(e) => handleDeepUpdate('document', 'titleStyle', 'color', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
                <span className="text-xs font-mono text-slate-500">{docConfig.titleStyle?.color}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
