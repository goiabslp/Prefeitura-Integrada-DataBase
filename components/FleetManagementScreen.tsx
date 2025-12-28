
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Vehicle, VehicleType, Sector, VehicleStatus, MaintenanceStatus, Person, Job, VehicleBrand } from '../types';
import { 
  Plus, Search, Edit2, Trash2, Save, X, 
  Car, Truck, Wrench, CheckCircle2, Trash, Info, 
  MapPin, Hash, Palette, Calendar, Layers, Network, ChevronDown, Check,
  PenTool, Upload, FileText, Eye, Download, FileCheck, Camera, Image as ImageIcon,
  ArrowLeft, Fuel, Gauge, ShieldCheck, Activity, AlertTriangle, Hammer, ClipboardCheck,
  ShieldAlert, User, Briefcase, Tag, Flame
} from 'lucide-react';

interface FleetManagementScreenProps {
  vehicles: Vehicle[];
  sectors: Sector[];
  persons: Person[];
  jobs: Job[];
  brands: VehicleBrand[];
  onAddVehicle: (v: Vehicle) => void;
  onUpdateVehicle: (v: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onAddBrand: (b: VehicleBrand) => void;
  onBack: () => void;
}

const Gavel = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14.5 12.5-8 8a2.11 2.11 0 1 1-3-3l8-8"/><path d="m16 16 2 2"/><path d="m19 13 2 2"/><path d="m5 5 2 2"/><path d="m2 8 2 2"/><path d="m15 7 3 3-4 4-3-3z"/></svg>
);

const FileSearch = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v3"/><path d="M14 2v6h6"/><circle cx="5" cy="12" r="3"/><path d="m9 16-1.5-1.5"/></svg>
);

const STATUS_OPTIONS: { value: VehicleStatus, label: string, color: string, icon: any }[] = [
  { value: 'operacional', label: 'Operacional', color: 'emerald', icon: CheckCircle2 },
  { value: 'manutencao', label: 'Em Manutenção', color: 'amber', icon: Hammer },
  { value: 'vistoria', label: 'Em Vistoria', color: 'blue', icon: FileSearch },
  { value: 'documentacao', label: 'Aguardando Documentação', color: 'slate', icon: FileText },
  { value: 'nao_liberado', label: 'Não Liberado', color: 'rose', icon: ShieldAlert },
  { value: 'leilao', label: 'Em Leilão', color: 'indigo', icon: Gavel },
  { value: 'leiloado', label: 'Leiloado', color: 'purple', icon: ClipboardCheck },
  { value: 'batido', label: 'Batido', color: 'red', icon: AlertTriangle },
];

const MAINTENANCE_OPTIONS: { value: MaintenanceStatus, label: string, color: string }[] = [
  { value: 'em_dia', label: 'Em Dia', color: 'emerald' },
  { value: 'andamento', label: 'Em andamento', color: 'amber' },
  { value: 'vencido', label: 'Vencido', color: 'rose' },
];

const FUEL_OPTIONS = ['ALCOOL', 'GASOLINA', 'DIESEL'] as const;

