import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import { createPortal } from 'react-dom';
import {
  AppState, User, Order, Signature, BlockType, Person, Sector, Job, StatusMovement, Attachment, Vehicle, VehicleBrand, VehicleSchedule
} from './types';
import { INITIAL_STATE, DEFAULT_USERS, MOCK_SIGNATURES, DEFAULT_SECTORS, DEFAULT_JOBS, DEFAULT_PERSONS } from './constants';
import * as db from './services/dbService';
import { supabase } from './services/supabaseClient';
import * as entityService from './services/entityService';
import * as settingsService from './services/settingsService';
import * as oficiosService from './services/oficiosService';
import * as comprasService from './services/comprasService';
import * as diariasService from './services/diariasService';
import * as counterService from './services/counterService';
import * as signatureService from './services/signatureService';

import * as vehicleSchedulingService from './services/vehicleSchedulingService';
import * as licitacaoService from './services/licitacaoService';
import { Send, CheckCircle2, X, Download, Save, FilePlus, Package, History, FileText, Settings, LogOut, ChevronRight, ChevronDown, Search, Filter, Upload, Trash2, Printer, Edit, ArrowLeft } from 'lucide-react';

// Components
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { TrackingScreen } from './components/TrackingScreen';
import { AdminSidebar } from './components/AdminSidebar';
import { DocumentPreview } from './components/DocumentPreview';
import { AdminDocumentPreview } from './components/AdminDocumentPreview';
import { UserManagementScreen } from './components/UserManagementScreen';
import { EntityManagementScreen } from './components/EntityManagementScreen';
import { SignatureManagementScreen } from './components/SignatureManagementScreen';
import { FleetManagementScreen } from './components/FleetManagementScreen';
import { VehicleSchedulingScreen } from './components/VehicleSchedulingScreen';
import { UIPreviewScreen } from './components/UIPreviewScreen';
import { AppHeader } from './components/AppHeader';
import { FinalizedActionBar } from './components/FinalizedActionBar';
import { PurchaseManagementScreen } from './components/PurchaseManagementScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { TwoFactorAuthScreen } from './components/TwoFactorAuthScreen';
import { TwoFactorModal } from './components/TwoFactorModal';
import { ProcessStepper } from './components/common/ProcessStepper';
import { LicitacaoScreeningScreen } from './components/LicitacaoScreeningScreen';
import { LicitacaoSettingsModal } from './components/LicitacaoSettingsModal';
import { ToastNotification, ToastType } from './components/common/ToastNotification';
import { AbastecimentoForm } from './components/abastecimento/AbastecimentoForm';
import { AbastecimentoList } from './components/abastecimento/AbastecimentoList';
import { AbastecimentoDashboard } from './components/abastecimento/AbastecimentoDashboard';

const VIEW_TO_PATH: Record<string, string> = {
  'login': '/Login',
  'home': '/PaginaInicial',
  'home:oficio': '/Oficios',
  'home:compras': '/Compras',
  'home:diarias': '/Diarias',
  'home:licitacao': '/Licitacao',
  'home:abastecimento': '/Abastecimento',
  'licitacao-new': '/Licitacao/NovoProcesso',
  'licitacao-tracking': '/Licitacao/MeusProcessos',
  'licitacao-screening': '/Licitacao/Triagem',
  'licitacao-all': '/Licitacao/Processos',
  'admin:dashboard': '/Admin/Dashboard',
  'admin:users': '/Admin/Usuarios',
  'admin:entities': '/Admin/Entidades',
  'admin:fleet': '/Frota',
  'admin:signatures': '/Admin/Assinaturas',
  'admin:ui': '/Admin/Interface',
  'admin:design': '/Admin/Design',
  'tracking:oficio': '/Historico/Oficio',
  'tracking:compras': '/Historico/Compras',
  'tracking:diarias': '/Historico/Diarias',
  'editor:oficio': '/Editor/Oficio',
  'editor:compras': '/Editor/Compras',
  'editor:diarias': '/Editor/Diarias',
  'purchase-management': '/GestaoCompras',
  'vehicle-scheduling': '/AgendamentoVeiculos',
  'vehicle-scheduling:vs_calendar': '/AgendamentoVeiculos/Agendar',
  'vehicle-scheduling:vs_history': '/AgendamentoVeiculos/Historico',
  'vehicle-scheduling:vs_approvals': '/AgendamentoVeiculos/Aprovacoes',
  'abastecimento:new': '/Abastecimento/NovoAbastecimento',
  'abastecimento:management': '/Abastecimento/GestãoAbastecimento',
  'abastecimento:dashboard': '/Abastecimento/DashboardAbastecimento'
};

