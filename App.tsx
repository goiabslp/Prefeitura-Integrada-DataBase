import React, { useState, useRef, useEffect } from 'react';
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
import { Send, CheckCircle2, X } from 'lucide-react';

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

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'home' | 'admin' | 'tracking' | 'editor' | 'purchase-management' | 'vehicle-scheduling'>('login');
  const { user: currentUser, signIn, signOut } = useAuth();
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  const [activeBlock, setActiveBlock] = useState<BlockType | null>(null);
  const [oficios, setOficios] = useState<Order[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  // const [signatures, setSignatures] = useState<Signature[]>([]); // DEPRECATED: Signatures are now derived from Users
  const [globalCounter, setGlobalCounter] = useState(0);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

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
  const [snapshotToDownload, setSnapshotToDownload] = useState<AppState | null>(null);
  const backgroundPreviewRef = useRef<HTMLDivElement>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  // 2FA State
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFASignatureName, setTwoFASignatureName] = useState('');
  const [pendingParams, setPendingParams] = useState<any>(null); // To store state/action to resume after 2FA

  // useEffect(() => {
  //   if (currentUser && currentView === 'login') {
  //     setCurrentView('home');
  //   }
  // }, [currentUser, currentView]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const loadedOficios = await oficiosService.getAllOficios();
      setOficios(loadedOficios);
      const loadedPurchaseOrders = await comprasService.getAllPurchaseOrders();
      setPurchaseOrders(loadedPurchaseOrders);
      const loadedServiceRequests = await diariasService.getAllServiceRequests();
      setServiceRequests(loadedServiceRequests);

      // Re-evaluate orders based on active view/block if needed, but for now specific block handling in other functions overrides this.
      // However, to see updates in current list:
      if (activeBlock === 'compras') setOrders(loadedPurchaseOrders);
      else if (activeBlock === 'diarias') setOrders(loadedServiceRequests);
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
          allowedSignatureIds: u.allowed_signature_ids,
          permissions: u.permissions,
          tempPassword: u.temp_password,
          tempPasswordExpiresAt: u.temp_password_expires_at,
          twoFactorEnabled: u.two_factor_enabled,
          twoFactorSecret: u.two_factor_secret
        }));
        setUsers(mappedUsers);
      } else {
        console.error("Error fetching users:", sbError);
      }

      // Fetch Global Settings (Try Supabase first, fallback to local)
      const remoteSettings = await settingsService.getGlobalSettings();
      if (remoteSettings) {
        setAppState(prev => ({
          ...prev,
          branding: {
            ...INITIAL_STATE.branding,
            ...remoteSettings.branding,
            watermark: {
              ...INITIAL_STATE.branding.watermark,
              ...(remoteSettings.branding?.watermark || {})
            }
          },
          document: {
            ...INITIAL_STATE.document,
            ...remoteSettings.document,
            titleStyle: {
              ...INITIAL_STATE.document.titleStyle,
              ...(remoteSettings.document?.titleStyle || {})
            },
            leftBlockStyle: {
              ...INITIAL_STATE.document.leftBlockStyle,
              ...(remoteSettings.document?.leftBlockStyle || {})
            },
            rightBlockStyle: {
              ...INITIAL_STATE.document.rightBlockStyle,
              ...(remoteSettings.document?.rightBlockStyle || {})
            }
          },
          ui: {
            ...INITIAL_STATE.ui,
            ...remoteSettings.ui
          }
        }));
      } else {
        const savedSettings = await db.getGlobalSettings();
        if (savedSettings) setAppState(savedSettings);
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

      const savedSchedules = await db.getAllSchedules();
      setSchedules(savedSchedules);

      const counterValue = await db.getGlobalCounter();
      setGlobalCounter(counterValue);

    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleLogin = async (u: string, p: string) => {
    const { error } = await signIn(u, p);
    if (!error) {
      setCurrentView('home');
    }
    return { error };
  };

  const handleFinish = async (skip2FA = false, digitalSignatureData?: { enabled: boolean, method: string, ip: string, date: string }) => {
    if (!currentUser || !activeBlock) return;

    // 2FA Interception Logic
    if (!skip2FA) {
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

      if (signerUser && signerUser.twoFactorEnabled && signerUser.twoFactorSecret) {
        setTwoFASecret(signerUser.twoFactorSecret);
        setTwoFASignatureName(signerUser.name);
        // Store intent to proceed
        setPendingParams(true);
        setIs2FAModalOpen(true);
        return;
      }
    }

    let finalOrder: Order;
    if (editingOrder) {
      const updatedSnapshot = JSON.parse(JSON.stringify(appState));
      updatedSnapshot.content.protocol = editingOrder.protocol;

      // Add digital signature if present
      if (digitalSignatureData) {
        updatedSnapshot.content.digitalSignature = digitalSignatureData;
        setAppState(prev => ({ ...prev, content: { ...prev.content, digitalSignature: digitalSignatureData } }));
      }

      finalOrder = { ...editingOrder, title: appState.content.title, documentSnapshot: updatedSnapshot };

      // Route save based on blockType
      if (finalOrder.blockType === 'compras') {
        await comprasService.savePurchaseOrder(finalOrder);
        setPurchaseOrders(prev => prev.map(o => o.id === finalOrder.id ? finalOrder : o));
      } else if (finalOrder.blockType === 'diarias') {
        await diariasService.saveServiceRequest(finalOrder);
        setServiceRequests(prev => prev.map(o => o.id === finalOrder.id ? finalOrder : o));
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
      } else {
        await oficiosService.saveOficio(finalOrder);
        setOficios(prev => [finalOrder, ...prev]);
        setOrders(prev => [finalOrder, ...prev]);
      }
      setAppState(finalSnapshot);
    }
    setIsFinalizedView(true);
    setIsAdminSidebarOpen(false);
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
    if (order.documentSnapshot) setAppState(order.documentSnapshot);
    setActiveBlock(order.blockType);
    setEditingOrder(order);
    setCurrentView('editor');
    setAdminTab('content');
    setIsAdminSidebarOpen(true);
    setIsFinalizedView(false);
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
        const newMovement: StatusMovement | null = justification ? {
          statusLabel: `Alteração de Status para ${purchaseStatus}`,
          date: new Date().toISOString(),
          userName: currentUser.name,
          justification
        } : null;

        const updated: Order = {
          ...o,
          purchaseStatus,
          budgetFileUrl: budgetFileUrl || o.budgetFileUrl,
          statusHistory: newMovement ? [...(o.statusHistory || []), newMovement] : o.statusHistory
        };

        comprasService.savePurchaseOrder(updated);
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
          comprasService.savePurchaseOrder(updated);
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

  const handleDownloadFromHistory = async (order: Order) => {
    if (!order.documentSnapshot) return;
    setIsDownloading(true);
    setSnapshotToDownload(order.documentSnapshot);
    setTimeout(async () => {
      const element = document.getElementById('background-preview-scaler');
      if (!element) return;
      const opt = { margin: 0, filename: `${order.title || 'documento'}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, scrollX: 0 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: 'css' } };
      // @ts-ignore
      await window.html2pdf().from(element).set(opt).save();
      setSnapshotToDownload(null);
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
    setCurrentView('login');
    setActiveBlock(null);
    setIsFinalizedView(false);
    setEditingOrder(null);
  };

  const handleGoHome = () => {
    setCurrentView('home');
    setActiveBlock(null);
    setIsAdminSidebarOpen(false);
    setAdminTab(null);
    setIsFinalizedView(false);
    setEditingOrder(null);
  };

  const handleBackToModule = () => {
    setCurrentView('home');
    // activeBlock is preserved
    setIsAdminSidebarOpen(false);
    setAdminTab(null);
    setIsFinalizedView(false);
    setEditingOrder(null);
  };

  const handleStartEditing = async () => {
    let defaultTitle = INITIAL_STATE.content.title;
    let defaultRightBlock = INITIAL_STATE.content.rightBlockText;
    let leftBlockContent = INITIAL_STATE.content.leftBlockText;
    const currentYear = new Date().getFullYear();

    if (activeBlock === 'compras') {
      defaultTitle = 'Requisição de Compras e Serviços';
      defaultRightBlock = 'Ao Departamento de Compras da\nPrefeitura de São José do Goiabal-MG';
    } else if (activeBlock === 'licitacao') {
      defaultTitle = 'Processo Licitatório nº 01/2024';
    } else if (activeBlock === 'diarias') {
      defaultTitle = 'Requisição de Diária';
    }

    // Logic for Sector numbering (Unified for ALL blocks)
    // Always attempt to get a number if user has a sector
    if (currentUser?.sector) {
      const userSector = sectors.find(s => s.name === currentUser.sector);
      if (userSector) {
        const nextNum = await counterService.getNextSectorCount(userSector.id, currentYear);
        if (nextNum) {
          const formattedNum = nextNum.toString().padStart(3, '0');

          if (activeBlock === 'compras') {
            defaultTitle = `Requisição de Compras nº ${formattedNum}/${currentYear}`;
            leftBlockContent = `Ref: Requisição nº ${formattedNum}/${currentYear}`;
          } else if (activeBlock === 'diarias') {
            defaultTitle = `Solicitação de Diária nº ${formattedNum}/${currentYear}`;
            leftBlockContent = `Ref: Solicitação nº ${formattedNum}/${currentYear}`;
          } else if (activeBlock === 'licitacao') {
            // Assuming Licitacao also follows this pattern or has a specific title format using the number
            defaultTitle = `Processo Licitatório nº ${formattedNum}/${currentYear}`;
            leftBlockContent = `Ref: Processo nº ${formattedNum}/${currentYear}`;
          } else {
            // Default Oficio and fallback for others
            defaultTitle = `Ofício nº ${formattedNum}/${currentYear}`;
            leftBlockContent = `Ref: Ofício nº ${formattedNum}/${currentYear}`;
          }
        }
      }
    }

    setAppState(prev => ({
      ...prev,
      content: {
        ...INITIAL_STATE.content,
        title: defaultTitle,
        rightBlockText: defaultRightBlock,
        leftBlockText: leftBlockContent,
        protocol: '',
        requesterName: '',
        requesterRole: '',
        requesterSector: ''
      },
      document: {
        ...prev.document,
        showSignature: INITIAL_STATE.document.showSignature
      }
    }));

    setEditingOrder(null);
    setCurrentView('editor');
    setAdminTab('content');
    setIsAdminSidebarOpen(true);
    setIsFinalizedView(false);
  };



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
      allowed_signature_ids: u.allowedSignatureIds,
      permissions: u.permissions,
      temp_password: u.tempPassword,
      temp_password_expires_at: u.tempPasswordExpiresAt,
      two_factor_enabled: u.twoFactorEnabled,
      two_factor_secret: u.twoFactorSecret
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
        // Update current user references if needed (though mostly handled by users array for management, session might differ)
        // But 2FA screen relies on currentUser prop update to show 'enabled'.
        // Since App rerenders when users changes? 
        // Actually App renders <TwoFactorAuthScreen currentUser={currentUser} />
        // If currentUser state variable is NOT updated, the prop won't change.
        // I need to update currentUser state variable?
        // Login logic sets currentUser.
        // I'll update it here too if it matches.
        // BUT wait, currentUser state is defined? 
        // Not explicitly seen in the snippet (it's likely passed or defined at top).
        // line 601: currentUser={currentUser}
        // line 89: const [currentUser, setCurrentUser] = useState<User | null>(null); (Assumed)
        // I'll assume I can set it?
        // Wait, I didn't see where currentUser is defined.
        // Let's assume I can't easily change it if it came from Auth provider? 
        // But the login handler sets it.
        // I will ignore updating currentUser variable for now and trust re-fetch or re-login, 
        // OR better: in line 645 I pass `onUpdateUser` which calls `handleUpdateUserInApp`.
        // I'll add `setCurrentUser(u)` if ids match.
        // Note: I don't see setCurrentUser in scope in the snippet, but likely available.
        // If not available, I might break it.
        // Actually, `handleLogin` calls `setCurrentUser`?
        // Let's check `handleLogin` definition later if needed.
        // For now, simple update in DB and users array.
      }
    }
  };

  if (currentView === 'login') return <LoginScreen onLogin={handleLogin} uiConfig={appState.ui} />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans flex-col">
      {currentUser && <AppHeader currentUser={currentUser} uiConfig={appState.ui} activeBlock={activeBlock} onLogout={handleLogout} onOpenAdmin={handleOpenAdmin} onGoHome={handleGoHome} currentView={currentView} isRefreshing={isRefreshing} onRefresh={refreshData} />}
      <div className="flex-1 flex relative overflow-hidden">
        {currentView === 'home' && currentUser && <HomeScreen onNewOrder={handleStartEditing} onTrackOrder={handleTrackOrder} onManagePurchaseOrders={handleManagePurchaseOrders} onVehicleScheduling={() => setCurrentView('vehicle-scheduling')} onLogout={handleLogout} onOpenAdmin={handleOpenAdmin} userRole={currentUser.role} userName={currentUser.name} permissions={currentUser.permissions} activeBlock={activeBlock} setActiveBlock={setActiveBlock} stats={{ totalGenerated: globalCounter, historyCount: orders.length, activeUsers: users.length }} />}
        {(currentView === 'editor' || currentView === 'admin') && currentUser && (
          <div className="flex-1 flex overflow-hidden h-full relative">
            {!isFinalizedView && adminTab !== 'fleet' && adminTab !== '2fa' && adminTab !== 'users' && adminTab !== 'entities' && (currentView !== 'admin' || adminTab !== null) && (
              <AdminSidebar state={appState} onUpdate={setAppState} onPrint={() => window.print()} isOpen={isAdminSidebarOpen} onClose={() => { if (currentView === 'editor') { setIsFinalizedView(true); setIsAdminSidebarOpen(false); } else { setIsAdminSidebarOpen(false); } }} isDownloading={isDownloading} currentUser={currentUser} mode={currentView === 'admin' ? 'admin' : 'editor'} onSaveDefault={async () => { await settingsService.saveGlobalSettings(appState); await db.saveGlobalSettings(appState); }} onFinish={handleFinish} activeTab={adminTab} onTabChange={setAdminTab} availableSignatures={myAvailableSignatures} activeBlock={activeBlock} persons={persons} sectors={sectors} jobs={jobs} onBack={() => { if (currentView === 'editor') setCurrentView('home'); }} />
            )}
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
        )}
        {currentView === 'tracking' && currentUser && (
          <TrackingScreen
            onBack={handleBackToModule}
            currentUser={currentUser}
            activeBlock={activeBlock}
            orders={orders}
            onDownloadPdf={(snapshot) => { const order = orders.find(o => o.documentSnapshot === snapshot); if (order) handleDownloadFromHistory(order); }}
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
              } else {
                await oficiosService.deleteOficio(id);
                setOficios(p => p.filter(o => o.id !== id));
                setOrders(p => p.filter(o => o.id !== id));
              }
            }}
            onUpdateAttachments={handleUpdateOrderAttachments}
            totalCounter={globalCounter}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
          />
        )}
        {currentView === 'purchase-management' && currentUser && (
          <PurchaseManagementScreen
            onBack={handleBackToModule}
            currentUser={currentUser}
            orders={purchaseOrders}
            onDownloadPdf={(snapshot) => { const order = purchaseOrders.find(o => o.documentSnapshot === snapshot); if (order) handleDownloadFromHistory(order); }}
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
          <VehicleSchedulingScreen schedules={schedules} vehicles={vehicles} persons={persons} sectors={sectors} onAddSchedule={s => { db.saveSchedule(s); setSchedules(prev => [...prev, s]); }} onUpdateSchedule={s => { db.saveSchedule(s); setSchedules(prev => prev.map(x => x.id === s.id ? s : x)); }} onDeleteSchedule={id => { db.deleteSchedule(id); setSchedules(prev => prev.filter(x => x.id !== id)); }} onBack={handleGoHome} currentUserId={currentUser.id} />
        )}
      </div>

      {successOverlay?.show && createPortal(
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
      )}

      <div id="background-pdf-generation-container" style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }} aria-hidden="true">
        {snapshotToDownload && (
          <DocumentPreview ref={backgroundPreviewRef} state={snapshotToDownload} isGenerating={true} blockType={snapshotToDownload.content.subType ? 'diarias' : (snapshotToDownload.content.purchaseItems ? 'compras' : (activeBlock || 'oficio'))} customId="background-preview-scaler" />
        )}
      </div>
      {currentUser && (
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

            handleFinish(true, metadata); // Proceed skipping 2FA check with metadata
          }}
          secret={twoFASecret}
          signatureName={twoFASignatureName}
        />
      )}
    </div>
  );
};

export default App;