export const FleetManagementScreen: React.FC<FleetManagementScreenProps> = ({
  vehicles, sectors, persons, jobs, brands, onAddVehicle, onUpdateVehicle, onDeleteVehicle, onAddBrand, onBack
}) => {
  const [activeTab, setActiveTab] = useState<VehicleType>('leve');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [viewingDocumentUrl, setViewingDocumentUrl] = useState<{url: string, name: string, type: 'doc' | 'photo'} | null>(null);
  
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
  const [isResponsibleDropdownOpen, setIsResponsibleDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isMaintDropdownOpen, setIsMaintDropdownOpen] = useState(false);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);

  const [sectorSearch, setSectorSearch] = useState('');
  const [responsibleSearch, setResponsibleSearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  
  const sectorDropdownRef = useRef<HTMLDivElement>(null);
  const responsibleDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const maintDropdownRef = useRef<HTMLDivElement>(null);
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({
    isOpen: false, title: '', message: '', onConfirm: () => {}
  });

  const [formData, setFormData] = useState<Partial<Vehicle>>({
    model: '',
    plate: '',
    brand: '',
    year: '',
    color: '',
    renavam: '',
    chassis: '',
    sectorId: '',
    responsiblePersonId: '',
    documentUrl: '',
    documentName: '',
    vehicleImageUrl: '',
    status: 'operacional',
    maintenanceStatus: 'em_dia',
    fuelTypes: []
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (sectorDropdownRef.current && !sectorDropdownRef.current.contains(target)) setIsSectorDropdownOpen(false);
      if (responsibleDropdownRef.current && !responsibleDropdownRef.current.contains(target)) setIsResponsibleDropdownOpen(false);
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(target)) setIsStatusDropdownOpen(false);
      if (maintDropdownRef.current && !maintDropdownRef.current.contains(target)) setIsMaintDropdownOpen(false);
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(target)) setIsBrandDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenModal = (v?: Vehicle) => {
    if (v) {
      setEditingVehicle(v);
      setFormData({ ...v, fuelTypes: v.fuelTypes || [] });
    } else {
      setEditingVehicle(null);
      setFormData({ 
        type: activeTab,
        model: '', 
        plate: '', 
        brand: '', 
        year: '', 
        color: '', 
        renavam: '', 
        chassis: '', 
        sectorId: '',
        responsiblePersonId: '',
        documentUrl: '',
        documentName: '',
        vehicleImageUrl: '',
        status: 'operacional',
        maintenanceStatus: 'em_dia',
        fuelTypes: []
      });
    }
    setSectorSearch('');
    setResponsibleSearch('');
    setBrandSearch('');
    setIsSectorDropdownOpen(false);
    setIsResponsibleDropdownOpen(false);
    setIsStatusDropdownOpen(false);
    setIsMaintDropdownOpen(false);
    setIsBrandDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          documentUrl: reader.result as string,
          documentName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          vehicleImageUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBrand = () => {
    if (!newBrandName.trim()) return;
    const brand: VehicleBrand = {
      id: `br-${Date.now()}-${Math.random()}`,
      name: newBrandName.trim().toUpperCase(),
      category: activeTab
    };
    onAddBrand(brand);
    setNewBrandName('');
    setIsBrandModalOpen(false);
  };

  const toggleFuel = (fuel: string) => {
    setFormData(prev => {
      const current = prev.fuelTypes || [];
      if (current.includes(fuel)) {
        return { ...prev, fuelTypes: current.filter(f => f !== fuel) };
      } else {
        return { ...prev, fuelTypes: [...current, fuel] };
      }
    });
  };

  const handleSave = () => {
    if (!formData.model || !formData.plate || !formData.sectorId) {
      alert("Por favor, preencha o modelo, a placa e o setor do veículo.");
      return;
    }

    const vehicleData = {
      ...formData,
      id: editingVehicle ? editingVehicle.id : Date.now().toString(),
      type: formData.type || activeTab
    } as Vehicle;

    editingVehicle ? onUpdateVehicle(vehicleData) : onAddVehicle(vehicleData);
    setIsModalOpen(false);
  };

  const filteredVehicles = vehicles.filter(v => 
    v.type === activeTab && (
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredSectors = useMemo(() => {
    return sectors
      .filter(s => s.name.toLowerCase().includes(sectorSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sectors, sectorSearch]);

  const filteredPersons = useMemo(() => {
    return persons
      .filter(p => p.name.toLowerCase().includes(responsibleSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [persons, responsibleSearch]);

  const filteredBrands = useMemo(() => {
    return brands
      .filter(b => b.category === activeTab && b.name.toLowerCase().includes(brandSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [brands, activeTab, brandSearch]);

  const selectedSectorName = sectors.find(s => s.id === formData.sectorId)?.name || 'Selecione o Setor';
  const selectedResponsibleName = persons.find(p => p.id === formData.responsiblePersonId)?.name || 'Selecione o Responsável';

  const inputClass = "w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all text-sm font-bold placeholder:text-slate-400 placeholder:font-normal";
  const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1";

  const getStatusConfig = (status: VehicleStatus) => {
    return STATUS_OPTIONS.find(opt => opt.value === status) || STATUS_OPTIONS[0];
  };

  const getMaintConfig = (maint: MaintenanceStatus) => {
    return MAINTENANCE_OPTIONS.find(opt => opt.value === maint) || MAINTENANCE_OPTIONS[0];
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-100 flex flex-col animate-fade-in overflow-hidden">
      {/* Header Full-Width */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all active:scale-90"
            title="Voltar ao Painel Administrativo"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Truck className="w-6 h-6 text-indigo-600" />
              Gestão de Frotas
            </h2>
            <p className="text-xs text-slate-500 font-medium">Controle patrimonial de veículos e equipamentos municipais.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 uppercase text-[10px] tracking-[0.2em]"
          >
            <Plus className="w-4 h-4" />
            Novo Registro
          </button>
        </div>
      </div>

      {/* Área de Filtros e Categorias */}
      <div className="bg-white/50 backdrop-blur-md px-6 py-4 border-b border-slate-200 shrink-0 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit gap-1">
          {[
            { id: 'leve', label: 'Leves', icon: Car },
            { id: 'pesado', label: 'Pesados', icon: Truck },
            { id: 'acessorio', label: 'Acessórios', icon: Wrench },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as VehicleType); setSearchTerm(''); }}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-96 group">
            <input 
              type="text" 
              placeholder="Placa, Modelo ou Marca..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Conteúdo de Grade 100% */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1920px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredVehicles.map(v => {
              const statusCfg = getStatusConfig(v.status || 'operacional');
              const responsibleName = persons.find(p => p.id === v.responsiblePersonId)?.name || 'Responsável não definido';
              return (
                <div key={v.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all flex flex-col group overflow-hidden animate-fade-in">
                    <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                      {v.vehicleImageUrl ? (
                        <img src={v.vehicleImageUrl} alt={v.model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                            {v.type === 'leve' ? <Car className="w-16 h-16 mb-2" /> : v.type === 'pesado' ? <Truck className="w-16 h-16 mb-2" /> : <Wrench className="w-16 h-16 mb-2" />}
                            <span className="text-[10px] font-black uppercase tracking-widest">Sem Foto</span>
                        </div>
                      )}
                      
                      <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border backdrop-blur-md bg-white/90 text-${statusCfg.color}-700 border-${statusCfg.color}-200 shadow-lg`}>
                        <statusCfg.icon className="w-3 h-3" />
                        {statusCfg.label}
                      </div>

                      <div className="absolute top-4 right-4 flex items-center gap-2">
                          <button 
                            onClick={() => handleOpenModal(v)} 
                            className="p-2.5 bg-white/90 backdrop-blur-sm text-slate-600 hover:text-indigo-600 rounded-xl shadow-lg transition-all active:scale-90"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                      </div>
                      
                      {v.documentUrl && (
                          <button 
                            onClick={() => setViewingDocumentUrl({url: v.documentUrl!, name: v.documentName || 'documento', type: 'doc'})}
                            className="absolute bottom-4 right-4 p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg transition-all active:scale-90 hover:bg-emerald-500"
                            title="Ver Documento"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                      )}
                      
                      {v.vehicleImageUrl && (
                          <button 
                            onClick={() => setViewingDocumentUrl({url: v.vehicleImageUrl!, name: v.model, type: 'photo'})}
                            className="absolute bottom-4 left-4 p-2.5 bg-indigo-600/90 backdrop-blur-sm text-white rounded-xl shadow-lg transition-all active:scale-90 hover:bg-indigo-500"
                            title="Ampliar Foto"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                      )}
                    </div>

                    <div className="p-6 flex flex-col gap-4">
                      <div className="min-w-0">
                        <h3 className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tight truncate">{v.model}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-slate-900 text-white font-mono text-[9px] px-2 py-0.5 rounded border border-white/10 shadow-sm tracking-[0.15em] shrink-0">{v.plate}</span>
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest truncate">{v.brand} • {v.year}</span>
                        </div>
                        {v.fuelTypes && v.fuelTypes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {v.fuelTypes.map(f => (
                              <span key={f} className="text-[8px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-tighter">{f}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-50 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                              <Network className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider leading-tight">
                              {sectors.find(s => s.id === v.sectorId)?.name || 'Sem Setor'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-tight truncate">
                              {responsibleName}
                            </span>
                        </div>
                      </div>
                      
                      <button 
                          onClick={() => setConfirmModal({
                            isOpen: true,
                            title: "Remover Registro",
                            message: `Deseja realmente excluir o veículo ${v.model} (${v.plate})?`,
                            onConfirm: () => { onDeleteVehicle(v.id); setConfirmModal({ ...confirmModal, isOpen: false }); }
                          })} 
                          className="mt-2 w-full py-2 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                          <Trash2 className="w-3 h-3" /> Excluir
                      </button>
                    </div>
                </div>
              );
            })}
          </div>

          {filteredVehicles.length === 0 && (
            <div className="py-32 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-slate-200">
                <Truck className="w-10 h-10" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900 tracking-tight uppercase">Nenhum registro localizado</p>
                <p className="text-sm text-slate-400 font-medium">Refine sua busca ou adicione um novo item.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {isModalOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fade-in">
            <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] w-full max-w-6xl overflow-hidden flex flex-col animate-slide-up max-h-[95vh] border border-white/20">
              
              <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 rotate-[-4deg]">
                    {activeTab === 'leve' ? <Car className="w-8 h-8" /> : activeTab === 'pesado' ? <Truck className="w-8 h-8" /> : <Wrench className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">
                      {editingVehicle ? 'Perfil do Veículo' : 'Cadastro de Veículo'}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.1em] mt-1.5 flex items-center gap-2">
                       <Activity className="w-3 h-3 text-indigo-500" /> Detalhamento Técnico e Patrimonial
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 hover:bg-rose-50 rounded-2xl text-slate-400 hover:text-rose-600 transition-all active:scale-90 border border-slate-100"><X className="w-7 h-7" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                 <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
                    
                    <div className="lg:col-span-5 p-10 border-r border-slate-100 bg-white flex flex-col gap-8">
                       <div className="space-y-4">
                          <label className={labelClass}><Camera className="w-3.5 h-3.5 inline mr-2" /> Fotografia do Veículo</label>
                          <div 
                            onClick={() => photoInputRef.current?.click()}
                            className={`relative aspect-[4/3] rounded-[3rem] border-4 border-dashed transition-all cursor-pointer group flex flex-col items-center justify-center overflow-hidden shadow-inner
                              ${formData.vehicleImageUrl ? 'border-indigo-600 bg-indigo-50/5' : 'border-slate-100 bg-slate-50 hover:border-indigo-400 hover:bg-white'}
                            `}
                          >
                             <input type="file" ref={photoInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                             {formData.vehicleImageUrl ? (
                               <>
                                 <img src={formData.vehicleImageUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                 <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                                    <div className="bg-white p-4 rounded-full text-indigo-600 shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500"><Upload className="w-8 h-8" /></div>
                                    <span className="text-white text-xs font-black uppercase tracking-[0.2em] bg-indigo-600 px-5 py-2 rounded-full shadow-xl">Alterar Fotografia</span>
                                 </div>
                               </>
                             ) : (
                               <div className="flex flex-col items-center gap-4 text-slate-300 group-hover:text-indigo-400 transition-all">
                                  <div className="p-10 bg-white rounded-[2.5rem] shadow-xl group-hover:shadow-indigo-500/10 border border-slate-100 transition-all group-hover:scale-110"><ImageIcon className="w-16 h-16" /></div>
                                  <div className="text-center">
                                     <p className="text-xs font-black uppercase tracking-[0.3em]">Carregar Imagem</p>
                                     <p className="text-[10px] font-bold mt-1 opacity-50">Resolução recomendada: 1200x900px</p>
                                  </div>
                               </div>
                             )}
                          </div>
                       </div>

                       <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 space-y-8">
                          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                             <Activity className="w-4 h-4" /> Indicadores Operacionais
                          </h4>
                          
                          <div className="space-y-6">
                            <div className="relative" ref={statusDropdownRef}>
                               <label className={labelClass}>Status de Disponibilidade</label>
                               <button 
                                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                  className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-indigo-400 transition-all group/sel"
                               >
                                  <div className="flex items-center gap-3">
                                     <div className={`p-2 rounded-xl bg-${getStatusConfig(formData.status || 'operacional').color}-600 text-white shadow-md`}>
                                        {React.createElement(getStatusConfig(formData.status || 'operacional').icon, { className: "w-4 h-4" })}
                                     </div>
                                     <span className="text-sm font-bold text-slate-900">{getStatusConfig(formData.status || 'operacional').label}</span>
                                  </div>
                                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                               </button>

                               {isStatusDropdownOpen && (
                                  <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up py-2 max-h-72 overflow-y-auto custom-scrollbar">
                                     {STATUS_OPTIONS.map((opt) => (
                                        <button
                                           key={opt.value}
                                           onClick={() => {
                                              setFormData({...formData, status: opt.value});
                                              setIsStatusDropdownOpen(false);
                                           }}
                                           className={`w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors group ${formData.status === opt.value ? 'bg-indigo-50/50' : ''}`}
                                        >
                                           <div className="flex items-center gap-3">
                                              <div className={`p-2 rounded-lg bg-${opt.color}-100 text-${opt.color}-600 group-hover:bg-${opt.color}-600 group-hover:text-white transition-all`}>
                                                 <opt.icon className="w-4 h-4" />
                                              </div>
                                              <span className={`text-xs font-bold ${formData.status === opt.value ? 'text-indigo-900' : 'text-slate-700'}`}>{opt.label}</span>
                                           </div>
                                           {formData.status === opt.value && <Check className="w-4 h-4 text-indigo-600" />}
                                        </button>
                                     ))}
                                  </div>
                               )}
                            </div>

                            <div className="relative" ref={maintDropdownRef}>
                               <label className={labelClass}>Condição de Manutenção</label>
                               <button 
                                  onClick={() => setIsMaintDropdownOpen(!isMaintDropdownOpen)}
                                  className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-indigo-400 transition-all group/sel"
                               >
                                  <div className="flex items-center gap-3">
                                     <div className={`p-2 rounded-xl bg-${getMaintConfig(formData.maintenanceStatus || 'em_dia').color}-600 text-white shadow-md`}>
                                        <Gauge className="w-4 h-4" />
                                     </div>
                                     <span className="text-sm font-bold text-slate-900">{getMaintConfig(formData.maintenanceStatus || 'em_dia').label}</span>
                                  </div>
                                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isMaintDropdownOpen ? 'rotate-180' : ''}`} />
                               </button>

                               {isMaintDropdownOpen && (
                                  <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up py-2">
                                     {MAINTENANCE_OPTIONS.map((opt) => (
                                        <button
                                           key={opt.value}
                                           onClick={() => {
                                              setFormData({...formData, maintenanceStatus: opt.value});
                                              setIsMaintDropdownOpen(false);
                                           }}
                                           className={`w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors group ${formData.maintenanceStatus === opt.value ? 'bg-indigo-50/50' : ''}`}
                                        >
                                           <div className="flex items-center gap-3">
                                              <div className={`p-2 rounded-lg bg-${opt.color}-100 text-${opt.color}-600 group-hover:bg-${opt.color}-600 group-hover:text-white transition-all`}>
                                                 <Gauge className="w-4 h-4" />
                                              </div>
                                              <span className={`text-xs font-bold ${formData.maintenanceStatus === opt.value ? 'text-indigo-900' : 'text-slate-700'}`}>{opt.label}</span>
                                           </div>
                                           {formData.maintenanceStatus === opt.value && <Check className="w-4 h-4 text-indigo-600" />}
                                        </button>
                                     ))}
                                  </div>
                               )}
                            </div>
                          </div>
                       </div>
                    </div>

                    <div className="lg:col-span-7 p-10 space-y-10">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                          <div className="md:col-span-2">
                            <label className={labelClass}><Layers className="w-4 h-4 inline mr-2 text-indigo-500" /> Identificação do Modelo</label>
                            <input value={formData.model} onChange={e => setFormData({...formData, model: e.target.value.toUpperCase()})} className={inputClass} placeholder="Ex: CRONOS" />
                          </div>
                          
                          <div>
                            <label className={labelClass}><Hash className="w-4 h-4 inline mr-2 text-indigo-500" /> Placa de Identificação</label>
                            <input value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})} className={`${inputClass} font-mono uppercase tracking-[0.1em]`} placeholder="ABC-1234" />
                          </div>

                          <div className="relative" ref={brandDropdownRef}>
                            <label className={labelClass}><Tag className="w-4 h-4 inline mr-2 text-indigo-500" /> Marca / Fabricante</label>
                            <div 
                              onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                              className={`${inputClass} flex items-center justify-between cursor-pointer group/select h-auto ${isBrandDropdownOpen ? 'border-indigo-500 ring-4 ring-indigo-500/5 bg-white' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl transition-colors shrink-0 ${formData.brand ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                  <Tag className="w-4 h-4" />
                                </div>
                                <span className={`${formData.brand ? 'text-slate-900 font-bold' : 'text-slate-400'} leading-tight text-left`}>
                                  {formData.brand || 'Selecione a Marca'}
                                </span>
                              </div>
                              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${isBrandDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {isBrandDropdownOpen && (
                              <div className="absolute z-50 left-0 right-0 mt-3 bg-white border border-slate-200 rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden animate-slide-up flex flex-col border-indigo-100">
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                                  <Search className="w-4 h-4 text-indigo-400" />
                                  <input 
                                    type="text"
                                    autoFocus
                                    placeholder="Pesquisar fabricante..."
                                    className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 w-full"
                                    value={brandSearch}
                                    onChange={(e) => setBrandSearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                                   {filteredBrands.length > 0 ? (
                                     filteredBrands.map((brand) => (
                                       <button
                                         key={brand.id}
                                         type="button"
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           setFormData({...formData, brand: brand.name});
                                           setIsBrandDropdownOpen(false);
                                           setBrandSearch('');
                                         }}
                                         className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group/item ${formData.brand === brand.name ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                                       >
                                         <span className="text-sm font-bold text-left">{brand.name}</span>
                                         {formData.brand === brand.name && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                                       </button>
                                     ))
                                   ) : (
                                     <div className="p-8 text-center">
                                       <Tag className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                       <p className="text-xs text-slate-400 font-medium">Nenhuma marca localizada.</p>
                                       <button 
                                         onClick={(e) => { e.stopPropagation(); setIsBrandModalOpen(true); setIsBrandDropdownOpen(false); }}
                                         className="mt-4 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline"
                                       >
                                         + Adicionar Nova
                                       </button>
                                     </div>
                                   )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className={labelClass}><Calendar className="w-4 h-4 inline mr-2 text-indigo-500" /> Ano Fabricação/Modelo</label>
                            <input value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className={inputClass} placeholder="2023/2024" />
                          </div>

                          <div>
                            <label className={labelClass}><Palette className="w-4 h-4 inline mr-2 text-indigo-500" /> Cor Predominante</label>
                            <input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value.toUpperCase()})} className={inputClass} placeholder="Ex: BRANCA" />
                          </div>
                          
                          {/* CAMPO DE COMBUSTÍVEL - MULTISELEÇÃO MODERNA */}
                          <div className="md:col-span-2">
                            <label className={labelClass}><Flame className="w-4 h-4 inline mr-2 text-indigo-500" /> Combustível (Multiseleção)</label>
                            <div className="flex flex-wrap gap-2 p-4 bg-slate-50/50 border border-slate-200 rounded-[2rem]">
                              {FUEL_OPTIONS.map(fuel => {
                                const isSelected = formData.fuelTypes?.includes(fuel);
                                return (
                                  <button
                                    key={fuel}
                                    type="button"
                                    onClick={() => toggleFuel(fuel)}
                                    className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 active:scale-95
                                      ${isSelected 
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'}
                                    `}
                                  >
                                    {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Flame className="w-3.5 h-3.5 opacity-40" />}
                                    {fuel}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="md:col-span-2 relative" ref={sectorDropdownRef}>
                            <label className={labelClass}><Network className="w-4 h-4 inline mr-2 text-indigo-500" /> Setor de Lotação / Atribuição</label>
                            <div 
                              onClick={() => setIsSectorDropdownOpen(!isSectorDropdownOpen)}
                              className={`${inputClass} flex items-center justify-between cursor-pointer group/select h-auto ${isSectorDropdownOpen ? 'border-indigo-500 ring-4 ring-indigo-500/5 bg-white' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl transition-colors shrink-0 ${formData.sectorId ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                  <Network className="w-4 h-4" />
                                </div>
                                <span className={`${formData.sectorId ? 'text-slate-900 font-bold' : 'text-slate-400'} leading-tight text-left`}>
                                  {selectedSectorName}
                                </span>
                              </div>
                              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${isSectorDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {isSectorDropdownOpen && (
                              <div className="absolute z-50 left-0 right-0 mt-3 bg-white border border-slate-200 rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden animate-slide-up flex flex-col border-indigo-100">
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                                  <Search className="w-4 h-4 text-indigo-400" />
                                  <input 
                                    type="text"
                                    autoFocus
                                    placeholder="Pesquisar setor..."
                                    className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 w-full"
                                    value={sectorSearch}
                                    onChange={(e) => setSectorSearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                                   {filteredSectors.map((sector) => (
                                     <button
                                       key={sector.id}
                                       type="button"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         setFormData({...formData, sectorId: sector.id});
                                         setIsSectorDropdownOpen(false);
                                         setSectorSearch('');
                                       }}
                                       className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group/item ${formData.sectorId === sector.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                                     >
                                       <span className="text-sm font-bold text-left">{sector.name}</span>
                                       {formData.sectorId === sector.id && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                                     </button>
                                   ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="md:col-span-2 relative" ref={responsibleDropdownRef}>
                            <label className={labelClass}><User className="w-4 h-4 inline mr-2 text-indigo-500" /> Responsável pelo Veículo</label>
                            <div 
                              onClick={() => setIsResponsibleDropdownOpen(!isResponsibleDropdownOpen)}
                              className={`${inputClass} flex items-center justify-between cursor-pointer group/select h-auto ${isResponsibleDropdownOpen ? 'border-indigo-500 ring-4 ring-indigo-500/5 bg-white' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl transition-colors shrink-0 ${formData.responsiblePersonId ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                  <User className="w-4 h-4" />
                                </div>
                                <span className={`${formData.responsiblePersonId ? 'text-slate-900 font-bold' : 'text-slate-400'} leading-tight text-left`}>
                                  {selectedResponsibleName}
                                </span>
                              </div>
                              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${isResponsibleDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {isResponsibleDropdownOpen && (
                              <div className="absolute z-50 left-0 right-0 mt-3 bg-white border border-slate-200 rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden animate-slide-up flex flex-col border-indigo-100">
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                                  <Search className="w-4 h-4 text-indigo-400" />
                                  <input 
                                    type="text"
                                    autoFocus
                                    placeholder="Pesquisar responsável..."
                                    className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 w-full"
                                    value={responsibleSearch}
                                    onChange={(e) => setResponsibleSearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                                   <button
                                     type="button"
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setFormData({...formData, responsiblePersonId: ''});
                                       setIsResponsibleDropdownOpen(false);
                                     }}
                                     className="w-full flex items-center p-4 rounded-2xl text-slate-400 hover:bg-slate-50 italic text-sm"
                                   >
                                     Remover Responsável
                                   </button>
                                   {filteredPersons.map((person) => (
                                     <button
                                       key={person.id}
                                       type="button"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         setFormData({...formData, responsiblePersonId: person.id});
                                         setIsResponsibleDropdownOpen(false);
                                         setResponsibleSearch('');
                                       }}
                                       className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group/item ${formData.responsiblePersonId === person.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                                     >
                                       <div className="text-left">
                                         <span className="text-sm font-bold block">{person.name}</span>
                                         <span className="text-[10px] uppercase font-medium text-slate-400">
                                           {jobs.find(j => j.id === person.jobId)?.name || 'Sem Cargo'}
                                         </span>
                                       </div>
                                       {formData.responsiblePersonId === person.id && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                                     </button>
                                   ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className={labelClass}><Fuel className="w-4 h-4 inline mr-2 text-indigo-500" /> Código Renavam</label>
                            <input value={formData.renavam} onChange={e => setFormData({...formData, renavam: e.target.value})} className={`${inputClass} font-mono`} placeholder="01332550344" />
                          </div>
                          <div>
                            <label className={labelClass}><ShieldCheck className="w-4 h-4 inline mr-2 text-indigo-500" /> Número do Chassi (VIN)</label>
                            <input value={formData.chassis} onChange={e => setFormData({...formData, chassis: e.target.value.toUpperCase()})} className={`${inputClass} font-mono uppercase`} placeholder="8AP..." />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="px-10 py-8 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
                 <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 font-black text-slate-400 hover:text-rose-600 transition-all uppercase text-[11px] tracking-[0.3em]">Descartar Alterações</button>
                 <button onClick={handleSave} className="px-12 py-5 bg-slate-900 text-white font-black rounded-3xl hover:bg-indigo-600 shadow-2xl flex items-center gap-4 transition-all uppercase text-[11px] tracking-[0.3em] active:scale-95">
                    <Save className="w-5 h-5" /> Salvar Registro Patrimonial
                 </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL PARA ADICIONAR NOVA MARCA */}
      {isBrandModalOpen && createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
              <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up border border-white/20">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                          <Tag className="w-5 h-5 text-white" />
                       </div>
                       <div>
                          <h3 className="text-base font-black text-slate-900 tracking-tight uppercase leading-none">Nova Marca</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Categoria: {activeTab === 'leve' ? 'Leves' : activeTab === 'pesado' ? 'Pesados' : 'Acessórios'}</p>
                       </div>
                    </div>
                    <button onClick={() => setIsBrandModalOpen(false)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 transition-all"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="p-8">
                     <label className={labelClass}>Nome do Fabricante / Marca</label>
                     <input 
                       autoFocus
                       value={newBrandName}
                       onChange={e => setNewBrandName(e.target.value)}
                       className={inputClass}
                       placeholder="Digite o nome da marca..."
                       onKeyDown={e => e.key === 'Enter' && handleSaveBrand()}
                     />
                  </div>
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                     <button onClick={() => setIsBrandModalOpen(false)} className="flex-1 py-4 bg-white text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">Cancelar</button>
                     <button 
                       onClick={handleSaveBrand}
                       disabled={!newBrandName.trim()}
                       className="flex-2 px-8 py-4 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                     >
                       Salvar Marca
                     </button>
                  </div>
              </div>
          </div>,
          document.body
      )}

      {/* MODAL DE VISUALIZAÇÃO */}
      {viewingDocumentUrl && createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl animate-fade-in">
             <div className={`w-full flex flex-col bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-scale-in ${viewingDocumentUrl.type === 'photo' ? 'max-w-4xl h-fit' : 'h-full max-w-6xl'}`}>
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                   <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl text-white flex items-center justify-center shadow-xl ${viewingDocumentUrl.type === 'photo' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                         {viewingDocumentUrl.type === 'photo' ? <ImageIcon className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                            {viewingDocumentUrl.type === 'photo' ? 'Visualização da Foto' : 'Visualização de Documento'}
                         </h3>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{viewingDocumentUrl.name}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <a href={viewingDocumentUrl.url} download={viewingDocumentUrl.name} className="p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"><Download className="w-7 h-7" /></a>
                      <button onClick={() => setViewingDocumentUrl(null)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-rose-600 transition-all active:scale-95 shadow-lg"><X className="w-7 h-7" /></button>
                   </div>
                </div>
                <div className={`overflow-auto flex items-center justify-center p-12 bg-slate-100/50 ${viewingDocumentUrl.type === 'photo' ? 'max-h-[70vh]' : 'flex-1'}`}>
                   {viewingDocumentUrl.url.startsWith('data:application/pdf') ? (
                     <iframe src={viewingDocumentUrl.url} className="w-full h-full rounded-[2.5rem] border-8 border-white shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] min-h-[60vh]" />
                   ) : (
                     <img src={viewingDocumentUrl.url} alt="Visualização" className="max-w-full max-h-full object-contain rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] border-8 border-white" />
                   )}
                </div>
                <div className="p-8 bg-white border-t border-slate-100 text-center shrink-0">
                   <button onClick={() => setViewingDocumentUrl(null)} className="px-16 py-5 bg-slate-900 text-white font-black uppercase text-xs tracking-[0.3em] rounded-3xl transition-all shadow-2xl active:scale-95">Fechar Visualização</button>
                </div>
             </div>
          </div>,
          document.body
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {confirmModal.isOpen && createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
              <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up border border-white/20">
                  <div className="p-12 text-center">
                      <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-rose-500/10 rotate-3"><Trash className="w-12 h-12" /></div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase">Excluir Item?</h3>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">{confirmModal.message}</p>
                  </div>
                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
                      <button onClick={confirmModal.onConfirm} className="w-full py-5 bg-rose-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] shadow-2xl shadow-rose-600/20 hover:bg-rose-700 transition-all active:scale-95">Sim, Remover Registro</button>
                      <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="w-full py-5 bg-white text-slate-400 font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] border border-slate-200 hover:bg-white hover:text-slate-600 transition-all shadow-sm">Voltar / Cancelar</button>
                  </div>
              </div>
          </div>,
          document.body
      )}
    </div>
  );
};
