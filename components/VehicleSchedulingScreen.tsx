import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Vehicle, Person, VehicleSchedule, ScheduleStatus, Sector } from '../types';
import {
  ArrowLeft, Plus, Search, Calendar, Clock, MapPin,
  User as UserIcon, Car, Info, Trash2, Edit3, CheckCircle2,
  X, ChevronDown, Check, LayoutGrid, List, Filter, History,
  AlertCircle, Navigation, ClipboardList, Timer, Loader2, Save,
  ChevronLeft, ChevronRight, Gift, Flag, AlertTriangle, ArrowRight,
  ArrowDown, TrendingUp, CalendarDays, Lock, Eye, FileText, Network,
  UserCheck, ShieldCheck, XCircle, ChevronRight as ChevronRightIcon,
  PackageCheck, Sparkles, Truck, CheckCircle, Activity, Flame,
  Building2, ArrowRightLeft, UserCircle, Landmark
} from 'lucide-react';
import { VehicleScheduleHistory } from './VehicleScheduleHistory';
import { VehicleScheduleApprovals } from './VehicleScheduleApprovals';

interface VehicleSchedulingScreenProps {
  schedules: VehicleSchedule[];
  vehicles: Vehicle[];
  persons: Person[];
  sectors: Sector[];
  onAddSchedule: (s: VehicleSchedule) => void;
  onUpdateSchedule: (s: VehicleSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  onBack: () => void;
  currentUserId: string;
}

const STATUS_MAP: Record<ScheduleStatus, { label: string, color: string, icon: any }> = {
  pendente: { label: 'Aguardando', color: 'amber', icon: Timer },
  confirmado: { label: 'Confirmado', color: 'emerald', icon: CheckCircle2 },
  em_curso: { label: 'Em Curso', color: 'blue', icon: Navigation },
  concluido: { label: 'Concluído', color: 'slate', icon: ClipboardList },
  cancelado: { label: 'Rejeitado/Cancelado', color: 'rose', icon: X },
};

const HOLIDAYS: Record<string, string> = {
  '01-01': 'Confraternização Universal',
  '21-04': 'Tiradentes',
  '01-05': 'Dia do Trabalho',
  '07-09': 'Independência do Brasil',
  '12-10': 'Nossa Sra. Aparecida',
  '02-11': 'Finados',
  '15-11': 'Proclamação da República',
  '20-11': 'Dia da Consciência Negra',
  '25-12': 'Natal',
};

const COMMON_CITIES = [
  'SÃO JOSÉ DO GOIABAL - MG', 'JOÃO MONLEVADE - MG', 'BELO HORIZONTE - MG',
  'IPATINGA - MG', 'ITABIRA - MG', 'ALVINÓPOLIS - MG', 'RIO PIRACICABA - MG',
  'PONTE NOVA - MG', 'DOM SILVÉRIO - MG', 'DIONÍSIO - MG', 'SÃO DOMINGOS DO PRATA - MG'
];

export const VehicleSchedulingScreen: React.FC<VehicleSchedulingScreenProps> = ({
  schedules = [],
  vehicles = [],
  persons = [],
  sectors = [],
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onBack,
  currentUserId
}) => {
  const [activeSubView, setActiveSubView] = useState<'menu' | 'calendar' | 'history' | 'approvals'>('menu');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<VehicleSchedule | null>(null);
  const [viewingSchedule, setViewingSchedule] = useState<VehicleSchedule | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [isDriverDropdownOpen, setIsDriverDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
  const [isRequesterDropdownOpen, setIsRequesterDropdownOpen] = useState(false);

  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [sectorSearch, setSectorSearch] = useState('');
  const [requesterSearch, setRequesterSearch] = useState('');

  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'error' | 'success' | 'warning' }>({
    show: false, message: '', type: 'error'
  });

  const [formData, setFormData] = useState<Partial<VehicleSchedule>>({
    vehicleId: '', driverId: '', serviceSectorId: '', requesterPersonId: '',
    departureDateTime: '', returnDateTime: '', destination: '', purpose: '', status: 'pendente',
    vehicleLocation: ''
  });

  const refs = {
    vehicle: useRef<HTMLDivElement>(null),
    driver: useRef<HTMLDivElement>(null),
    city: useRef<HTMLDivElement>(null),
    sector: useRef<HTMLDivElement>(null),
    requester: useRef<HTMLDivElement>(null)
  };

  const showToast = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const isDateBeforeToday = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const getLocalISOString = (date: Date = new Date()) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (refs.vehicle.current && !refs.vehicle.current.contains(target)) setIsVehicleDropdownOpen(false);
      if (refs.driver.current && !refs.driver.current.contains(target)) setIsDriverDropdownOpen(false);
      if (refs.city.current && !refs.city.current.contains(target)) setIsCityDropdownOpen(false);
      if (refs.sector.current && !refs.sector.current.contains(target)) setIsSectorDropdownOpen(false);
      if (refs.requester.current && !refs.requester.current.contains(target)) setIsRequesterDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isVehicleAvailable = (vehicleId: string, start: string, end: string, excludeScheduleId?: string) => {
    if (!start || !end) return true;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();

    return !schedules.some(s => {
      if (s.id === excludeScheduleId) return false;
      if (s.vehicleId !== vehicleId) return false;
      if (s.status !== 'confirmado' && s.status !== 'em_curso') return false;

      const sStart = new Date(s.departureDateTime).getTime();
      const sEnd = new Date(s.returnDateTime).getTime();

      return (startTime < sEnd) && (endTime > sStart);
    });
  };

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) days.push({ day: prevMonthLast - i, month: month - 1, year, isCurrent: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, month, year, isCurrent: true });
    while (days.length < 42) days.push({ day: days.length - (daysInMonth + firstDay) + 1, month: month + 1, year, isCurrent: false });
    return days;
  }, [currentDate]);

  const handleOpenModal = (s?: VehicleSchedule, initialDate?: Date, initialVehicleId?: string) => {
    if (s) {
      setEditingSchedule(s);
      setFormData({ ...s });
    } else {
      setEditingSchedule(null);
      const now = new Date();
      let departure = initialDate ? new Date(initialDate) : now;
      if (departure < now) departure = now;
      if (!initialDate) departure.setMinutes(0, 0, 0);
      const returnDate = new Date(departure.getTime() + (4 * 60 * 60 * 1000));
      setFormData({
        vehicleId: initialVehicleId || '', driverId: '', serviceSectorId: '', requesterPersonId: '',
        departureDateTime: getLocalISOString(departure),
        returnDateTime: getLocalISOString(returnDate),
        destination: '', purpose: '', status: 'pendente',
        vehicleLocation: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.vehicleId || !formData.driverId || !formData.departureDateTime || !formData.returnDateTime || !formData.destination || !formData.requesterPersonId || !formData.serviceSectorId) {
      showToast("Preencha todos os campos obrigatórios.", "warning");
      return;
    }
    const now = Date.now();
    const depTime = new Date(formData.departureDateTime!).getTime();
    const retTime = new Date(formData.returnDateTime!).getTime();
    if (!editingSchedule && depTime < now - 60000) {
      showToast("Não é possível realizar novos agendamentos para datas ou horários que já passaram.", "error");
      return;
    }
    if (retTime <= depTime) {
      showToast("A data/hora de retorno deve ser posterior à de saída.", "warning");
      return;
    }
    if (formData.status === 'confirmado' && !isVehicleAvailable(formData.vehicleId, formData.departureDateTime!, formData.returnDateTime!, editingSchedule?.id)) {
      showToast("Este veículo já possui um agendamento CONFIRMADO neste período.", "error");
      return;
    }
    const data = {
      ...formData,
      id: editingSchedule ? editingSchedule.id : Date.now().toString(),
      requesterId: currentUserId,
      createdAt: editingSchedule ? editingSchedule.createdAt : new Date().toISOString()
    } as VehicleSchedule;
    editingSchedule ? onUpdateSchedule(data) : onAddSchedule(data);
    setIsModalOpen(false);
    showToast(editingSchedule ? "Agendamento atualizado!" : "Agendamento realizado com sucesso!", "success");
  };

  const pendingApprovals = schedules.filter(s => s.status === 'pendente').length;
  const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1";
  const inputClass = "w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-slate-400";

  const renderDashboard = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 overflow-y-auto">
      <div className="max-w-6xl w-full space-y-12 animate-fade-in">
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Gestão de Veículos</h1>
          <p className="text-slate-500 font-medium text-lg">Central de operações e controle de frota municipal.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <button onClick={() => setActiveSubView('calendar')} className="group relative p-8 bg-white rounded-[3rem] border border-slate-200 shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-400 transition-all duration-500 text-left flex flex-col justify-between overflow-hidden h-80 scale-100 hover:scale-[1.03]">
            <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-bl-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-125 opacity-10"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-xl mb-6 group-hover:rotate-6 transition-transform relative z-10"><Calendar className="w-8 h-8 text-white" /></div>
            <div className="relative z-10"><h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Agendar</h2><p className="text-slate-500 text-sm font-bold leading-relaxed opacity-80">Mapa de Disponibilidade e Agendamentos</p></div>
            <div className="mt-6 flex items-center justify-between text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] relative z-10"><span>Abrir Sistema</span><ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></div>
          </button>
          <button onClick={() => setActiveSubView('history')} className="group relative p-8 bg-white rounded-[3rem] border border-slate-200 shadow-2xl hover:shadow-slate-500/20 hover:border-slate-400 transition-all duration-500 text-left flex flex-col justify-between overflow-hidden h-80 scale-100 hover:scale-[1.03]">
            <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-slate-700 to-slate-900 rounded-bl-full -mr-12 -mt-12 opacity-10 group-hover:scale-125 transition-transform duration-700"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center shadow-xl mb-6 group-hover:rotate-6 transition-transform relative z-10"><History className="w-8 h-8 text-white" /></div>
            <div className="relative z-10"><h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Histórico de Agendamentos</h2><p className="text-slate-500 text-sm font-bold leading-relaxed opacity-80">Consulta de Registros e Saídas</p></div>
            <div className="mt-6 flex items-center justify-between text-slate-700 font-black text-[10px] uppercase tracking-[0.2em] relative z-10"><span>Ver Relatório</span><ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></div>
          </button>
          <button onClick={() => setActiveSubView('approvals')} className="group relative p-8 bg-white rounded-[3rem] border border-slate-200 shadow-2xl hover:shadow-emerald-500/20 hover:border-emerald-400 transition-all duration-500 text-left flex flex-col justify-between overflow-hidden h-80 scale-100 hover:scale-[1.03]">
            <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-bl-full -mr-12 -mt-12 opacity-10 group-hover:scale-125 transition-transform duration-700"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl flex items-center justify-center shadow-xl mb-6 group-hover:rotate-6 transition-transform relative z-10"><ShieldCheck className="w-8 h-8 text-white" />{pendingApprovals > 0 && (<span className="absolute -top-3 -right-3 w-8 h-8 bg-rose-600 text-white text-xs font-black flex items-center justify-center rounded-full border-4 border-white shadow-xl animate-bounce">{pendingApprovals}</span>)}</div>
            <div className="relative z-10"><h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight leading-tight">Aprovação</h2><p className="text-slate-500 text-sm font-bold leading-relaxed opacity-80">Fila de Triagem de Solicitações</p></div>
            <div className="mt-6 flex items-center justify-between text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] relative z-10"><span>Gerenciar</span><ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in h-full">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveSubView('menu')} className="p-2.5 bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all active:scale-90"><ArrowLeft className="w-5 h-5" /></button>
          <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
          <div><h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-600" />Mapa de Disponibilidade</h2></div>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-600 transition-all"><ChevronLeft className="w-5 h-5" /></button>
          <div className="px-6 text-sm font-black text-slate-900 uppercase tracking-widest min-w-[220px] text-center">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-600 transition-all"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentDate(new Date())} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">Hoje</button>
          <button onClick={() => handleOpenModal()} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 uppercase text-[10px] tracking-[0.2em]"><Plus className="w-4 h-4" />Novo Agendamento</button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 shrink-0">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => (
          <div key={d} className={`py-3 text-center text-[10px] font-black uppercase tracking-[0.3em] border-r border-slate-100 last:border-0 ${i === 0 || i === 6 ? 'text-orange-600' : 'text-slate-400'}`}>{d}</div>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-7 h-full w-full bg-slate-200 gap-px">
          {calendarData.map((cell, idx) => {
            if (!cell.isCurrent) return <div key={idx} className="bg-slate-50/10 min-h-0" />;
            const dayStart = new Date(cell.year, cell.month, cell.day, 0, 0, 0).getTime();
            const dayEnd = new Date(cell.year, cell.month, cell.day, 23, 59, 59).getTime();
            const dateObj = new Date(cell.year, cell.month, cell.day);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
            const dayKey = `${String(cell.day).padStart(2, '0')}-${String(cell.month + 1).padStart(2, '0')}`;
            const holidayName = HOLIDAYS[dayKey];
            const isHoliday = !!holidayName;
            const daySchedules = schedules.filter(s => {
              if (s.status === 'cancelado') return false;
              const dep = new Date(s.departureDateTime).getTime();
              const ret = new Date(s.returnDateTime).getTime();
              return (dep <= dayEnd) && (ret >= dayStart);
            });
            const isToday = new Date().getDate() === cell.day && new Date().getMonth() === cell.month && new Date().getFullYear() === cell.year;
            return (
              <div key={idx} className={`group relative min-h-0 flex flex-col p-3 transition-colors cursor-pointer ${isHoliday || isWeekend ? 'bg-orange-50/60 hover:bg-orange-100/40' : 'bg-white hover:bg-indigo-50/30'}`} onClick={() => setSelectedDay(new Date(cell.year, cell.month, cell.day))}>
                <div className="flex items-center justify-between mb-2"><span className={`text-xs font-black w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : isHoliday || isWeekend ? 'text-orange-700' : 'text-slate-900'}`}>{cell.day}</span>{isHoliday && <span title={holidayName} className="text-orange-400"><Gift className="w-3.5 h-3.5" /></span>}</div>
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-1 pb-2">
                  {daySchedules.slice(0, 3).map(s => {
                    const v = vehicles.find(veh => veh.id === s.vehicleId);
                    const cfg = STATUS_MAP[s.status];
                    return (
                      <div key={s.id} className={`w-full text-left p-1.5 rounded-lg border flex flex-col gap-0.5 shadow-sm transition-all bg-${cfg.color}-50 border-${cfg.color}-200 text-${cfg.color}-900`}>
                        <span className="text-[9px] font-black uppercase truncate leading-none">{v?.model || 'Veículo'}</span>
                        <span className="text-[7px] font-mono font-bold opacity-60 leading-none truncate">{new Date(s.departureDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    );
                  })}
                  {daySchedules.length > 3 && <div className="text-[8px] font-black text-slate-400 text-center uppercase tracking-widest">+ {daySchedules.length - 3} itens</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden font-sans h-full bg-slate-50">
      {activeSubView === 'menu' && renderDashboard()}
      {activeSubView === 'calendar' && renderCalendar()}
      {activeSubView === 'history' && (
        <VehicleScheduleHistory schedules={schedules} vehicles={vehicles} persons={persons} onViewDetails={(s) => { setViewingSchedule(s); setIsViewModalOpen(true); }} />
      )}
      {activeSubView === 'approvals' && (
        <VehicleScheduleApprovals schedules={schedules} vehicles={vehicles} persons={persons} sectors={sectors} onApprove={(s) => onUpdateSchedule({ ...s, status: 'confirmado' })} onReject={(s) => onUpdateSchedule({ ...s, status: 'cancelado' })} />
      )}
      {activeSubView !== 'menu' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[80]">
          <button onClick={() => setActiveSubView('menu')} className="px-8 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 hover:bg-indigo-600 transition-all active:scale-95"><ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard de Frota</button>
        </div>
      )}
      {selectedDay && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fade-in overflow-hidden">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col animate-slide-up h-[90vh] border border-white/20">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex flex-col items-center justify-center shadow-2xl"><span className="text-[10px] font-black uppercase leading-none mb-1 opacity-60">{selectedDay.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span><span className="text-2xl font-black leading-none">{selectedDay.getDate()}</span></div>
                <div><h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{selectedDay.toLocaleDateString('pt-BR', { weekday: 'long' })}</h3><p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">Monitoramento de Frota <ChevronRightIcon className="w-3 h-3" /> {selectedDay.toLocaleDateString('pt-BR')}</p></div>
              </div>
              <div className="flex items-center gap-3">
                {!isDateBeforeToday(selectedDay) && (<button onClick={() => handleOpenModal(undefined, new Date(new Date(selectedDay).setHours(new Date().getHours() + 1, 0, 0, 0)))} className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center gap-3 uppercase text-[10px] tracking-[0.2em] hover:bg-indigo-700 transition-all active:scale-95"><Plus className="w-4 h-4" /> Novo Agendamento</button>)}
                <button onClick={() => setSelectedDay(null)} className="p-4 bg-slate-50 hover:bg-rose-50 rounded-2xl text-slate-400 hover:text-rose-600 transition-all active:scale-90 border border-slate-100"><X className="w-8 h-8" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-slate-50/30 flex flex-col md:flex-row">
              <div className="flex-1 flex flex-col border-r border-slate-100 overflow-hidden">
                <div className="px-10 py-5 bg-white border-b border-slate-50 flex items-center gap-3 shrink-0"><Navigation className="w-4 h-4 text-indigo-600" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Atividades no Período</span></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                  <div className="space-y-4">
                    {(() => {
                      const dayStart = new Date(selectedDay).setHours(0, 0, 0, 0);
                      const dayEnd = new Date(selectedDay).setHours(23, 59, 59, 999);
                      const daySchedules = schedules.filter(s => {
                        const dep = new Date(s.departureDateTime).getTime();
                        const ret = new Date(s.returnDateTime).getTime();
                        return (dep <= dayEnd) && (ret >= dayStart) && s.status !== 'cancelado';
                      }).sort((a, b) => a.departureDateTime.localeCompare(b.departureDateTime));
                      const dayKey = `${String(selectedDay.getDate()).padStart(2, '0')}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}`;
                      const holiday = HOLIDAYS[dayKey];
                      if (daySchedules.length === 0 && !holiday) return (<div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200"><div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200"><Calendar className="w-8 h-8" /></div><p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhuma saída registrada para este dia.</p></div>);
                      return (<>{holiday && (<div className="bg-rose-50 border border-rose-100 p-6 rounded-[2.5rem] flex items-center gap-5 mb-4 animate-fade-in shadow-sm"><div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-600/20 rotate-3"><Gift className="w-6 h-6" /></div><div><span className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none">Feriado Nacional</span><h4 className="text-lg font-black text-rose-900 leading-tight uppercase mt-0.5">{holiday}</h4></div></div>)}{daySchedules.map(s => { const v = vehicles.find(veh => veh.id === s.vehicleId); const d = persons.find(p => p.id === s.driverId); const sec = sectors.find(sec => sec.id === s.serviceSectorId); const cfg = STATUS_MAP[s.status]; const vehicleSector = sectors.find(sec => sec.id === v?.sectorId)?.name || 'Sem Setor'; const depDate = new Date(s.departureDateTime); const retDate = new Date(s.returnDateTime); const formatDT = (dt: Date) => dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); return (<div key={s.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-200 flex flex-col gap-4 hover:shadow-xl transition-all group shadow-sm border-l-[6px]" style={{ borderLeftColor: `var(--tw-color-${cfg.color}-500)` }}><div className="flex justify-between items-center"><div className="flex items-center gap-4 min-w-0"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform bg-${cfg.color}-50 text-${cfg.color}-600`}><Car className="w-6 h-6" /></div><div className="min-w-0"><h4 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate leading-none">{v?.model || 'Desconhecido'} <span className="text-slate-400 text-[10px] font-bold ml-1">{v?.brand}</span>{v?.sectorId && (<span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded ml-2 align-middle">{vehicleSector}</span>)}</h4><div className="flex items-center gap-2 mt-1.5"><span className="font-mono text-[9px] font-bold text-white bg-slate-900 px-2 py-0.5 rounded-md tracking-wider">{v?.plate || '---'}</span></div></div></div><div className="flex items-center gap-1"><button onClick={() => { setViewingSchedule(s); setIsViewModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Eye className="w-4.5 h-4.5" /></button><button onClick={() => handleOpenModal(s)} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit3 className="w-4.5 h-4.5" /></button></div></div><div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center"><div className="md:col-span-3"><div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest bg-${cfg.color}-50 text-${cfg.color}-700 border-${cfg.color}-200/50`}><cfg.icon className="w-3.5 h-3.5" /> {cfg.label}</div></div><div className="md:col-span-4 flex items-center gap-2 min-w-0"><UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" /><div className="flex flex-col min-w-0"><span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-0.5">Condutor Responsável</span><span className="text-xs font-bold text-slate-600 truncate">{d?.name || '---'}</span></div></div><div className="md:col-span-5 flex items-center gap-2 min-w-0"><MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" /><div className="flex flex-col min-w-0"><span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-0.5">Destino da Viagem</span><span className="text-xs font-black text-indigo-600 uppercase truncate" title={s.destination}>{s.destination}</span></div></div></div>{s.vehicleLocation && (<div className="flex items-center gap-2 mt-1 ml-1 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 w-fit"><MapPin className="w-3 h-3 text-slate-400" /><span className="text-[8px] font-black text-slate-400 uppercase">Localização:</span><span className="text-[10px] font-bold text-slate-600">{s.vehicleLocation}</span></div>)}<div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-slate-50 items-center"><div className="md:col-span-8 flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" /><div className="flex items-center gap-4"><div className="flex flex-col"><span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-1">Saída</span><span className="bg-slate-50 px-2 py-1 rounded border border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-tighter">{formatDT(depDate)}</span></div><ArrowRight className="w-3 h-3 text-slate-300 mt-2" /><div className="flex flex-col"><span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-1">Retorno</span><span className="bg-slate-50 px-2 py-1 rounded border border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-tighter">{formatDT(retDate)}</span></div></div></div><div className="md:col-span-4 flex items-center justify-end min-w-0"><div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-full md:w-auto"><Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" /><div className="flex items-center gap-1.5 min-w-0"><span className="text-[8px] font-black text-slate-400 uppercase whitespace-nowrap shrink-0">Setor Atendido:</span><span className="text-[10px] font-bold text-slate-700 uppercase leading-tight">{sec?.name || 'Não informado'}</span></div></div></div></div></div>); })} </>);
                    })()}
                  </div>
                </div>
              </div>
              <div className="w-full md:w-96 flex flex-col overflow-hidden bg-slate-50/50">
                <div className="px-8 py-5 bg-white border-b border-slate-100 flex items-center gap-3 shrink-0"><Activity className="w-4 h-4 text-emerald-600" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Veículos Livres no Dia</span></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  {!isDateBeforeToday(selectedDay) ? (
                    <div className="space-y-6">
                      {(() => {
                        const dStart = new Date(selectedDay).setHours(0, 0, 0, 0);
                        const dEnd = new Date(selectedDay).setHours(23, 59, 59, 999);
                        const lightVehicles = vehicles.filter(v => v.type === 'leve' && v.status === 'operacional');
                        const available: Vehicle[] = [];
                        const occupied: { vehicle: Vehicle, schedule: VehicleSchedule }[] = [];
                        lightVehicles.forEach(v => {
                          const occupyingSchedule = schedules.find(s => {
                            if (s.vehicleId !== v.id || (s.status !== 'confirmado' && s.status !== 'em_curso')) return false;
                            const sStart = new Date(s.departureDateTime).getTime();
                            const sEnd = new Date(s.returnDateTime).getTime();
                            return (sStart <= dEnd) && (sEnd >= dStart);
                          });
                          if (occupyingSchedule) occupied.push({ vehicle: v, schedule: occupyingSchedule });
                          else available.push(v);
                        });
                        if (available.length === 0 && occupied.length === 0) return (<div className="text-center py-10"><Info className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhum veículo leve operacional</p></div>);
                        return (<>{available.length > 0 && (<div className="space-y-3"><div className="flex items-center gap-2 mb-2 ml-1"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div><span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Disponíveis</span></div>{available.map(v => { const vSector = sectors.find(s => s.id === v.sectorId)?.name || 'Sem Setor'; return (<button key={v.id} onClick={() => handleOpenModal(undefined, new Date(new Date(selectedDay!).setHours(new Date().getHours() + 1, 0, 0, 0)), v.id)} className="w-full bg-blue-50/50 p-4 rounded-2xl border border-blue-100 hover:border-blue-400 hover:shadow-md transition-all flex items-center justify-between group text-left shadow-sm"><div className="flex items-center gap-4 min-w-0"><div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0 shadow-sm"><Car className="w-5 h-5" /></div><div className="min-w-0"><span className="text-xs font-black text-blue-900 uppercase block truncate leading-tight">{v.brand} {v.model}</span><div className="flex items-center gap-2 mt-0.5"><span className="text-[8px] font-mono font-bold text-blue-600 bg-white px-1.5 py-0.5 rounded border border-blue-100 tracking-wider uppercase">{v.plate}</span><span className="text-[9px] text-blue-400 font-bold uppercase truncate max-w-[100px]">{vSector}</span></div></div></div><div className="p-2 text-blue-200 group-hover:text-blue-600 transition-colors"><Plus className="w-4 h-4" /></div></button>); })} </div>)}{occupied.length > 0 && (<div className="space-y-3 pt-4"><div className="flex items-center gap-2 mb-2 ml-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div><span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Ocupados no Período</span></div>{occupied.map(({ vehicle, schedule }) => { const vSector = sectors.find(s => s.id === vehicle.sectorId)?.name || 'Sem Setor'; return (<div key={vehicle.id} className="w-full bg-orange-50/50 p-4 rounded-2xl border border-orange-200 flex items-center justify-between group shadow-sm"><div className="flex items-center gap-4 min-w-0"><div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-400 shrink-0 shadow-sm"><Navigation className="w-5 h-5" /></div><div className="min-w-0"><div className="flex items-center gap-2"><span className="text-xs font-black text-orange-900 uppercase truncate leading-tight">{vehicle.brand} {vehicle.model}</span></div><div className="flex items-center gap-2 mt-0.5"><span className="text-[8px] font-mono font-bold text-orange-600 bg-white px-1.5 py-0.5 rounded border border-orange-100 tracking-wider uppercase">{vehicle.plate}</span><span className="text-[9px] text-orange-400 font-bold uppercase truncate flex items-center gap-1 max-w-[100px]"><MapPin className="w-2 h-2 shrink-0" /> {schedule.destination}</span></div><div className="text-[8px] font-black text-orange-300 uppercase mt-1">Lotação: {vSector}</div></div></div><div className="shrink-0 ml-2"><div className="w-6 h-6 bg-white border border-orange-100 rounded-lg flex items-center justify-center text-orange-200 shadow-sm"><Lock className="w-3 h-3" /></div></div></div>); })} </div>)}</>);
                      })()}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4"><div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300"><Clock className="w-8 h-8" /></div><div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Data Passada</p><p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">Não é permitido realizar agendamentos em períodos retroativos.</p></div></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fade-in">
          <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] w-full max-w-5xl overflow-hidden flex flex-col animate-slide-up border border-white/20 max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-[-4deg] shrink-0"><Calendar className="w-8 h-8" /></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">{editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">O veículo ficará indisponível durante o intervalo se confirmado</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 hover:bg-rose-50 rounded-2xl text-slate-400 hover:text-rose-600 transition-all"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-10 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative" ref={refs.vehicle}>
                  <label className={labelClass}><Car className="w-3 h-3 inline mr-2" /> Veículo Operacional</label>
                  <div onClick={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)} className={`${inputClass} flex items-center justify-between cursor-pointer py-3.5 ${isVehicleDropdownOpen ? 'border-indigo-500 ring-4 ring-indigo-500/5 bg-white' : ''}`}>
                    <span className={formData.vehicleId ? 'text-slate-900 font-bold' : 'text-slate-400'}>{vehicles.find(v => v.id === formData.vehicleId) ? `${vehicles.find(v => v.id === formData.vehicleId)?.brand} ${vehicles.find(v => v.id === formData.vehicleId)?.model}` : 'Selecione o veículo...'}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isVehicleDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {isVehicleDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"><div className="p-3 bg-slate-50 border-b border-slate-100"><input type="text" placeholder="Filtrar por placa ou modelo..." autoFocus className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)} onClick={e => e.stopPropagation()} /></div><div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                      {vehicles.filter(v => v.status === 'operacional' && (v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) || v.plate.toLowerCase().includes(vehicleSearch.toLowerCase()) || v.brand.toLowerCase().includes(vehicleSearch.toLowerCase()))).map(v => { const isAvail = isVehicleAvailable(v.id, formData.departureDateTime!, formData.returnDateTime!, editingSchedule?.id); const vehicleSector = sectors.find(s => s.id === v.sectorId)?.name || 'Sem Setor'; return (<button key={v.id} disabled={!isAvail} onClick={() => { setFormData({ ...formData, vehicleId: v.id }); setIsVehicleDropdownOpen(false); }} className={`w-full px-4 py-3 flex items-center justify-between rounded-xl transition-colors text-left group ${!isAvail ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:bg-indigo-50'}`}><div className="flex flex-col"><div className="flex items-center gap-2"><span className={`text-sm font-black uppercase ${!isAvail ? 'text-slate-400' : 'text-slate-700 group-hover:text-indigo-700'}`}>{v.brand} {v.model}</span><span className="font-mono text-[9px] font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded tracking-widest">{v.plate}</span></div><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1"><Landmark className="w-2.5 h-2.5" /> {vehicleSector}</span>{!isAvail && <span className="text-[8px] text-rose-500 font-black uppercase mt-1">Ocupado no período</span>}</div>{formData.vehicleId === v.id && <Check className="w-4 h-4 text-indigo-600" />}</button>); })}
                    </div></div>
                  )}
                </div>
                <div className="relative" ref={refs.driver}>
                  <label className={labelClass}><UserIcon className="w-3 h-3 inline mr-2" /> Motorista Responsável</label>
                  <div onClick={() => setIsDriverDropdownOpen(!isDriverDropdownOpen)} className={`${inputClass} flex items-center justify-between cursor-pointer py-3.5 ${isDriverDropdownOpen ? 'border-indigo-500 ring-4 ring-indigo-500/5 bg-white' : ''}`}><span className={formData.driverId ? 'text-slate-900 font-bold' : 'text-slate-400'}>{persons.find(p => p.id === formData.driverId)?.name || 'Selecione o motorista...'}</span><ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDriverDropdownOpen ? 'rotate-180' : ''}`} /></div>
                  {isDriverDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"><div className="p-3 bg-slate-50 border-b border-slate-100"><input type="text" placeholder="Filtrar motorista..." autoFocus className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" value={driverSearch} onChange={e => setDriverSearch(e.target.value)} onClick={e => e.stopPropagation()} /></div><div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {persons.filter(p => p.name.toLowerCase().includes(driverSearch.toLowerCase())).map(d => (<button key={d.id} onClick={() => { setFormData({ ...formData, driverId: d.id }); setIsDriverDropdownOpen(false); }} className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-50 rounded-xl transition-colors text-left group"><span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{d.name}</span>{formData.driverId === d.id && <Check className="w-4 h-4 text-indigo-600" />}</button>))}
                    </div></div>
                  )}
                </div>
                <div className="relative" ref={refs.requester}>
                  <label className={labelClass}><UserCircle className="w-3 h-3 inline mr-2 text-indigo-500" /> Solicitante (Requerente)</label>
                  <div onClick={() => setIsRequesterDropdownOpen(!isRequesterDropdownOpen)} className={`${inputClass} flex items-center justify-between cursor-pointer py-3.5 ${isRequesterDropdownOpen ? 'border-indigo-500 ring-4 ring-indigo-500/5 bg-white' : ''}`}><span className={formData.requesterPersonId ? 'text-slate-900 font-bold' : 'text-slate-400'}>{persons.find(p => p.id === formData.requesterPersonId)?.name || 'Quem está solicitando?'}</span><ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isRequesterDropdownOpen ? 'rotate-180' : ''}`} /></div>
                  {isRequesterDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"><div className="p-3 bg-slate-50 border-b border-slate-100"><input type="text" placeholder="Buscar pessoa..." autoFocus className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" value={requesterSearch} onChange={e => setRequesterSearch(e.target.value)} onClick={e => e.stopPropagation()} /></div><div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {persons.filter(p => p.name.toLowerCase().includes(requesterSearch.toLowerCase())).map(p => (<button key={p.id} onClick={() => { setFormData({ ...formData, requesterPersonId: p.id }); setIsRequesterDropdownOpen(false); }} className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-50 rounded-xl transition-colors text-left group"><div className="flex flex-col"><span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{p.name}</span></div>{formData.requesterPersonId === p.id && <Check className="w-4 h-4 text-indigo-600" />}</button>))}
                    </div></div>
                  )}
                </div>
                <div className="relative" ref={refs.sector}>
                  <label className={labelClass}><Landmark className="w-3 h-3 inline mr-2 text-indigo-500" /> Setor de Atendimento</label>
                  <div onClick={() => setIsSectorDropdownOpen(!isSectorDropdownOpen)} className={`${inputClass} flex items-center justify-between cursor-pointer py-3.5 ${isSectorDropdownOpen ? 'border-indigo-500 ring-4 ring-indigo-500/5 bg-white' : ''}`}><span className={formData.serviceSectorId ? 'text-slate-900 font-bold' : 'text-slate-400'}>{sectors.find(s => s.id === formData.serviceSectorId)?.name || 'Qual setor será atendido?'}</span><ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isSectorDropdownOpen ? 'rotate-180' : ''}`} /></div>
                  {isSectorDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"><div className="p-3 bg-slate-50 border-b border-slate-100"><input type="text" placeholder="Buscar setor..." autoFocus className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" value={sectorSearch} onChange={e => setSectorSearch(e.target.value)} onClick={e => e.stopPropagation()} /></div><div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {sectors.filter(s => s.name.toLowerCase().includes(sectorSearch.toLowerCase())).map(s => (<button key={s.id} onClick={() => { setFormData({ ...formData, serviceSectorId: s.id }); setIsSectorDropdownOpen(false); }} className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-50 rounded-xl transition-colors text-left group"><span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{s.name}</span>{formData.serviceSectorId === s.id && <Check className="w-4 h-4 text-indigo-600" />}</button>))}
                    </div></div>
                  )}
                </div>
                <div className="md:col-span-2 relative" ref={refs.city}>
                  <label className={labelClass}><MapPin className="w-3 h-3 inline mr-2" /> Itinerário / Destino</label>
                  <div onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)} className={`${inputClass} flex items-center justify-between cursor-pointer py-3.5 ${isCityDropdownOpen ? 'border-indigo-500 ring-4 ring-indigo-500/5 bg-white' : ''}`}><span className={formData.destination ? 'text-slate-900 font-bold' : 'text-slate-400'}>{formData.destination || 'Selecione a cidade...'}</span><ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} /></div>
                  {isCityDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[350px]"><div className="p-3 bg-slate-50 border-b border-slate-100 flex flex-col gap-2 shrink-0"><input type="text" placeholder="Filtrar ou digitar cidade..." autoFocus className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-indigo-500" value={citySearch} onChange={e => setCitySearch(e.target.value)} onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Enter' && citySearch.trim()) { setFormData({ ...formData, destination: citySearch.toUpperCase() }); setIsCityDropdownOpen(false); setCitySearch(''); } }} /></div><div className="overflow-y-auto custom-scrollbar p-1">{COMMON_CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).map((city, idx) => (<button key={idx} onClick={() => { setFormData({ ...formData, destination: city }); setIsCityDropdownOpen(false); setCitySearch(''); }} className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-indigo-50 rounded-xl transition-colors text-left group"><span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{city}</span>{formData.destination === city && <Check className="w-4 h-4 text-indigo-600" />}</button>))}</div></div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}><MapPin className="w-3 h-3 inline mr-2 text-indigo-500" /> Localização do Veículo (Onde o veículo estará?)</label>
                  <input value={formData.vehicleLocation} onChange={e => setFormData({ ...formData, vehicleLocation: e.target.value })} className={inputClass} placeholder="Ex: Pátio da Secretaria, Garagem Municipal, Praça Central..." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
                  <div>
                    <label className={labelClass}><Clock className="w-3 h-3 inline mr-2" /> Início Agendamento</label>
                    <input type="datetime-local" value={formData.departureDateTime} min={getLocalISOString()} onChange={e => setFormData({ ...formData, departureDateTime: e.target.value })} className={`${inputClass} h-[52px]`} />
                  </div>
                  <div>
                    <label className={labelClass}><Clock className="w-3 h-3 inline mr-2" /> Fim Agendamento</label>
                    <input type="datetime-local" value={formData.returnDateTime} min={formData.departureDateTime || getLocalISOString()} onChange={e => setFormData({ ...formData, returnDateTime: e.target.value })} className={`${inputClass} h-[52px]`} />
                  </div>
                </div>
                <div className="md:col-span-2"><label className={labelClass}><Info className="w-3 h-3 inline mr-2" /> Objetivo da Viagem</label><textarea value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} className={`${inputClass} min-h-[100px] resize-none pt-4`} placeholder="Descreva brevemente o motivo da saída..." /></div>
                {editingSchedule && (
                  <div className="md:col-span-2 flex justify-end">
                    <button onClick={() => { if (confirm("Remover agendamento?")) { onDeleteSchedule(editingSchedule.id); setIsModalOpen(false); } }} className="py-3.5 px-6 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-600 hover:text-white transition-all active:scale-95 border border-rose-100 h-[52px] shrink-0"><Trash2 className="w-4 h-4" /> Excluir Registro</button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-10 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 font-black text-slate-400 hover:text-rose-600 transition-all uppercase text-[11px] tracking-[0.3em]">Descartar</button>
              <button onClick={handleSave} className="px-12 py-5 bg-slate-900 text-white font-black rounded-3xl hover:bg-indigo-600 shadow-2xl flex items-center justify-center gap-4 transition-all uppercase text-[11px] tracking-[0.3em] active:scale-95"><Save className="w-5 h-5" /> {editingSchedule ? 'Atualizar Dados' : 'Confirmar Agendamento'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* TOAST DE NOTIFICAÇÃO MODERNO (CENTRALIZADO NO TOPO - CORREÇÃO DE TAMANHO E TEXTO) */}
      {toast.show && createPortal(
        <div className="fixed top-10 left-0 right-0 z-[300] flex justify-center pointer-events-none px-6">
          <div className={`animate-slide-down pointer-events-auto p-5 rounded-[2.5rem] shadow-2xl border flex items-center gap-5 backdrop-blur-2xl transition-all duration-500 max-w-2xl w-fit
             ${toast.type === 'error' ? 'bg-rose-600/95 border-rose-500 text-white shadow-rose-500/30' :
              toast.type === 'success' ? 'bg-emerald-600/95 border-emerald-500 text-white shadow-emerald-500/30' :
                'bg-amber-500/95 border-amber-400 text-white shadow-amber-500/30'}
           `}>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              {toast.type === 'error' ? <ShieldAlert className="w-7 h-7" /> :
                toast.type === 'success' ? <CheckCircle2 className="w-7 h-7" /> :
                  <AlertTriangle className="w-7 h-7" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1.5 opacity-80">{toast.type === 'error' ? 'Atenção Crítica' : toast.type === 'success' ? 'Operação Concluída' : 'Aviso do Sistema'}</p>
              <p className="text-sm sm:text-base font-bold leading-snug break-words">{toast.message}</p>
            </div>
            <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-2 p-2.5 hover:bg-white/10 rounded-2xl transition-colors shrink-0 active:scale-90">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {isViewModalOpen && viewingSchedule && createPortal(
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fade-in h-full">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-slide-up border border-white/20">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4"><div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><FileText className="w-6 h-6" /></div><div><h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Detalhes da Viagem</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Informações completas do agendamento</p></div></div>
              <button onClick={() => setIsViewModalOpen(false)} className="p-3 hover:bg-white rounded-xl text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-8"><div className="grid grid-cols-2 gap-6"><div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Veículo</p><p className="text-base font-bold text-slate-900 uppercase">{(vehicles.find(v => v.id === viewingSchedule.vehicleId))?.brand} {(vehicles.find(v => v.id === viewingSchedule.vehicleId))?.model} ({(vehicles.find(v => v.id === viewingSchedule.vehicleId))?.plate})</p></div><div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motorista</p><p className="text-base font-bold text-slate-900">{(persons.find(p => p.id === viewingSchedule.driverId))?.name}</p></div><div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setor</p><p className="text-base font-bold text-slate-900 uppercase">{(sectors.find(s => s.id === viewingSchedule.serviceSectorId))?.name || '---'}</p></div><div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solicitante</p><p className="text-base font-bold text-slate-900">{(persons.find(p => p.id === viewingSchedule.requesterPersonId))?.name || '---'}</p></div><div className="col-span-2 space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Localização de Retirada/Encontro</p><p className="text-base font-bold text-indigo-700 uppercase flex items-center gap-2"><MapPin className="w-4 h-4" />{viewingSchedule.vehicleLocation || 'Não especificada'}</p></div><div className="col-span-2 space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destino</p><p className="text-base font-bold text-indigo-600 uppercase">{viewingSchedule.destination}</p></div><div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saída</p><p className="text-sm font-bold text-slate-700">{new Date(viewingSchedule.departureDateTime).toLocaleString('pt-BR')}</p></div><div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retorno</p><p className="text-sm font-bold text-slate-700">{new Date(viewingSchedule.returnDateTime).toLocaleString('pt-BR')}</p></div><div className="col-span-2 space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objetivo</p><p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 italic">"{viewingSchedule.purpose}"</p></div><div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p><div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mt-1 font-black text-[10px] uppercase tracking-widest bg-${STATUS_MAP[viewingSchedule.status].color}-50 text-${STATUS_MAP[viewingSchedule.status].color}-700 border-${STATUS_MAP[viewingSchedule.status].color}-200`}>{React.createElement(STATUS_MAP[viewingSchedule.status].icon, { className: "w-3 h-3" })}{STATUS_MAP[viewingSchedule.status].label}</div></div></div></div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center"><button onClick={() => setIsViewModalOpen(false)} className="px-12 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-lg hover:bg-indigo-600 transition-all">Fechar Detalhes</button></div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const ShieldAlert = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
);