const PATH_TO_STATE: Record<string, any> = Object.fromEntries(
  Object.entries(VIEW_TO_PATH).map(([stateKey, path]) => {
    const [view, sub] = stateKey.split(':');
    return [path, { view, sub }];
  })
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'home' | 'admin' | 'tracking' | 'editor' | 'purchase-management' | 'vehicle-scheduling' | 'licitacao-screening' | 'licitacao-all' | 'abastecimento'>('login');
  const { user: currentUser, signIn, signOut, refreshUser } = useAuth();
  const [appState, setAppState] = useState<AppState>(() => {
    // Try to load from localStorage first
    try {
      const cached = localStorage.getItem('cachedAppState');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error("Failed to load cached AppState", e);
    }
    return INITIAL_STATE;
  });
  const [activeBlock, setActiveBlock] = useState<BlockType | null>(null);
  const [oficios, setOficios] = useState<Order[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<Order[]>([]);

  const [serviceRequests, setServiceRequests] = useState<Order[]>([]);
  const [licitacaoProcesses, setLicitacaoProcesses] = useState<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  // const [signatures, setSignatures] = useState<Signature[]>([]); // DEPRECATED: Signatures are now derived from Users
  const [globalCounter, setGlobalCounter] = useState(0);
  const [licitacaoNextProtocol, setLicitacaoNextProtocol] = useState<number | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isStepperLocked, setIsStepperLocked] = useState(false);
  const [lastListView, setLastListView] = useState<string>('tracking'); // Default to tracking

  const [persons, setPersons] = useState<Person[]>([]);

  // Derived signatures from Users
  const allSignatures = users
    .filter(u => u.name && u.jobTitle && u.sector)
    .map(u => ({
      id: u.id,
      name: u.name,
      role: u.jobTitle || 'Usuário',
      sector: u.sector || 'Geral'
    }));

  // Ensure current user is always available as a signature for themselves
  const currentUserSignature = currentUser ? {
    id: currentUser.id,
    name: currentUser.name,
    role: currentUser.jobTitle || 'Usuário',
    sector: currentUser.sector || 'Geral'
  } : null;

  // Combine allowed signatures + self (For AdminSidebar usage mostly)
  const myAvailableSignatures = currentUser
    ? [
      currentUserSignature!,
      ...allSignatures.filter(s => currentUser.allowedSignatureIds?.includes(s.id) && s.id !== currentUser.id)
    ]
    : [];
  const [sectors, setSectors] = useState<Sector[]>(DEFAULT_SECTORS);
  const [jobs, setJobs] = useState<Job[]>(DEFAULT_JOBS);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [schedules, setSchedules] = useState<VehicleSchedule[]>([]);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<string | null>(null);
  const [isFinalizedView, setIsFinalizedView] = useState(false);

  const [successOverlay, setSuccessOverlay] = useState<{ show: boolean, protocol: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; type: 'info' | 'warning' | 'error'; singleButton?: boolean }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'info'
  });

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  };
  const [snapshotToDownload, setSnapshotToDownload] = useState<AppState | null>(null);
  const [blockTypeToDownload, setBlockTypeToDownload] = useState<BlockType | null>(null);
  const backgroundPreviewRef = useRef<HTMLDivElement>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  // 2FA State
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFASecret2, setTwoFASecret2] = useState<string | null>(null);
  const [twoFASignatureName, setTwoFASignatureName] = useState('');
  const [pendingParams, setPendingParams] = useState<any>(null); // To store state/action to resume after 2FA
  const [pending2FAAction, setPending2FAAction] = useState<((metadata: any) => Promise<void>) | null>(null); // Generic callback for 2FA success

  // Routing logic
  const [isLicitacaoSettingsOpen, setIsLicitacaoSettingsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isReopeningStage, setIsReopeningStage] = useState(false);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const loadedOficios = await oficiosService.getAllOficios();
      setOficios(loadedOficios);
      const loadedPurchaseOrders = await comprasService.getAllPurchaseOrders();
      setPurchaseOrders(loadedPurchaseOrders);
      const loadedServiceRequests = await diariasService.getAllServiceRequests();

      setServiceRequests(loadedServiceRequests);
      const loadedLicitacao = await licitacaoService.getAllLicitacaoProcesses();
      setLicitacaoProcesses(loadedLicitacao);

      // Re-evaluate orders based on active view/block if needed, but for now specific block handling in other functions overrides this.
      // However, to see updates in current list:
      if (activeBlock === 'compras') setOrders(loadedPurchaseOrders);
      else if (activeBlock === 'diarias') setOrders(loadedServiceRequests);
      else if (activeBlock === 'licitacao') setOrders(loadedLicitacao);
      else setOrders(loadedOficios);


      // Fetch users from Supabase
      const { data: sbUsers, error: sbError } = await supabase.from('profiles').select('*');
      if (sbUsers) {
        const mappedUsers: User[] = sbUsers.map((u: any) => ({
          id: u.id,
          username: u.username,
          name: u.name,
          role: u.role,
          sector: u.sector,
          jobTitle: u.job_title,
          email: u.email,
          whatsapp: u.whatsapp,
          allowedSignatureIds: u.allowed_signature_ids,
          permissions: u.permissions,
          tempPassword: u.temp_password,
          tempPasswordExpiresAt: u.temp_password_expires_at,
          twoFactorEnabled: u.two_factor_enabled,
          twoFactorSecret: u.two_factor_secret,
          twoFactorEnabled2: u.two_factor_enabled_2,
          twoFactorSecret2: u.two_factor_secret_2
        }));
        setUsers(mappedUsers);
      } else {
        console.error("Error fetching users:", sbError);
      }

      // Fetch Global Settings (Try Supabase first, fallback to local)
      const remoteSettings = await settingsService.getGlobalSettings();
      if (remoteSettings) {
        setAppState(prev => {
          const newState = {
            ...prev,
            branding: {
              ...prev.branding,
              ...remoteSettings.branding,
              watermark: {
                ...prev.branding.watermark,
                ...(remoteSettings.branding?.watermark || {})
              }
            },
            document: {
              ...prev.document,
              ...remoteSettings.document,
              titleStyle: {
                ...prev.document.titleStyle,
                ...(remoteSettings.document?.titleStyle || {})
              },
              leftBlockStyle: {
                ...prev.document.leftBlockStyle,
                ...(remoteSettings.document?.leftBlockStyle || {})
              },
              rightBlockStyle: {
                ...prev.document.rightBlockStyle,
                ...(remoteSettings.document?.rightBlockStyle || {})
              }
            },
            ui: {
              ...prev.ui,
              ...remoteSettings.ui
            }
          };
          // Cache to LocalStorage
          localStorage.setItem('cachedAppState', JSON.stringify(newState));
          return newState;
        });
      } else {
        const savedSettings = await db.getGlobalSettings();
        if (savedSettings) {
          setAppState(prev => ({
            ...prev,
            branding: savedSettings.branding || prev.branding,
            document: savedSettings.document || prev.document,
            ui: savedSettings.ui || prev.ui
          }));
        }
      }

      // Fetch entities from Supabase
      const savedPersons = await entityService.getPersons();
      setPersons(savedPersons);

      const savedSectors = await entityService.getSectors();
      setSectors(savedSectors);

      const savedJobs = await entityService.getJobs();
      setJobs(savedJobs);

      // MARCAS INICIAIS
      const savedBrands = await entityService.getBrands();
      setBrands(savedBrands);

      // VEÍCULOS INICIAIS
      const savedVehicles = await entityService.getVehicles();
      setVehicles(savedVehicles);



      const savedSchedules = await vehicleSchedulingService.getSchedules();
      setSchedules(savedSchedules);

      const counterValue = await db.getGlobalCounter();
      setGlobalCounter(counterValue);

      setGlobalCounter(counterValue);

      // Fetch Licitacao Specific Counter
      // Use dynamic lookup for "Departamento de Licitação" or fallback to known UUID
      const licitacaoSector = savedSectors.find(s => s.name === 'Departamento de Licitação');
      const licitacaoSectorId = licitacaoSector?.id || '23c6fa21-f998-4f54-b865-b94212f630ef'; // Fallback to known UUID if name changes

      const currentYear = new Date().getFullYear();
      if (licitacaoSectorId) {
        const nextLicParams = await counterService.getNextSectorCount(licitacaoSectorId, currentYear);
        if (nextLicParams) setLicitacaoNextProtocol(nextLicParams);
      }

    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeBlock]); // Dependency on activeBlock ensures setOrders logical consistency

  useEffect(() => {
    // Initial load
    refreshData();
  }, []);
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      const state = PATH_TO_STATE[currentPath];

      if (state) {
        // Special Handling for Licitacao Routes
        if (state.view === 'licitacao-new') {
          setCurrentView('editor');
          setActiveBlock('licitacao');
          setEditingOrder(null);
          setIsLicitacaoSettingsOpen(true);
        } else if (state.view === 'licitacao-tracking') {
          setCurrentView('tracking');
          setActiveBlock('licitacao');
        } else if (state.view === 'licitacao-all') {
          setCurrentView('licitacao-all');
          setActiveBlock('licitacao');
        } else if (state.view === 'licitacao-screening') {
          setCurrentView('licitacao-screening');
          setActiveBlock('licitacao');
        } else {
          // General Handling
          setCurrentView(state.view);
          if (state.view === 'admin') setAdminTab(state.sub);
          else if (['tracking', 'editor', 'home', 'vehicle-scheduling'].includes(state.view)) setActiveBlock(state.sub || null);
        }
        refreshData();
      }
    };

    // Initial Load Logic (Same as popstate but runs once)
    // Strip trailing slash for consistent lookup (e.g. /Abastecimento/ -> /Abastecimento)
    const rawPath = window.location.pathname;
    const initialPath = (rawPath.length > 1 && rawPath.endsWith('/')) ? rawPath.slice(0, -1) : rawPath;

    const initialState = PATH_TO_STATE[initialPath];
    if (initialState) {
      if (initialState.view === 'licitacao-new') {
        setCurrentView('editor');
        setActiveBlock('licitacao');
        setEditingOrder(null);
        setIsLicitacaoSettingsOpen(true);
      } else if (initialState.view === 'licitacao-tracking') {
        setCurrentView('tracking');
        setActiveBlock('licitacao');
      } else if (initialState.view === 'licitacao-all') {
        setCurrentView('licitacao-all');
        setActiveBlock('licitacao');
      } else if (initialState.view === 'licitacao-screening') {
        setCurrentView('licitacao-screening');
        setActiveBlock('licitacao');
      } else {
        if (initialState.view !== currentView) setCurrentView(initialState.view);
        if (initialState.view === 'admin') {
          if (initialState.sub !== adminTab) setAdminTab(initialState.sub);
        } else if (['tracking', 'editor', 'home', 'vehicle-scheduling'].includes(initialState.view)) {
          const newBlock = initialState.sub || null;
          if (newBlock !== activeBlock) setActiveBlock(newBlock);
        }
      }
      refreshData();
    } else if (initialPath === '/' || initialPath === '') {
      if (currentUser) setCurrentView('home');
      else setCurrentView('login');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let stateKey = currentView as string;

    // Licitacao Specific Keys
    if (activeBlock === 'licitacao') {
      if (currentView === 'editor' && !editingOrder) stateKey = 'licitacao-new';
      else if (currentView === 'tracking') stateKey = 'licitacao-tracking';
      else if (currentView === 'licitacao-all') stateKey = 'licitacao-all';
      else if (currentView === 'licitacao-screening') stateKey = 'licitacao-screening';
      else if (currentView === 'home') stateKey = 'home:licitacao';
    } else {
      // Standard Keys
      if (currentView === 'admin' && adminTab) {
        stateKey = `admin:${adminTab}`;
      } else if (['tracking', 'editor', 'home', 'vehicle-scheduling'].includes(currentView) && activeBlock) {
        stateKey = `${currentView}:${activeBlock}`;
      } else if (currentView === 'admin' && !adminTab) {
        stateKey = 'admin:dashboard';
      } else if ((currentView === 'tracking' || currentView === 'editor') && !activeBlock) {
        stateKey = `${currentView}:oficio`;
      } else if (currentView === 'home' && !activeBlock) {
        stateKey = 'home';
      }
    }

    const expectedPath = VIEW_TO_PATH[stateKey];
    if (expectedPath && window.location.pathname !== expectedPath) {
      window.history.pushState(null, '', expectedPath);
      refreshData();
    }

    // Auto-refresh handled by useCallback dependency if needed
  }, [currentView, activeBlock, adminTab, editingOrder]);

  // Fetch Licitacao Global Protocol Counter
  useEffect(() => {
    const fetchLicitacaoCount = async () => {
      if (activeBlock === 'licitacao') {
        const year = new Date().getFullYear();
        const count = await counterService.getLicitacaoProtocolCount(year);
        if (count) {
          setLicitacaoNextProtocol(count);
        }
      }
    };
    fetchLicitacaoCount();
  }, [activeBlock, isRefreshing]); // Refresh when block active or data refreshes


  useEffect(() => {
    if (currentUser && currentView === 'login') {
      setCurrentView('home');
    } else if (!currentUser && currentView !== 'login') {
      setCurrentView('login');
    }
  }, [currentUser, currentView]);



  const handleLogin = async (u: string, p: string) => {
    const { error } = await signIn(u, p);
    if (!error) {
      setCurrentView('home');
    }
    return { error };
  };

  const handleFinish = async (skip2FA = false, digitalSignatureData?: { enabled: boolean, method: string, ip: string, date: string }): Promise<boolean> => {
    if (!currentUser || !activeBlock) return false;

    // 2FA Interception Logic
    if (!skip2FA && appState.content.useDigitalSignature) {
      // Find the selected signature user
      // We can infer the selected signer from the content.signatureName (which is text) 
      // OR we need to track the selected signer ID in AppState (better).
      // Currently AppState only stores text names.
      // However, we can try to find the user by name/sector/role match.
      // A robust solution: AppState should store signerId. 
      // For now, I will match by Name + JobTitle (Role) to find the User.

      const signerName = appState.content.signatureName;
      const signerRole = appState.content.signatureRole;

      const signerUser = users.find(u => u.name === signerName && (u.jobTitle === signerRole || u.role === 'admin')); // simplified match

      if (signerUser && (signerUser.twoFactorEnabled || signerUser.twoFactorEnabled2)) {
        // We require 2FA if EITHER is enabled.
        // We pass BOTH secrets if they exist AND are enabled to allow validation against either.

        setTwoFASecret(signerUser.twoFactorEnabled ? (signerUser.twoFactorSecret || '') : '');
        setTwoFASecret2(signerUser.twoFactorEnabled2 ? (signerUser.twoFactorSecret2 || null) : null);

        setTwoFASignatureName(signerUser.name);
        // Store intent to proceed
        setPendingParams(true);
        setIs2FAModalOpen(true);
        return false;
      }
    }

    let finalOrder: Order;
    if (editingOrder) {
      const updatedSnapshot = JSON.parse(JSON.stringify(appState));
      updatedSnapshot.content.protocol = editingOrder.protocol;

      // LICITACAO FIX: When finishing the LAST stage, we must push it to history and increment index
      // so it appears green (completed) in stepper.
      if (activeBlock === 'licitacao') {
        const currentIdx = updatedSnapshot.content.currentStageIndex || 0;
        // Only if we are truly at the end (Stage 6)
        // Adjust index check as needed, assuming 6 is the last one (0-6 = 7 stages)
        if (currentIdx === 6) {
          const stagesNames = ['Início', 'Etapa 01', 'Etapa 02', 'Etapa 03', 'Etapa 04', 'Etapa 05', 'Etapa 06'];
          const currentStageData = {
            id: Date.now().toString(),
            title: stagesNames[currentIdx] || 'Etapa Final',
            body: updatedSnapshot.content.body,
            signatureName: updatedSnapshot.content.signatureName,
            signatureRole: updatedSnapshot.content.signatureRole,
            signatureSector: updatedSnapshot.content.signatureSector,
            signatures: updatedSnapshot.content.signatures || []
          };

          // Push to history
          if (!updatedSnapshot.content.licitacaoStages) updatedSnapshot.content.licitacaoStages = [];
          updatedSnapshot.content.licitacaoStages[currentIdx] = currentStageData;

          // Advance index to 7 so stepper sees 6 as completed
          updatedSnapshot.content.currentStageIndex = currentIdx + 1;

          // Clear active body to avoid confusion (optional, but consistent with intermediate steps)
          updatedSnapshot.content.body = '';
          updatedSnapshot.content.signatureName = '';
        }
      }

      // Add digital signature if present
      if (digitalSignatureData) {
        updatedSnapshot.content.digitalSignature = digitalSignatureData;
        setAppState(prev => ({ ...prev, content: { ...prev.content, digitalSignature: digitalSignatureData } }));
      }

      finalOrder = { ...editingOrder, title: appState.content.title, documentSnapshot: updatedSnapshot };

      // Set status to 'finishing' if completely finished (Stage 6 done -> Index 7)
      if (activeBlock === 'licitacao' && updatedSnapshot.content.currentStageIndex === 7) {
        finalOrder.status = 'finishing';
      }

      // Route save based on blockType
      if (finalOrder.blockType === 'compras') {
        await comprasService.savePurchaseOrder(finalOrder);
        setPurchaseOrders(prev => prev.map(o => o.id === finalOrder.id ? finalOrder : o));
      } else if (finalOrder.blockType === 'diarias') {
        await diariasService.saveServiceRequest(finalOrder);
        setServiceRequests(prev => prev.map(o => o.id === finalOrder.id ? finalOrder : o));
      } else if (finalOrder.blockType === 'licitacao') {
        await licitacaoService.saveLicitacaoProcess(finalOrder);
        setLicitacaoProcesses(prev => prev.map(o => o.id === finalOrder.id ? finalOrder : o));
      } else {
        // Default to Oficio
        await oficiosService.saveOficio(finalOrder);
        setOficios(prev => prev.map(o => o.id === finalOrder.id ? finalOrder : o));
      }
      // Update local generic state for view consistency if needed
      setOrders(prev => prev.map(o => o.id === finalOrder.id ? finalOrder : o));
    } else {
      const nextVal = await db.incrementGlobalCounter();
      setGlobalCounter(nextVal);
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const year = new Date().getFullYear();

      // AUTO-INCREMENT SECTOR COUNTER (Unified for ALL blocks)
      if (currentUser?.sector) {
        const userSector = sectors.find(s => s.name === currentUser.sector);
        if (userSector) {
          // Increment the server counter regardless of block type
          await counterService.incrementSectorCount(userSector.id, year);
        }
      }

      const prefix = activeBlock === 'oficio' ? 'OFC' : activeBlock === 'compras' ? 'COM' : activeBlock === 'diarias' ? 'DIA' : 'LIC';
      const protocolString = `${prefix}-${year}-${randomPart}`;
      const finalSnapshot = JSON.parse(JSON.stringify(appState));
      finalSnapshot.content.protocol = protocolString;

      // Add digital signature if present
      if (digitalSignatureData) {
        finalSnapshot.content.digitalSignature = digitalSignatureData;
        setAppState(prev => ({ ...prev, content: { ...prev.content, digitalSignature: digitalSignatureData } }));
      }

      finalOrder = {
        id: Date.now().toString(),
        protocol: protocolString,
        title: appState.content.title,
        status: 'pending',
        createdAt: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        blockType: activeBlock,
        documentSnapshot: finalSnapshot,
        paymentStatus: activeBlock === 'diarias' ? 'pending' : undefined,
        statusHistory: activeBlock === 'compras' ? [{ statusLabel: 'Criação do Pedido', date: new Date().toISOString(), userName: currentUser.name }] : [],
        attachments: []
      };

      if (activeBlock === 'compras') {
        await comprasService.savePurchaseOrder(finalOrder);
        setPurchaseOrders(prev => [finalOrder, ...prev]);
        setOrders(prev => [finalOrder, ...prev]); // Keep synced if view uses this
      } else if (activeBlock === 'diarias') {
        await diariasService.saveServiceRequest(finalOrder);
        setServiceRequests(prev => [finalOrder, ...prev]);
        setOrders(prev => [finalOrder, ...prev]);
      } else if (activeBlock === 'licitacao') {
        await licitacaoService.saveLicitacaoProcess(finalOrder);
        setLicitacaoProcesses(prev => [finalOrder, ...prev]);
        setOrders(prev => [finalOrder, ...prev]);
      } else {
        await oficiosService.saveOficio(finalOrder);
        setOficios(prev => [finalOrder, ...prev]);
        setOrders(prev => [finalOrder, ...prev]);
      }
      setAppState(finalSnapshot);
      clearDraft(); // CLEAR DRAFT ON SUCCESS
    }
    setIsFinalizedView(true);
    setIsAdminSidebarOpen(false);
    return true;
  };

  const handleSendOrder = async () => {
    if (!currentUser || !activeBlock) return;
    const lastOrder = orders[orders.length - 1];
    setIsDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsDownloading(false);
    setSuccessOverlay({ show: true, protocol: appState.content.protocol || lastOrder?.protocol || 'ERRO-PROTOCOLO' });
  };

  const handleEditOrder = (order: Order) => {
    setLastListView(currentView); // Track where we came from
    let snapshotToUse = order.documentSnapshot;

    // STRICT NAVIGATION GUARD: Licitacao logic
    if (order.blockType === 'licitacao') {
      const isMeusProcessos = currentView === 'tracking';

      if (isMeusProcessos) {
        // Only lock and restrict if it's AWAITING APPROVAL or APPROVED/IN_PROGRESS/FINISHING/COMPLETED (all post-submission states)
        // If it's PENDING (drafting) or REJECTED (needs correction), let them edit.
        if (['awaiting_approval', 'approved', 'in_progress', 'finishing', 'completed'].includes(order.status || '')) {
          setIsStepperLocked(true);
          if (snapshotToUse && snapshotToUse.content) {
            const content = snapshotToUse.content;
            // If already advanced beyond Stage 0, we must load Stage 0 data from history
            let restrictedContent = { ...content, viewingStageIndex: 0 };

            if ((content.currentStageIndex || 0) > 0 && content.licitacaoStages && content.licitacaoStages[0]) {
              const stage0 = content.licitacaoStages[0];
              restrictedContent = {
                ...restrictedContent,
                body: stage0.body,
                signatureName: stage0.signatureName,
                signatureRole: stage0.signatureRole,
                signatureSector: stage0.signatureSector,
                signatures: stage0.signatures || []
              };
            }

            snapshotToUse = {
              ...snapshotToUse,
              content: restrictedContent
            };
            showToast("Visualização restrita à etapa Início", "warning");
          }
        } else {
          setIsStepperLocked(false);
          // Auto-sync viewing index to active tip when opening
          if (snapshotToUse?.content) {
            snapshotToUse = {
              ...snapshotToUse,
              content: {
                ...snapshotToUse.content,
                viewingStageIndex: snapshotToUse.content.currentStageIndex || 0
              }
            };
          }
        }
      } else {
        setIsStepperLocked(false);
        // Standard check for unapproved processes in other views (e.g. Triagem)
        if (order.status === 'awaiting_approval') {
          if (snapshotToUse && snapshotToUse.content) {
            const content = snapshotToUse.content;
            let restrictedContent = { ...content, viewingStageIndex: 0 };

            // Data Sync: Load Stage 0 if we are restricted due to approval status
            if ((content.currentStageIndex || 0) > 0 && content.licitacaoStages && content.licitacaoStages[0]) {
              const stage0 = content.licitacaoStages[0];
              restrictedContent = {
                ...restrictedContent,
                body: stage0.body,
                signatureName: stage0.signatureName,
                signatureRole: stage0.signatureRole,
                signatureSector: stage0.signatureSector,
                signatures: stage0.signatures || []
              };
            }

            snapshotToUse = {
              ...snapshotToUse,
              content: restrictedContent
            };
            showToast("Processo em aprovação: Visualização limitada à etapa Início", "info");
          }
        }
      }
    } else {
      setIsStepperLocked(false);
    }

    if (snapshotToUse) setAppState(snapshotToUse);
    setActiveBlock(order.blockType);
    setEditingOrder(order);
    setCurrentView('editor');
    setAdminTab('content');
    setIsAdminSidebarOpen(true);
    setIsFinalizedView(false);
    setIsReopeningStage(false); // Reset reopening state
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status'], justification?: string) => {
    if (!currentUser) return;
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        if (o.status === status) return o;
        const newMovement: StatusMovement = { statusLabel: status === 'approved' ? 'Aprovação Administrativa' : 'Rejeição', date: new Date().toISOString(), userName: currentUser.name, justification };
        const updated = { ...o, status, statusHistory: [...(o.statusHistory || []), newMovement] };

        if (updated.blockType === 'compras') {
          comprasService.savePurchaseOrder(updated);
          setPurchaseOrders(prev => prev.map(p => p.id === updated.id ? updated : p));
        } else if (updated.blockType === 'diarias') {
          diariasService.saveServiceRequest(updated);
          setServiceRequests(prev => prev.map(p => p.id === updated.id ? updated : p));
        } else if (updated.blockType === 'licitacao') {
          licitacaoService.saveLicitacaoProcess(updated);
          setLicitacaoProcesses(prev => prev.map(p => p.id === updated.id ? updated : p));
        } else {
          oficiosService.saveOficio(updated);
          setOficios(prev => prev.map(p => p.id === updated.id ? updated : p));
        }
        return updated;
      }
      return o;
    });
    setOrders(updatedOrders);
  };

  const handleUpdatePurchaseStatus = async (orderId: string, purchaseStatus: Order['purchaseStatus'], justification?: string, budgetFileUrl?: string) => {
    if (!currentUser) return;
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        const newMovement: StatusMovement = {
          statusLabel: `Alteração de Status para ${purchaseStatus}`,
          date: new Date().toISOString(),
          userName: currentUser.name,
          justification: justification || 'Atualização de status do pedido'
        };

        const updated: Order = {
          ...o,
          purchaseStatus,
          budgetFileUrl: budgetFileUrl || o.budgetFileUrl,
          statusHistory: [...(o.statusHistory || []), newMovement]
        };

        // Call specialized service to administer Audit History
        comprasService.updatePurchaseStatus(o.id, purchaseStatus as string, newMovement, budgetFileUrl);

        setPurchaseOrders(prev => prev.map(p => p.id === updated.id ? updated : p));
        return updated;
      }
      return o;
    });
    setOrders(updatedOrders);
  };

  const handleUpdateCompletionForecast = async (orderId: string, date: string) => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        const updated = { ...o, completionForecast: date };
        comprasService.savePurchaseOrder(updated);
        setPurchaseOrders(prev => prev.map(p => p.id === updated.id ? updated : p));
        return updated;
      }
      return o;
    });
    setOrders(updatedOrders);
  };

  const handleUpdateOrderAttachments = async (orderId: string, attachments: Attachment[]) => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        const updated = { ...o, attachments };
        if (updated.blockType === 'compras') {
          comprasService.updateAttachments(updated.id, updated.attachments || []);
          setPurchaseOrders(prev => prev.map(p => p.id === updated.id ? updated : p));
        } else {
          // For now assume others can have attachments or just ignore if not supported by service yet, 
          // but strictly only purchase had explicit attachment field table support in my plan.
          // Actually Oficio has generic support likely in future, but stick to purchase Service for now.
          // If Oficio needs it, I need `saveOficio` to support it. 
          // Plan said: [NEW] Table `purchase_orders` ... `attachments` JSONB. `oficios` did NOT have attachments.
          // So this technically only applies to Compras.
        }
        return updated;
      }
      return o;
    });
    setOrders(updatedOrders);
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: 'pending' | 'paid') => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        const updated = { ...o, paymentStatus: status, paymentDate: status === 'paid' ? new Date().toISOString() : undefined };
        diariasService.saveServiceRequest(updated);
        setServiceRequests(prev => prev.map(p => p.id === updated.id ? updated : p));
        return updated;
      }
      return o;
    });
    setOrders(updatedOrders);
  };

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    const element = document.getElementById('preview-scaler');
    if (!element) return;
    const opt = { margin: 0, filename: `${appState.content.title || 'documento'}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, scrollX: 0 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: 'css' } };
    // @ts-ignore
    window.html2pdf().from(element).set(opt).save().finally(() => setIsDownloading(false));
  };

  const handleDownloadFromHistory = async (order: Order, forcedBlockType?: BlockType) => {
    if (!order.documentSnapshot) return;
    setIsDownloading(true);
    setSnapshotToDownload(order.documentSnapshot);
    setBlockTypeToDownload(forcedBlockType || order.blockType);
    setTimeout(async () => {
      const element = document.getElementById('background-preview-scaler');
      if (!element) return;
      const opt = { margin: 0, filename: `${order.title || 'documento'}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, scrollX: 0 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: 'css' } };
      // @ts-ignore
      await window.html2pdf().from(element).set(opt).save();
      setSnapshotToDownload(null);
      setBlockTypeToDownload(null);
      setIsDownloading(false);
    }, 500);
  };

  const handleDownloadLicitacaoStage = async () => {
    const { content } = appState;
    const viewIdx = content.viewingStageIndex ?? (content.currentStageIndex || 0);
    const stagesNames = ['Início', 'Etapa 01', 'Etapa 02', 'Etapa 03', 'Etapa 04', 'Etapa 05', 'Etapa 06'];
    const stageName = stagesNames[viewIdx] || 'Etapa';

    // Create a snapshot that only contains the target stage
    let stageContent = { ...content };

    if (viewIdx < (content.currentStageIndex || 0)) {
      // Viewing a historical stage
      const historicalStage = content.licitacaoStages?.[viewIdx];
      if (historicalStage) {
        stageContent = {
          ...content,
          body: historicalStage.body,
          signatureName: historicalStage.signatureName,
          signatureRole: historicalStage.signatureRole,
          signatureSector: historicalStage.signatureSector,
          licitacaoStages: [] // Mask history to show only this one
        };
      }
    } else {
      // Viewing current (in progress) stage
      stageContent = {
        ...content,
        licitacaoStages: [] // Mask history
      };
    }

    const tempSnapshot = {
      ...appState,
      content: stageContent
    };

    setIsDownloading(true);
    setSnapshotToDownload(tempSnapshot);
    setBlockTypeToDownload('licitacao');

    setTimeout(async () => {
      const element = document.getElementById('background-preview-scaler');
      if (!element) return;
      const opt = { margin: 0, filename: `${content.title || 'licitacao'}_${stageName}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, scrollX: 0 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: 'css' } };
      // @ts-ignore
      await window.html2pdf().from(element).set(opt).save();
      setSnapshotToDownload(null);
      setBlockTypeToDownload(null);
      setIsDownloading(false);
    }, 500);
  };

  const handleOpenAdmin = (tab?: string | null) => {
    setCurrentView('admin');
    setAdminTab(tab || null);
    setIsAdminSidebarOpen(true);
    setIsFinalizedView(false);
  };

  const handleLogout = async () => {
    await signOut();
    clearDraft(); // Clear draft on logout
    setCurrentView('login');
    setActiveBlock(null);
    setIsFinalizedView(false);
    setEditingOrder(null);
  };

  const handleGoHome = () => {
    if (currentView === 'editor' && !isFinalizedView) clearDraft(); // Clear draft if cancelling editor
    setCurrentView('home');
    setActiveBlock(null);
    setIsAdminSidebarOpen(false);
    setAdminTab(null);
    setIsFinalizedView(false);
    setEditingOrder(null);
  };

  const handleBackToModule = () => {
    // Only clear if we were in editor? handleBackToModule is usually for TrackingScreen/PurchaseManagement back button.
    // TrackingScreen is distinct from Editor. So no need to clear draft here usually.
    // But if we use it for generic back?
    // Let's assume it's for non-editor views.
    setCurrentView('home');
    // activeBlock is preserved
    setIsAdminSidebarOpen(false);
    setAdminTab(null);
    setIsFinalizedView(false);
    setEditingOrder(null);
  };



  // --- PERSISTENCE LOGIC START ---
  // Save draft to localStorage whenever content changes in editor mode
  useEffect(() => {
    if (currentView === 'editor' && !editingOrder && activeBlock) {
      const draftKey = `draft_${activeBlock}`;
      const draftData = {
        content: appState.content,
        timestamp: Date.now()
      };
      // Debounce saving if needed, but for now simple write is okay for text
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    }
  }, [appState.content, currentView, editingOrder, activeBlock]);

  // AUTO-SAVE FOR LICITACAO (DISABLED BY REQUEST)
  /*
  useEffect(() => {
    if (activeBlock === 'licitacao' && currentView === 'editor' && editingOrder) {
      const timer = setTimeout(() => {
        const orderToSave: Order = {
          ...editingOrder,
          title: appState.content.title,
          documentSnapshot: appState
        };
        licitacaoService.saveLicitacaoProcess(orderToSave).then(() => {
          console.log("Auto-saved licitacao process");
        }).catch(err => console.error("Auto-save failed", err));
      }, 2000); // 2 seconds debounce
  
      return () => clearTimeout(timer);
    }
  }, [appState, activeBlock, currentView, editingOrder]);
  */


  // Clear draft on successful finish or explicit exit
  const clearDraft = useCallback(() => {
    if (activeBlock) {
      localStorage.removeItem(`draft_${activeBlock}`);
    }
  }, [activeBlock]);
  // --- PERSISTENCE LOGIC END ---




  // MODIFIED handleStartEditing to check for drafts
  const handleStartEditing = async (blockOverride?: BlockType) => {
    const currentBlock = blockOverride || activeBlock;
    let defaultTitle = INITIAL_STATE.content.title;
    let defaultRightBlock = INITIAL_STATE.content.rightBlockText;
    let leftBlockContent = INITIAL_STATE.content.leftBlockText;
    const currentYear = new Date().getFullYear();

    // CHECK FOR DRAFT FIRST (Skip for Licitacao to always start fresh/auto-create)
    if (currentBlock && currentBlock !== 'licitacao') {
      const draftKey = `draft_${currentBlock}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          // Optional: Check timestamp expiry? For now keep it indefinitely until finished/cleared
          if (parsed && parsed.content) {
            setAppState(prev => {
              const mergedContent = {
                ...INITIAL_STATE.content,
                ...parsed.content
              };

              // Validate title for the current block to prevent leaks from drafts
              if (currentBlock === 'oficio' && (mergedContent.title?.includes('Diária') || mergedContent.title?.includes('Pedido'))) {
                mergedContent.title = 'Novo Ofício';
              } else if (currentBlock === 'compras' && (mergedContent.title?.includes('Ofício') || mergedContent.title?.includes('Diária'))) {
                mergedContent.title = 'Novo Pedido';
              } else if (currentBlock === 'diarias' && (mergedContent.title?.includes('Ofício') || mergedContent.title?.includes('Pedido'))) {
                mergedContent.title = 'Requisição de Diária';
              }

              return {
                ...prev,
                content: mergedContent
              };
            });

            // Explicitly set activeBlock to currentBlock to prevent race conditions
            if (activeBlock !== currentBlock) {
              setActiveBlock(currentBlock);
            }

            setCurrentView('editor');
            setAdminTab('content');
            setIsAdminSidebarOpen(true);
            setIsFinalizedView(false);
            setEditingOrder(null);
            return; // EXIT EARLY IF DRAFT RESTORED
          }
        } catch (e) {
          console.error("Error parsing draft", e);
        }
      }
    }

    if (currentBlock === 'compras') {
      defaultTitle = 'Novo Pedido';
      defaultRightBlock = 'Ao Departamento de Compras da\nPrefeitura de São José do Goiabal-MG';
    } else if (currentBlock === 'licitacao') {
      defaultTitle = 'PROCESSO LICITATÓRIO';
      defaultRightBlock = 'Ao Departamento de Licitação\nPrefeitura de São José do Goiabal - MG';
    } else if (currentBlock === 'diarias') {
      defaultTitle = 'Requisição de Diária';
    } else if (currentBlock === 'oficio') {
      defaultTitle = 'Novo Ofício';
    } else {
      // Fallback
      defaultTitle = INITIAL_STATE.content.title;
    }

    // Logic for Sector numbering (Unified for ALL blocks)
    // Always attempt to get a number if user has a sector
    if (currentUser?.sector) {
      const userSector = sectors.find(s => s.name === currentUser.sector);
      if (userSector) {
        const nextNum = await counterService.getNextSectorCount(userSector.id, currentYear);
        if (nextNum) {
          const formattedNum = nextNum.toString().padStart(3, '0');

          if (currentBlock === 'compras') {
            defaultTitle = 'Novo Pedido';
            leftBlockContent = `Ref: Requisição nº ${formattedNum}/${currentYear}`;
          } else if (currentBlock === 'diarias') {
            defaultTitle = `Solicitação de Diária nº ${formattedNum}/${currentYear}`;
            leftBlockContent = `Ref: Solicitação nº ${formattedNum}/${currentYear}`;
          } else if (currentBlock === 'licitacao') {
            // Assuming Licitacao also follows this pattern or has a specific title format using the number
            defaultTitle = `PROCESSO LICITATÓRIO`;
            leftBlockContent = `Ref: Processo nº ${formattedNum}/${currentYear}`;
          } else {
            // Default Oficio and fallback for others
            defaultTitle = `Novo Ofício`;
            const defaultLeftBlock = INITIAL_STATE.content.leftBlockText;
            const extraInfo = defaultLeftBlock.includes('\n') ? defaultLeftBlock.split('\n').slice(1).join('\n') : '';
            leftBlockContent = `Ref: Ofício nº ${formattedNum}/${currentYear}${extraInfo ? '\n' + extraInfo : ''}`;
          }
        }
      }
    }

    let defaultBody = INITIAL_STATE.content.body;
    if (currentBlock !== 'oficio') {
      defaultBody = '';
    }

    // Consolidate state update to prevent multiple renders and UI/Branding loss
    setAppState(prev => {
      const newContent = {
        ...INITIAL_STATE.content,
        title: defaultTitle,
        rightBlockText: defaultRightBlock,
        leftBlockText: leftBlockContent,
        body: defaultBody,
      };

      // Special handling for Licitação defaults
      if (currentBlock === 'licitacao') {
        newContent.protocol = ''; // Empty to trigger Auto-Suggestion
        newContent.currentStageIndex = 0;
        newContent.licitacaoStages = [];
      }

      return {
        ...prev,
        content: newContent,
        document: {
          ...prev.document,
          showSignature: INITIAL_STATE.document.showSignature
        }
      };
    });

    if (currentBlock === 'licitacao') {
      setEditingOrder(null);
      setIsLicitacaoSettingsOpen(true);
    } else {
      setEditingOrder(null);
    }

    // Explicitly set activeBlock to currentBlock to prevent race conditions with component effects
    if (activeBlock !== currentBlock) {
      setActiveBlock(currentBlock);
    }

    setCurrentView('editor');
    setAdminTab('content');
    setIsAdminSidebarOpen(true);
    setIsFinalizedView(false);
  };

  // Effect to initialize editor if accessed directly via URL
  useEffect(() => {
    if (currentView === 'editor' && !editingOrder && !appState.content.protocol && currentUser && sectors.length > 0) {
      if (activeBlock) {
        handleStartEditing(activeBlock);
      }
    }
  }, [currentView, activeBlock, currentUser, sectors.length]);

  // Ensure viewingStageIndex is synced when entering Licitação or changing stages
  useEffect(() => {
    if (activeBlock === 'licitacao' && appState.content.currentStageIndex !== undefined) {
      // Only if viewingStageIndex is undefined, set it to current
      if (appState.content.viewingStageIndex === undefined) {
        setAppState(prev => ({
          ...prev,
          content: { ...prev.content, viewingStageIndex: prev.content.currentStageIndex }
        }));
      }
    }
  }, [activeBlock, appState.content.currentStageIndex]);



  const handleTrackOrder = () => {
    // Determine which orders to show based on activeBlock
    if (activeBlock === 'compras') {
      setOrders(purchaseOrders);
    } else if (activeBlock === 'diarias') {
      setOrders(serviceRequests);
    } else {
      setOrders(oficios);
    }
    setCurrentView('tracking');
  };

  const handleViewAllLicitacao = () => {
    setOrders(licitacaoProcesses);
    setActiveBlock('licitacao');
    setCurrentView('licitacao-all');
  };

  const handleManagePurchaseOrders = () => {
    setOrders(purchaseOrders);
    setCurrentView('purchase-management');
  };

  // Helper for self-updates or other minor updates
  const handleUpdateUserInApp = async (u: User) => {
    const { error } = await supabase.from('profiles').update({
      name: u.name,
      username: u.username,
      role: u.role,
      sector: u.sector,
      job_title: u.jobTitle,
      email: u.email,
      whatsapp: u.whatsapp,
      allowed_signature_ids: u.allowedSignatureIds,
      permissions: u.permissions,
      temp_password: u.tempPassword,
      temp_password_expires_at: u.tempPasswordExpiresAt,
      two_factor_enabled: u.twoFactorEnabled,
      two_factor_secret: u.twoFactorSecret,
      two_factor_enabled_2: u.twoFactorEnabled2,
      two_factor_secret_2: u.twoFactorSecret2
    }).eq('id', u.id);

    if (u.password) {
      await supabase.rpc('update_user_password', { user_id: u.id, new_password: u.password });
    }

    if (error) {
      console.error("Error updating user:", error);
      alert("Erro ao atualizar: " + error.message);
    } else {
      setUsers(p => p.map(us => us.id === u.id ? u : us));
      if (currentUser && currentUser.id === u.id) {
        await refreshUser();
      }
    }
  };

  if (currentView === 'login') return <LoginScreen onLogin={handleLogin} uiConfig={appState.ui} />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans flex-col">
      <ToastNotification
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
      {currentUser && <AppHeader currentUser={currentUser} uiConfig={appState.ui} activeBlock={activeBlock} onLogout={handleLogout} onOpenAdmin={handleOpenAdmin} onGoHome={handleGoHome} currentView={currentView} isRefreshing={isRefreshing} onRefresh={refreshData} />}
      <div className="flex-1 flex relative overflow-hidden">
        {currentView === 'home' && currentUser && <HomeScreen onNewOrder={handleStartEditing} onViewAllLicitacao={handleViewAllLicitacao} onTrackOrder={handleTrackOrder} onManagePurchaseOrders={handleManagePurchaseOrders} onManageLicitacaoScreening={() => setCurrentView('licitacao-screening')} onVehicleScheduling={() => setCurrentView('vehicle-scheduling')} onLogout={handleLogout} onOpenAdmin={handleOpenAdmin} userRole={currentUser.role} userName={currentUser.name} permissions={currentUser.permissions} activeBlock={activeBlock} setActiveBlock={setActiveBlock} stats={{ totalGenerated: globalCounter, historyCount: orders.length, activeUsers: users.length }} onAbastecimento={(sub) => {
          setAppState(prev => ({ ...prev, view: sub }));
          setCurrentView('abastecimento');
          const path = `abastecimento:${sub}`;
          if (VIEW_TO_PATH[path]) {
            window.history.pushState({}, '', VIEW_TO_PATH[path]);
          }
        }} />}
        {(currentView === 'editor' || currentView === 'admin') && currentUser && (
          <div className="flex-1 flex flex-col overflow-hidden h-full relative">
            {/* GLOBAL STEPPER FOR LICITACAO */}
            {activeBlock === 'licitacao' && currentView === 'editor' && !isFinalizedView && (
              <div className="w-full bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between shrink-0 shadow-sm z-30 relative">
                {/* Settings Button */}
                <button
                  onClick={() => setIsLicitacaoSettingsOpen(true)}
                  className="mr-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors border border-transparent hover:border-slate-200"
                  title="Configurações do Processo"
                >
                  <Settings className="w-5 h-5" />
                </button>

                {/* Stepper Component */}
                <div className="flex-1 mr-8">
                  <ProcessStepper
                    steps={['Início', 'Etapa 01', 'Etapa 02', 'Etapa 03', 'Etapa 04', 'Etapa 05', 'Etapa 06']}
                    currentStep={appState.content.viewingStageIndex ?? (appState.content.currentStageIndex || 0)}
                    maxCompletedStep={(appState.content.currentStageIndex || 0) - 1}
                    onStepClick={(idx) => {
                      // Restrict stepper navigation: Only Admin or Licitacao
                      // if (currentUser.role !== 'admin' && currentUser.role !== 'licitacao') {
                      //   alert("Acesso restrito. Apenas Administradores e Usuários da Licitação podem navegar pelo histórico.");
                      //   return;
                      // }

                      // NEW: Lock stepper if restricted (e.g. Meus Processos)
                      if (isStepperLocked) {
                        showToast("Acesso restrito à etapa Início", "warning");
                        return;
                      }

                      // STRICT NAVIGATION GUARD: Block access to future stages if not reached yet
                      if (activeBlock === 'licitacao') {
                        const currentIdx = appState.content.currentStageIndex || 0;
                        if (idx > currentIdx) {
                          setConfirmModal({
                            isOpen: true,
                            title: "Acesso Bloqueado",
                            message: "Você ainda não atingiu esta etapa do processo.",
                            type: 'error',
                            singleButton: true,
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                          });
                          return;
                        }
                      }

                      setAppState(prev => {
                        const currentIdx = prev.content.currentStageIndex || 0;
                        const oldViewIdx = prev.content.viewingStageIndex ?? currentIdx;
                        let newContent = { ...prev.content };

                        // 1. If we were on the ACTIVE stage, save the current text as the "active draft"
                        if (oldViewIdx === currentIdx) {
                          newContent.licitacaoActiveDraft = {
                            body: prev.content.body,
                            signatureName: prev.content.signatureName,
                            signatureRole: prev.content.signatureRole,
                            signatureSector: prev.content.signatureSector,
                            signatures: prev.content.signatures || []
                          };
                        }

                        // 2. Load content for the target stage
                        if (idx < currentIdx) {
                          const hist = prev.content.licitacaoStages?.[idx];
                          if (hist) {
                            newContent.body = hist.body || '';
                            newContent.signatureName = hist.signatureName || '';
                            newContent.signatureRole = hist.signatureRole || '';
                            newContent.signatureSector = hist.signatureSector || '';
                            newContent.signatures = hist.signatures || [];
                          }
                        } else if (idx === currentIdx) {
                          // Moving to current active stage - restore draft
                          newContent.body = prev.content.licitacaoActiveDraft?.body || '';
                          newContent.signatureName = prev.content.licitacaoActiveDraft?.signatureName || '';
                          newContent.signatureRole = prev.content.licitacaoActiveDraft?.signatureRole || '';
                          newContent.signatureSector = prev.content.licitacaoActiveDraft?.signatureSector || '';
                          newContent.signatures = prev.content.licitacaoActiveDraft?.signatures || [];
                        }

                        return { ...prev, content: { ...newContent, viewingStageIndex: idx } };
                      });
                    }}
                    filledSteps={Array(7).fill(0).map((_, i) => {
                      // Logic to determine if a stage is "filled"
                      const hist = appState.content.licitacaoStages?.[i];
                      const isCurrent = i === (appState.content.currentStageIndex || 0);

                      let body = '';
                      let hasSig = false;

                      if (isCurrent) {
                        // Check active content
                        body = appState.content.body;
                        hasSig = !!appState.content.signatureName || (appState.content.signatures && appState.content.signatures.length > 0);
                      } else if (hist) {
                        body = hist.body || '';
                        hasSig = !!hist.signatureName || (hist.signatures && hist.signatures.length > 0);
                      }

                      const hasContent = body && body.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;
                      return !!(hasContent || hasSig);
                    })}
                  />
                </div>



                {/* Action Buttons for Licitacao Steps */}
                {/* CHECK FOR COMPLETED STATE */}
                {(() => {
                  // Only if we are in completed state (Stage > 6) AND NOT reopening editing
                  const isLicitacaoCompleted = activeBlock === 'licitacao' && (appState.content.currentStageIndex || 0) > 6;

                  if (activeBlock === 'licitacao' && isLicitacaoCompleted && !isReopeningStage) {
                    return (
                      <div className="flex items-center gap-1.5 ml-2">
                        {/* REOPEN EDIT BUTTON */}
                        <button
                          onClick={() => {
                            setIsReopeningStage(true);
                            setIsAdminSidebarOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
                          title="Editar Etapa"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">EDITAR</span>
                        </button>

                        {/* DOWNLOAD FULL PDF BUTTON */}
                        <button
                          onClick={handleDownloadPdf}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap bg-slate-900 text-white hover:bg-slate-800"
                          title="Baixar PDF Completo"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">PDF</span>
                        </button>

                        {/* CLOSE BUTTON */}
                        <button
                          onClick={() => {
                            setActiveBlock('licitacao');
                            const targetView = (lastListView === 'licitacao-all' || lastListView === 'licitacao-screening') ? lastListView : 'tracking';
                            setCurrentView(targetView);
                            setEditingOrder(null);
                            setIsFinalizedView(false);
                            setIsAdminSidebarOpen(false);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                          title="Fechar Visualização"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>FECHAR</span>
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* STANDARD BUTTONS (Save, Voltar, Concluir) - HIDE IF COMPLETED AND NOT REOPENING */}
                {!(activeBlock === 'licitacao' && (appState.content.currentStageIndex || 0) > 6 && !isReopeningStage) && (
                  <div className="flex items-center gap-4">
                    {/* SAVE BUTTON */}
                    {(() => {
                      const { content } = appState;
                      const isStage0Sent = activeBlock === 'licitacao' &&
                        (content.viewingStageIndex === 0) &&
                        editingOrder?.status && editingOrder.status !== 'pending';

                      if (isStage0Sent) return null;

                      return (
                        <button
                          onClick={async () => {
                            const { content } = appState;
                            const currentIdx = content.currentStageIndex || 0;
                            const viewIdx = content.viewingStageIndex ?? currentIdx;
                            const stagesNames = ['Início', 'Etapa 01', 'Etapa 02', 'Etapa 03', 'Etapa 04', 'Etapa 05', 'Etapa 06'];

                            // Logic to Update State WITHOUT Advancing
                            let updatedStages = [...(content.licitacaoStages || [])];

                            const currentStageData = {
                              id: Date.now().toString(),
                              title: stagesNames[viewIdx],
                              body: content.body,
                              signatureName: content.signatureName,
                              signatureRole: content.signatureRole,
                              signatureSector: content.signatureSector,
                              signatures: content.signatures || []
                            };

                            updatedStages[viewIdx] = currentStageData;

                            // Also update draft if we are on the active tip
                            let nextActiveDraft = content.licitacaoActiveDraft;
                            if (viewIdx === currentIdx) {
                              nextActiveDraft = {
                                body: content.body,
                                signatureName: content.signatureName,
                                signatureRole: content.signatureRole,
                                signatureSector: content.signatureSector,
                                signatures: content.signatures || []
                              };
                            }

                            const nextAppState = {
                              ...appState,
                              content: {
                                ...content,
                                licitacaoStages: updatedStages,
                                licitacaoActiveDraft: nextActiveDraft
                              }
                            };

                            let orderToSave = editingOrder;
                            if (!orderToSave) {
                              try {
                                if (activeBlock === 'licitacao') {
                                  const year = new Date().getFullYear();
                                  orderToSave = {
                                    id: Date.now().toString(),
                                    protocol: content.protocol,
                                    title: content.title,
                                    status: 'pending',
                                    priority: 'normal',
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString(),
                                    userId: currentUser.id,
                                    userName: currentUser.name,
                                    type: activeBlock,
                                    blockType: activeBlock,
                                    documentSnapshot: nextAppState,
                                    sector: currentUser.sector
                                  } as Order;

                                  await counterService.incrementLicitacaoProtocolCount(year);
                                  const reqSectorName = content.requesterSector || currentUser?.sector;
                                  const reqSector = sectors.find(s => s.name === reqSectorName || s.id === reqSectorName);
                                  const targetSectorId = reqSector?.id || '23c6fa21-f998-4f54-b865-b94212f630ef';
                                  await counterService.incrementSectorCount(targetSectorId, year);
                                }
                              } catch (e) { console.error(e); }
                            } else {
                              orderToSave = {
                                ...orderToSave,
                                updatedAt: new Date().toISOString(),
                                documentSnapshot: nextAppState
                              };
                            }

                            try {
                              if (activeBlock === 'licitacao') {
                                if (orderToSave.status === 'approved') {
                                  orderToSave.status = 'in_progress';
                                }
                                await licitacaoService.saveLicitacaoProcess(orderToSave!);
                              }
                              // else ... others not handled here as this is Licitacao context

                              setEditingOrder(orderToSave!);
                              setAppState(nextAppState);
                              setShowSaveSuccess(true);
                              setTimeout(() => setShowSaveSuccess(false), 2000);
                            } catch (err) {
                              console.error("Error saving stage", err);
                              alert("Erro ao salvar etapa.");
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap min-w-fit bg-emerald-600 hover:bg-emerald-700 text-white"
                          title="Salvar Alterações"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">SALVAR</span>
                        </button>
                      );
                    })()}

                    {/* ADVANCE / FINISH BUTTON - Only show if NOT history */}
                    {(() => {
                      const { content } = appState;
                      const currentIdx = content.currentStageIndex || 0;
                      const viewIdx = content.viewingStageIndex ?? currentIdx;

                      // HIDE BUTTON IF VIEWING HISTORY
                      if (viewIdx < currentIdx) return null;

                      return (
                        <button
                          onClick={() => {
                            // Finalize action for the LAST stage
                            if (currentIdx >= 6) {
                              setConfirmModal({
                                isOpen: true,
                                title: "Finalizar Processo",
                                message: "Deseja concluir a última etapa e finalizar a edição do processo?",
                                type: 'info',
                                onConfirm: () => {
                                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                  handleFinish();
                                }
                              });
                              return;
                            }

                            // For intermediate stages
                            setConfirmModal({
                              isOpen: true,
                              title: "Concluir Etapa",
                              message: "O processo avançará para a próxima etapa. Deseja continuar?",
                              type: 'info',
                              onConfirm: async () => {
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));

                                const executeAdvance = async (metadata?: any) => {
                                  // Advance Logic
                                  const stagesNames = ['Início', 'Etapa 01', 'Etapa 02', 'Etapa 03', 'Etapa 04', 'Etapa 05', 'Etapa 06'];
                                  const currentStageData = {
                                    id: Date.now().toString(),
                                    title: stagesNames[currentIdx],
                                    body: content.body,
                                    signatureName: content.signatureName,
                                    signatureRole: content.signatureRole,
                                    signatureSector: content.signatureSector,
                                    signatures: content.signatures || []
                                  };

                                  let newHistoric = [...(content.licitacaoStages || [])];
                                  newHistoric[currentIdx] = currentStageData;

                                  const nextAppState = {
                                    ...appState,
                                    content: {
                                      ...appState.content,
                                      licitacaoStages: newHistoric,
                                      currentStageIndex: currentIdx + 1,
                                      viewingStageIndex: currentIdx + 1,
                                      body: '',
                                      signatureName: '',
                                      signatureRole: '',
                                      signatureSector: '',
                                      signatures: [],
                                      licitacaoActiveDraft: undefined,
                                      // Update digitalSignature if metadata provided (e.g. from 2FA) AND it's Stage 0
                                      ...(metadata && currentIdx === 0 ? { digitalSignature: metadata } : {})
                                    }
                                  };

                                  // Save & Advance
                                  let orderToSave = editingOrder;
                                  if (!orderToSave) {
                                    try {
                                      const year = new Date().getFullYear();
                                      orderToSave = {
                                        id: Date.now().toString(),
                                        protocol: content.protocol,
                                        title: content.title,
                                        status: 'pending',
                                        priority: 'normal',
                                        createdAt: new Date().toISOString(),
                                        updatedAt: new Date().toISOString(),
                                        userId: currentUser.id,
                                        userName: currentUser.name,
                                        type: activeBlock,
                                        blockType: activeBlock,
                                        documentSnapshot: nextAppState,
                                        sector: currentUser.sector
                                      } as Order;

                                      if (activeBlock === 'licitacao') {
                                        await counterService.incrementLicitacaoProtocolCount(year);
                                        const reqSectorName = content.requesterSector || currentUser?.sector;
                                        const reqSector = sectors.find(s => s.name === reqSectorName || s.id === reqSectorName);
                                        const targetSectorId = reqSector?.id || '23c6fa21-f998-4f54-b865-b94212f630ef';
                                        await counterService.incrementSectorCount(targetSectorId, year);
                                      } else {
                                        const nextVal = await db.incrementGlobalCounter();
                                        setGlobalCounter(nextVal);
                                      }
                                    } catch (e) { console.error(e) }
                                  } else {
                                    orderToSave = { ...orderToSave, updatedAt: new Date().toISOString(), documentSnapshot: nextAppState };
                                  }

                                  if (activeBlock === 'licitacao' && orderToSave?.status === 'approved') {
                                    orderToSave.status = 'in_progress';
                                  }

                                  try {
                                    await licitacaoService.saveLicitacaoProcess(orderToSave!);
                                    setEditingOrder(orderToSave!);
                                    setAppState(nextAppState);

                                    if (currentIdx === 0) {
                                      setConfirmModal({
                                        isOpen: true,
                                        title: "Etapa Início Concluída",
                                        message: "O conteúdo foi salvo. Para prosseguir, acesse 'Meus Processos' e clique em 'Enviar' para encaminhar o processo para a Triagem.",
                                        type: 'info',
                                        singleButton: true,
                                        onConfirm: () => { setConfirmModal(prev => ({ ...prev, isOpen: false })); setActiveBlock('licitacao'); setCurrentView('tracking'); }
                                      });
                                    }
                                  } catch (err) {
                                    console.error("Failed to save", err);
                                    alert("Erro ao avançar etapa.");
                                  }
                                };

                                // 2FA Check for Stage 0 (Início)
                                if (currentIdx === 0 && content.useDigitalSignature) {
                                  const signerName = content.signatureName;
                                  const signerRole = content.signatureRole;
                                  const signerUser = users.find(u => u.name === signerName && (u.jobTitle === signerRole || u.role === 'admin'));

                                  if (signerUser && (signerUser.twoFactorEnabled || signerUser.twoFactorEnabled2)) {
                                    setTwoFASecret(signerUser.twoFactorEnabled ? (signerUser.twoFactorSecret || '') : '');
                                    setTwoFASecret2(signerUser.twoFactorEnabled2 ? (signerUser.twoFactorSecret2 || null) : null);
                                    setTwoFASignatureName(signerUser.name);
                                    setPending2FAAction(() => executeAdvance);
                                    setIs2FAModalOpen(true);
                                    return;
                                  }
                                }

                                await executeAdvance();
                              }
                            });
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap min-w-fit ${currentIdx === 6 ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                          title={currentIdx === 6 ? "Finalizar Processo" : "Concluir Etapa"}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">CONCLUIR</span>
                        </button>
                      );
                    })()}

                    {/* FECHAR BUTTON (Formerly Voltar) - Always show if viewing existing */}
                    {activeBlock === 'licitacao' && (
                      <button
                        onClick={() => {
                          setActiveBlock('licitacao');
                          // Simple close/return
                          const targetView = (lastListView === 'licitacao-all' || lastListView === 'licitacao-screening') ? lastListView : 'tracking';
                          setCurrentView(targetView);
                          setEditingOrder(null);
                          setIsFinalizedView(false);
                          setIsAdminSidebarOpen(false);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap min-w-fit bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                        title="Fechar Visualização"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">FECHAR</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 flex overflow-hidden h-full relative">
              {(() => {
                const isLicitacaoCompleted = activeBlock === 'licitacao' && (appState.content.currentStageIndex || 0) > 6;
                // You can also check editingOrder?.status === 'completed' if you want it tied to approval vs local step

                // ALSO HIDE IF VIEWING STAGE 0 AND STATUS IS NOT PENDING (SENT)
                const isStage0Sent = activeBlock === 'licitacao' &&
                  (appState.content.viewingStageIndex === 0) &&
                  editingOrder?.status && editingOrder.status !== 'pending';

                if ((isLicitacaoCompleted && !isReopeningStage) || isStage0Sent) return null;

                return !isFinalizedView && adminTab !== 'fleet' && adminTab !== '2fa' && adminTab !== 'users' && adminTab !== 'entities' && (currentView !== 'admin' || adminTab !== null) && (
                  <AdminSidebar
                    state={appState}
                    onUpdate={setAppState}
                    onPrint={() => window.print()}
                    isOpen={isAdminSidebarOpen}
                    onClose={() => { if (currentView === 'editor') { setIsFinalizedView(true); setIsAdminSidebarOpen(false); } else { setIsAdminSidebarOpen(false); } }}
                    isDownloading={isDownloading}
                    currentUser={currentUser}
                    mode={currentView === 'admin' ? 'admin' : 'editor'}
                    onSaveDefault={async () => { await settingsService.saveGlobalSettings(appState); await db.saveGlobalSettings(appState); }}
                    onFinish={handleFinish} activeTab={adminTab} onTabChange={setAdminTab} availableSignatures={myAvailableSignatures} activeBlock={activeBlock} persons={persons} sectors={sectors} jobs={jobs}
                    onBack={() => { if (currentView === 'editor') setCurrentView('home'); }}
                    isReadOnly={isStepperLocked || (activeBlock === 'licitacao' ? (editingOrder?.status === 'completed' && !isReopeningStage) : (editingOrder?.status === 'approved' || editingOrder?.status === 'completed'))}
                    orderStatus={editingOrder?.status}
                  />
                )
              })()}
              <main className="flex-1 h-full overflow-hidden flex flex-col relative bg-slate-50">
                {currentView === 'admin' && adminTab === null ? (
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <AdminDashboard
                      currentUser={currentUser}
                      onTabChange={(tab) => setAdminTab(tab)}
                      onBack={handleGoHome}
                    />
                  </div>
                ) : currentView === 'admin' && adminTab === 'users' ? (
                  <UserManagementScreen
                    users={users}
                    currentUser={currentUser}
                    onAddUser={async (u) => {
                      // Prepare user data for Supabase
                      const email = u.username.includes('@') ? u.username : `${u.username}@projeto.local`;
                      const userData = {
                        ...u,
                        jobTitle: u.jobTitle,
                        allowedSignatureIds: u.allowedSignatureIds,
                        twoFactorEnabled: false
                      };

                      const { data: newId, error } = await supabase.rpc('create_user_admin', {
                        email: email,
                        password: u.password || '12345678', // Default if missing, though UI enforces it
                        user_data: userData
                      });

                      if (error) {
                        console.error("Error creating user:", error);
                        alert("Erro ao criar usuário: " + error.message);
                      } else {
                        // Refresh users
                        const { data: refreshed } = await supabase.from('profiles').select('*');
                        if (refreshed) {
                          const mapped = refreshed.map((ru: any) => ({
                            id: ru.id,
                            username: ru.username,
                            name: ru.name,
                            role: ru.role,
                            sector: ru.sector,
                            jobTitle: ru.job_title,
                            email: ru.email,
                            whatsapp: ru.whatsapp,
                            allowedSignatureIds: ru.allowed_signature_ids,
                            permissions: ru.permissions,
                            tempPassword: ru.temp_password,
                            tempPasswordExpiresAt: ru.temp_password_expires_at,
                            twoFactorEnabled: ru.two_factor_enabled,
                            twoFactorSecret: ru.two_factor_secret
                          }));
                          setUsers(mapped);
                        }
                      }
                    }}
                    onUpdateUser={handleUpdateUserInApp}
                    onDeleteUser={async (id) => {
                      const { error } = await supabase.rpc('delete_user_admin', { user_id: id });
                      if (error) {
                        console.error("Error deleting user:", error);
                        alert("Erro ao deletar: " + error.message);
                      } else {
                        setUsers(p => p.filter(u => u.id !== id));
                      }
                    }}
                    availableSignatures={allSignatures}
                    jobs={jobs}
                    sectors={sectors}
                    persons={persons}
                    onBack={() => setAdminTab(null)}
                  />
                ) : currentView === 'admin' && adminTab === '2fa' ? (
                  <TwoFactorAuthScreen
                    currentUser={currentUser}
                    onUpdateUser={(u) => {
                      handleUpdateUserInApp(u);
                      // Also update local current user state if needed
                    }}
                    onBack={() => setAdminTab(null)}
                  />
                ) : currentView === 'admin' && adminTab === 'entities' ? (
                  <EntityManagementScreen
                    persons={persons}
                    sectors={sectors}
                    jobs={jobs}
                    onAddPerson={async p => {
                      const newPerson = await entityService.createPerson(p);
                      if (newPerson) setPersons(prev => [...prev, newPerson]);
                      else alert('Erro ao criar pessoa');
                    }}
                    onUpdatePerson={async p => {
                      const updated = await entityService.updatePerson(p);
                      if (updated) setPersons(prev => prev.map(x => x.id === p.id ? updated : x));
                      else alert('Erro ao atualizar pessoa');
                    }}
                    onDeletePerson={async id => {
                      const success = await entityService.deletePerson(id);
                      if (success) setPersons(prev => prev.filter(x => x.id !== id));
                      else alert('Erro ao deletar pessoa');
                    }}
                    onAddSector={async s => {
                      const newSector = await entityService.createSector(s);
                      if (newSector) setSectors(prev => [...prev, newSector]);
                      else alert('Erro ao criar setor');
                    }}
                    onUpdateSector={async s => {
                      const updated = await entityService.updateSector(s);
                      if (updated) setSectors(prev => prev.map(x => x.id === s.id ? updated : x));
                      else alert('Erro ao atualizar setor');
                    }}
                    onDeleteSector={async id => {
                      const success = await entityService.deleteSector(id);
                      if (success) setSectors(prev => prev.filter(x => x.id !== id));
                      else alert('Erro ao deletar setor');
                    }}
                    onAddJob={async j => {
                      const newJob = await entityService.createJob(j);
                      if (newJob) setJobs(prev => [...prev, newJob]);
                      else alert('Erro ao criar cargo');
                    }}
                    onUpdateJob={async j => {
                      const updated = await entityService.updateJob(j);
                      if (updated) setJobs(prev => prev.map(x => x.id === j.id ? updated : x));
                      else alert('Erro ao atualizar cargo');
                    }}
                    onDeleteJob={async id => {
                      const success = await entityService.deleteJob(id);
                      if (success) setJobs(prev => prev.filter(x => x.id !== id));
                      else alert('Erro ao deletar cargo');
                    }}
                    onBack={() => setAdminTab(null)}
                  />

                ) : currentView === 'admin' && adminTab === 'fleet' ? (
                  <FleetManagementScreen
                    vehicles={vehicles}
                    sectors={sectors}
                    persons={persons}
                    jobs={jobs}
                    brands={brands}
                    onAddVehicle={async v => {
                      const newV = await entityService.createVehicle(v);
                      if (newV) setVehicles(p => [...p, newV]);
                      else alert("Erro ao criar veículo");
                    }}
                    onUpdateVehicle={async v => {
                      const updated = await entityService.updateVehicle(v);
                      if (updated) setVehicles(p => p.map(vi => vi.id === v.id ? updated : vi));
                      else alert("Erro ao atualizar veículo");
                    }}
                    onDeleteVehicle={async id => {
                      const success = await entityService.deleteVehicle(id);
                      if (success) setVehicles(p => p.filter(v => v.id !== id));
                      else alert("Erro ao deletar veículo");
                    }}
                    onAddBrand={async b => {
                      const newB = await entityService.createBrand(b);
                      if (newB) setBrands(p => [...p, newB]);
                      else alert("Erro ao criar marca");
                    }}
                    onBack={handleGoHome}
                  />
                ) : currentView === 'admin' && adminTab === 'ui' ? (
                  <UIPreviewScreen ui={appState.ui} />
                ) : currentView === 'admin' && adminTab === 'design' ? (
                  <AdminDocumentPreview state={appState} />
                ) : (
                  <DocumentPreview ref={componentRef} state={appState} isGenerating={isDownloading} mode={currentView === 'admin' ? 'admin' : 'editor'} blockType={activeBlock} />
                )}

                {/* COMPACT FLOATING STAGE DOWNLOAD BUTTON FOR LICITACAO */}
                {activeBlock === 'licitacao' && currentView === 'editor' && !isFinalizedView && (() => {
                  const viewIdx = appState.content.viewingStageIndex ?? (appState.content.currentStageIndex || 0);
                  const isHistory = viewIdx < (appState.content.currentStageIndex || 0);
                  const hasHistoricData = isHistory && appState.content.licitacaoStages?.[viewIdx];
                  const hasActiveData = !isHistory && appState.content.body && appState.content.body.replace(/<[^>]*>?/gm, '').trim() !== '';

                  // Only show if there is actually content to download
                  if (!hasHistoricData && !hasActiveData) return null;

                  return (
                    <div className="absolute top-24 right-8 z-[70] flex flex-col items-end gap-2 pointer-events-none group">
                      <button
                        onClick={handleDownloadLicitacaoStage}
                        title={`Baixar PDF: ${['Início', 'Etapa 01', 'Etapa 02', 'Etapa 03', 'Etapa 04', 'Etapa 05', 'Etapa 06'][viewIdx]}`}
                        className="group pointer-events-auto flex items-center gap-3 bg-white/40 hover:bg-white backdrop-blur-xl p-2 pr-4 rounded-full shadow-lg border border-white/50 transition-all duration-300 hover:shadow-indigo-500/20 hover:-translate-y-1 active:scale-95"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-md group-hover:rotate-12 transition-transform">
                          <Download className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col items-start leading-none gap-0.5">
                          <span className="text-slate-900 font-extrabold text-[10px] uppercase tracking-tighter">Baixar Etapa</span>
                          <span className="text-blue-600 text-[9px] font-black uppercase tracking-widest opacity-80">
                            {['Início', 'Etapa 01', 'Etapa 02', 'Etapa 03', 'Etapa 04', 'Etapa 05', 'Etapa 06'][viewIdx]}
                          </span>
                        </div>
                      </button>
                      <div className="bg-slate-900/10 backdrop-blur-sm text-slate-500 text-[8px] uppercase tracking-[0.2em] font-black px-3 py-1 rounded-full border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none">
                        Ação Rápida
                      </div>
                    </div>
                  );
                })()}
                {isFinalizedView && (
                  <FinalizedActionBar
                    onDownload={handleDownloadPdf}
                    onBack={handleGoHome}
                    onEdit={() => { setIsFinalizedView(false); setIsAdminSidebarOpen(true); }}
                    onSend={handleSendOrder}
                    showSendButton={activeBlock === 'compras'}
                    isDownloading={isDownloading}
                    documentTitle={appState.content.title}
                    onToggleDigitalSignature={() => {
                      setAppState(prev => ({
                        ...prev,
                        content: {
                          ...prev.content,
                          digitalSignature: {
                            ...prev.content.digitalSignature!,
                            enabled: !prev.content.digitalSignature?.enabled
                          }
                        }
                      }));
                    }}
                    isDigitalSignatureVisible={!!appState.content.digitalSignature?.enabled}
                    hasDigitalSignature={!!appState.content.digitalSignature}
                  />
                )}
              </main>
            </div>
          </div>
        )}
        {/* Abastecimento Module */}
        {currentView === 'abastecimento' && appState.view === 'new' && (
          <AbastecimentoForm
            onBack={() => {
              setCurrentView('home');
              setActiveBlock('abastecimento');
              window.history.pushState({}, '', '/PaginaInicial');
            }}
            onSave={(data) => {
              console.log('Abastecimento salvo:', data);
              showToast('Abastecimento registrado com sucesso!', 'success');
              setCurrentView('home');
              setActiveBlock('abastecimento');
            }}
          />
        )}

        {currentView === 'abastecimento' && appState.view === 'management' && (
          <AbastecimentoList
            onBack={() => {
              setCurrentView('home');
              setActiveBlock('abastecimento');
              window.history.pushState({}, '', '/PaginaInicial');
            }}
          />
        )}

        {currentView === 'abastecimento' && appState.view === 'dashboard' && (
          <AbastecimentoDashboard
            onBack={() => {
              setCurrentView('home');
              setActiveBlock('abastecimento');
              window.history.pushState({}, '', '/PaginaInicial');
            }}
            onAbastecimento={(sub) => {
              setAppState(prev => ({ ...prev, view: sub }));
              setCurrentView('abastecimento');
              const path = `abastecimento:${sub}`;
              if (VIEW_TO_PATH[path]) {
                window.history.pushState({}, '', VIEW_TO_PATH[path]);
              }
            }}
          />
        )}

        {currentView === 'tracking' && currentUser && (
          <TrackingScreen
            onBack={handleBackToModule}
            currentUser={currentUser}
            activeBlock={activeBlock}
            orders={orders}
            onDownloadPdf={(snapshot, forcedBlockType) => { const order = orders.find(o => o.documentSnapshot === snapshot); if (order) handleDownloadFromHistory(order, forcedBlockType); }}
            onClearAll={() => setOrders([])}
            onEditOrder={handleEditOrder}
            onDeleteOrder={async (id) => {
              if (activeBlock === 'compras') {
                await comprasService.deletePurchaseOrder(id);
                setPurchaseOrders(p => p.filter(o => o.id !== id));
                setOrders(p => p.filter(o => o.id !== id));
              } else if (activeBlock === 'diarias') {
                await diariasService.deleteServiceRequest(id);
                setServiceRequests(p => p.filter(o => o.id !== id));
                setOrders(p => p.filter(o => o.id !== id));
              } else if (activeBlock === 'licitacao') {
                await licitacaoService.deleteLicitacaoProcess(id);
                setLicitacaoProcesses(p => p.filter(o => o.id !== id));
                setOrders(p => p.filter(o => o.id !== id));
              } else {
                await oficiosService.deleteOficio(id);
                setOficios(p => p.filter(o => o.id !== id));
                setOrders(p => p.filter(o => o.id !== id));
              }
            }}
            onUpdateAttachments={handleUpdateOrderAttachments}
            totalCounter={globalCounter}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
            onUpdateOrderStatus={async (id, status) => {
              if (activeBlock === 'licitacao') {
                // Optimistic update
                setLicitacaoProcesses(p => p.map(o => o.id === id ? { ...o, status } : o));
                setOrders(p => p.map(o => o.id === id ? { ...o, status } : o));

                // Persist
                // We need to implement updateStatus in licitacaoService if not exists, or update the whole object
                // Let's assume we can update the whole object for now or find the object
                const order = licitacaoProcesses.find(o => o.id === id);
                if (order) {
                  await licitacaoService.saveLicitacaoProcess({ ...order, status });
                }
              }
            }}
          />
        )}
        {currentView === 'licitacao-all' && currentUser && (
          <TrackingScreen
            onBack={handleBackToModule}
            currentUser={currentUser}
            activeBlock={activeBlock}
            orders={orders}
            showAllProcesses={true}
            onDownloadPdf={(snapshot, forcedBlockType) => { const order = orders.find(o => o.documentSnapshot === snapshot); if (order) handleDownloadFromHistory(order, forcedBlockType); }}
            onClearAll={() => setOrders([])}
            onEditOrder={handleEditOrder}
            onDeleteOrder={async (id) => {
              await licitacaoService.deleteLicitacaoProcess(id);
              setLicitacaoProcesses(p => p.filter(o => o.id !== id));
              setOrders(p => p.filter(o => o.id !== id));
            }}
            onUpdateAttachments={handleUpdateOrderAttachments}
            totalCounter={globalCounter}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}
        {currentView === 'licitacao-screening' && currentUser && (
          <LicitacaoScreeningScreen
            onBack={handleBackToModule}
            currentUser={currentUser}
            orders={licitacaoProcesses}
            onEditOrder={handleEditOrder}
            onDeleteOrder={async (id) => {
              await licitacaoService.deleteLicitacaoProcess(id);
              setLicitacaoProcesses(p => p.filter(o => o.id !== id));
              setOrders(p => p.filter(o => o.id !== id));
            }}
            onUpdateOrderStatus={async (id, status) => {
              setLicitacaoProcesses(p => p.map(o => o.id === id ? { ...o, status } : o));
              setOrders(p => p.map(o => o.id === id ? { ...o, status } : o));
              const order = licitacaoProcesses.find(o => o.id === id);
              if (order) {
                await licitacaoService.saveLicitacaoProcess({ ...order, status });
              }
            }}
          />
        )}
        <LicitacaoSettingsModal
          isOpen={isLicitacaoSettingsOpen}
          onClose={() => setIsLicitacaoSettingsOpen(false)}
          state={appState}
          nextProtocolNumber={licitacaoNextProtocol}
          currentUser={currentUser}
          persons={persons}
          sectors={sectors}
          onUpdate={(updates) => {
            setAppState(prev => ({
              ...prev,
              content: {
                ...prev.content,
                ...updates
              }
            }));
            // Also update editingOrder if exists to keep sync
            if (editingOrder) {
              setLicitacaoProcesses(p => p.map(o => o.id === editingOrder.id ? { ...o, ...updates } : o));
            }
            refreshData();
          }}
          onCancel={() => {
            // Close modal
            setIsLicitacaoSettingsOpen(false);

            // User Request: If process is sent (not pending), Cancel should ONLY close modal.
            // If it is pending or new, preserve existing behavior (return to home).
            const isSent = editingOrder && editingOrder.status !== 'pending';

            if (!isSent) {
              setEditingOrder(null);
              setActiveBlock('licitacao');
              setCurrentView('home');
            }
          }}
          orderStatus={editingOrder?.status}
        />
        {currentView === 'purchase-management' && currentUser && (
          <PurchaseManagementScreen
            onBack={handleBackToModule}
            currentUser={currentUser}
            orders={purchaseOrders}
            onDownloadPdf={(snapshot, forcedBlockType) => { const order = purchaseOrders.find(o => o.documentSnapshot === snapshot); if (order) handleDownloadFromHistory(order, forcedBlockType); }}
            onUpdateStatus={handleUpdateOrderStatus}
            onUpdatePurchaseStatus={handleUpdatePurchaseStatus}
            onUpdateCompletionForecast={handleUpdateCompletionForecast}
            onUpdateAttachments={handleUpdateOrderAttachments}
            onDeleteOrder={async (id) => {
              await comprasService.deletePurchaseOrder(id);
              setPurchaseOrders(p => p.filter(o => o.id !== id));
              // Only update 'orders' if it's currently showing purchaseOrders (which it might not be in this view, but harmless)
              if (activeBlock === 'compras') setOrders(p => p.filter(o => o.id !== id));
            }}
          />
        )}
        {currentView === 'vehicle-scheduling' && currentUser && (
          <VehicleSchedulingScreen
            state={appState}
            schedules={schedules}
            vehicles={vehicles}
            persons={persons}
            sectors={sectors}
            onAddSchedule={async (s) => {
              const newSchedule = await vehicleSchedulingService.createSchedule(s);
              if (newSchedule) setSchedules(prev => [...prev, newSchedule]);
              else alert("Erro ao criar agendamento");
            }}
            onUpdateSchedule={async (s) => {
              const updated = await vehicleSchedulingService.updateSchedule(s);
              if (updated) setSchedules(prev => prev.map(x => x.id === s.id ? updated : x));
              else alert("Erro ao atualizar agendamento");
            }}
            onDeleteSchedule={async (id) => {
              const success = await vehicleSchedulingService.deleteSchedule(id);
              if (success) setSchedules(prev => prev.filter(x => x.id !== id));
              else alert("Erro ao excluir agendamento");
            }}
            onBack={handleGoHome}
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            currentUserRole={currentUser.role}
            currentUserPermissions={currentUser.permissions}
            requestedView={activeBlock === 'vs_calendar' ? 'calendar' : activeBlock === 'vs_history' ? 'history' : activeBlock === 'vs_approvals' ? 'approvals' : 'menu'}
            onNavigate={(path) => {
              window.history.pushState(null, '', path);
              // Manually trigger popstate or update state to reflect change if needed, 
              // but usually pushState needs an event dispatch for App.useEffect to catch it? 
              // actually App.useEffect uses window.addEventListener('popstate'). pushState does NOT trigger popstate.
              // So we must manually update state or assume the child updates its UI and we just sync URL.
              // BETTER: Update local state directly here to sync with URL?
              // The App's useEffect listens to popstate (browser back/fwd). 
              // For internal nav, we should probably just update the state directly if we want consistent internal processing.
              // However, to keep it simple and robust with the existing "Router":
              const evt = new PopStateEvent('popstate');
              window.dispatchEvent(evt); // Trigger App's listener
            }}
          />
        )}
      </div>

      {
        confirmModal.isOpen && createPortal(
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fade-in">
            <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-scale-in">
              <div className="p-8 text-center flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-xl ${confirmModal.type === 'error' ? 'bg-rose-100 text-rose-600 shadow-rose-500/20' :
                  confirmModal.type === 'warning' ? 'bg-amber-100 text-amber-600 shadow-amber-500/20' :
                    'bg-blue-100 text-blue-600 shadow-blue-500/20'
                  }`}>
                  {confirmModal.type === 'error' ? <X className="w-8 h-8" /> :
                    confirmModal.type === 'warning' ? <Send className="w-8 h-8" /> :
                      <CheckCircle2 className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 uppercase">{confirmModal.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">{confirmModal.message}</p>

                <div className="flex w-full gap-3">
                  {!confirmModal.singleButton && (
                    <button
                      onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                      className="flex-1 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={confirmModal.onConfirm}
                    className={`flex-1 py-3 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-[0.98] ${confirmModal.type === 'error' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' :
                      confirmModal.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
                        'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                      }`}
                  >
                    {confirmModal.singleButton ? 'Entendi' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {
        successOverlay?.show && createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fade-in">
            <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-scale-in">
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-14 h-14" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase">Pedido Enviado!</h3>
                <p className="text-slate-500 text-base font-medium leading-relaxed mb-10">O seu documento foi processado com sucesso e encaminhado para análise do setor competente.</p>
                <div className="w-full bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col items-center mb-10">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Protocolo de Rastreio</span>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-lg"><Send className="w-4 h-4" /></div>
                    <span className="text-2xl font-mono font-bold text-slate-900 tracking-wider">{successOverlay.protocol}</span>
                  </div>
                </div>
                <button onClick={() => { setSuccessOverlay(null); handleGoHome(); }} className="w-full py-5 bg-slate-900 text-white font-black text-sm uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-slate-900/20 hover:bg-emerald-600 transition-all active:scale-[0.98]">Voltar ao Menu Inicial</button>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {/* QUICK SAVE SUCCESS MODAL */}
      {
        showSaveSuccess && createPortal(
          <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-transparent">
            <div className="bg-slate-900/90 backdrop-blur-md text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-scale-in border border-white/10">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight">Salvo!</span>
                <span className="text-xs text-slate-300 font-medium">As alterações foram registradas.</span>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      <div id="background-pdf-generation-container" style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }} aria-hidden="true">
        {snapshotToDownload && (
          <DocumentPreview
            ref={backgroundPreviewRef}
            state={snapshotToDownload}
            isGenerating={true}
            blockType={blockTypeToDownload || (snapshotToDownload.content.subType ? 'diarias' : (snapshotToDownload.content.purchaseItems && snapshotToDownload.content.purchaseItems.length > 0 ? 'compras' : (activeBlock || 'oficio')))}
            customId="background-preview-scaler"
          />
        )}
      </div>
      {
        currentUser && (
          <TwoFactorModal
            isOpen={is2FAModalOpen}
            onClose={() => setIs2FAModalOpen(false)}
            onConfirm={async () => {
              setIs2FAModalOpen(false);

              // Capture Metadata
              let ip = 'Não detectado';
              try {
                const res = await fetch('https://api.ipify.org?format=json');
                const data = await res.json();
                ip = data.ip;
              } catch (e) { console.error("IP fallback", e); }

              // Generate Unique Signature ID via Supabase
              const signatureId = await signatureService.createSignatureLog(currentUser.id, ip, appState.content.title);

              const metadata = {
                enabled: true,
                method: 'Autenticador Mobile 2FA',
                ip: ip,
                date: new Date().toISOString(),
                id: signatureId || 'ERR-GEN-ID'
              };

              if (pending2FAAction) {
                await pending2FAAction(metadata);
                setPending2FAAction(null);
              } else {
                handleFinish(true, metadata); // Proceed skipping 2FA check with metadata
              }
            }}
            secret={twoFASecret}
            secret2={twoFASecret2}
            signatureName={twoFASignatureName}
          />
        )
      }
    </div >
  );
};

export default App;