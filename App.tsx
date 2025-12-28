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

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'home' | 'admin' | 'tracking' | 'editor' | 'purchase-management' | 'vehicle-scheduling'>('login');
  const { user: currentUser, signIn, signOut } = useAuth();
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  const [activeBlock, setActiveBlock] = useState<BlockType | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [signatures, setSignatures] = useState<Signature[]>(MOCK_SIGNATURES);
  const [globalCounter, setGlobalCounter] = useState(0);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [persons, setPersons] = useState<Person[]>([]);
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

  useEffect(() => {
    if (currentUser && currentView === 'login') {
      setCurrentView('home');
    }
  }, [currentUser, currentView]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedOrders = await db.getAllOrders();
        setOrders(savedOrders);

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
            tempPasswordExpiresAt: u.temp_password_expires_at
          }));
          setUsers(mappedUsers);
        } else {
          console.error("Error fetching users:", sbError);
          // Fallback or empty? keeping default users might cause sync issues, better clear or keep mock if empty
          if (DEFAULT_USERS.length > 0 && (!sbUsers || sbUsers.length === 0)) {
            // Optional: could insert default users here if empty
          }
        }
        const savedSigs = await db.getAllSignatures();
        if (savedSigs.length > 0) setSignatures(savedSigs);
        const savedSettings = await db.getGlobalSettings();
        if (savedSettings) setAppState(savedSettings);

        // Fetch entities from Supabase
        const savedPersons = await entityService.getPersons();
        setPersons(savedPersons);

        const savedSectors = await entityService.getSectors();
        setSectors(savedSectors);

        const savedJobs = await entityService.getJobs();
        setJobs(savedJobs);

        // MARCAS INICIAIS
        const savedBrands = await db.getAllBrands();
        if (savedBrands.length === 0) {
          const defaultLeves = ['FIAT', 'TOYOTA', 'VOLKSWAGEN', 'FORD', 'CHEVROLET', 'HONDA', 'HYUNDAI', 'RENAULT', 'NISSAN', 'PEUGEOT', 'CITROËN', 'BMW', 'JEEP', 'RAM', 'BYD', 'GWM'];
          const defaultPesados = ['CATERPILLAR', 'KOMATSU', 'VOLVO CE', 'JOHN DEERE', 'CASE', 'NEW HOLLAND', 'JCB', 'XCMG'];
          const initialBrands: VehicleBrand[] = [
            ...defaultLeves.map(n => ({ id: `br-${Date.now()}-${Math.random()}`, name: n, category: 'leve' as const })),
            ...defaultPesados.map(n => ({ id: `br-${Date.now()}-${Math.random()}`, name: n, category: 'pesado' as const }))
          ];
          for (const b of initialBrands) await db.saveBrand(b);
          setBrands(initialBrands);
        } else {
          setBrands(savedBrands);
        }

        // VEÍCULOS INICIAIS
        const savedVehicles = await db.getAllVehicles();
        if (savedVehicles.length === 0) {
          const initialVehicles: Vehicle[] = [
            {
              id: 'v-cronos-01',
              type: 'leve',
              model: 'CRONOS',
              plate: 'RVY7C56',
              brand: 'FIAT',
              year: '2022',
              color: 'BRANCA',
              renavam: '01332550344',
              chassis: '8AP359AFDNU226571',
              sectorId: 'sec5',
              status: 'operacional',
              maintenanceStatus: 'em_dia',
              fuelTypes: ['ALCOOL', 'GASOLINA']
            },
            {
              id: 'v-toro-01',
              type: 'leve',
              model: 'TORO',
              plate: 'SIP4E08',
              brand: 'FIAT',
              year: '2023',
              color: 'BRANCA',
              renavam: '01357061495',
              chassis: '9882261ZPPKF34145',
              sectorId: 'sec12',
              responsiblePersonId: 'p3',
              status: 'operacional',
              maintenanceStatus: 'em_dia',
              fuelTypes: ['DIESEL']
            }
          ];
          for (const v of initialVehicles) await db.saveVehicle(v);
          setVehicles(initialVehicles);
        } else {
          setVehicles(savedVehicles);
        }

        const savedSchedules = await db.getAllSchedules();
        setSchedules(savedSchedules);

        const counterValue = await db.getGlobalCounter();
        setGlobalCounter(counterValue);

      } catch (err) {
        console.error("Failed to load local database", err);
      }
    };
    loadData();
  }, []);

  const handleLogin = async (u: string, p: string) => {
    const { error } = await signIn(u, p);
    return { error };
  };

  const handleFinish = async () => {
    if (!currentUser || !activeBlock) return;
    let finalOrder: Order;
    if (editingOrder) {
      const updatedSnapshot = JSON.parse(JSON.stringify(appState));
      updatedSnapshot.content.protocol = editingOrder.protocol;
      finalOrder = { ...editingOrder, title: appState.content.title, documentSnapshot: updatedSnapshot };
      await db.saveOrder(finalOrder);
      setOrders(prev => prev.map(o => o.id === finalOrder.id ? finalOrder : o));
    } else {
      const nextVal = await db.incrementGlobalCounter();
      setGlobalCounter(nextVal);
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const year = new Date().getFullYear();
      const prefix = activeBlock === 'oficio' ? 'OFC' : activeBlock === 'compras' ? 'COM' : activeBlock === 'diarias' ? 'DIA' : 'LIC';
      const protocolString = `${prefix}-${year}-${randomPart}`;
      const finalSnapshot = JSON.parse(JSON.stringify(appState));
      finalSnapshot.content.protocol = protocolString;
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
      await db.saveOrder(finalOrder);
      setOrders(prev => [...prev, finalOrder]);
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
        db.saveOrder(updated);
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
        const updated = { ...o, purchaseStatus };
        db.saveOrder(updated);
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
        db.saveOrder(updated);
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
        db.saveOrder(updated);
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
        db.saveOrder(updated);
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

  const handleStartEditing = () => {
    let defaultTitle = INITIAL_STATE.content.title;
    let defaultRightBlock = INITIAL_STATE.content.rightBlockText;
    if (activeBlock === 'compras') {
      defaultTitle = 'Requisição de Compras e Serviços';
      defaultRightBlock = 'Ao Departamento de Compras da\nPrefeitura de São José do Goiabal-MG';
    }
    if (activeBlock === 'licitacao') defaultTitle = 'Processo Licitatório nº 01/2024';
    if (activeBlock === 'diarias') defaultTitle = 'Requisição de Diária';
    setAppState(prev => ({ ...prev, content: { ...INITIAL_STATE.content, title: defaultTitle, rightBlockText: defaultRightBlock, protocol: '', requesterName: '', requesterRole: '', requesterSector: '' }, document: { ...prev.document, showSignature: INITIAL_STATE.document.showSignature } }));
    setEditingOrder(null);
    setCurrentView('editor');
    setAdminTab('content');
    setIsAdminSidebarOpen(true);
    setIsFinalizedView(false);
  };

  // Helper for self-updates or other minor updates
  const handleUpdateUserInApp = async (updatedUser: User) => {
    await supabase.from('profiles').update({
      name: updatedUser.name,
      username: updatedUser.username,
      role: updatedUser.role,
      sector: updatedUser.sector,
      job_title: updatedUser.jobTitle,
      allowed_signature_ids: updatedUser.allowedSignatureIds,
      permissions: updatedUser.permissions,
      temp_password: updatedUser.tempPassword,
      temp_password_expires_at: updatedUser.tempPasswordExpiresAt
    }).eq('id', updatedUser.id);

    setUsers(p => p.map(us => us.id === updatedUser.id ? updatedUser : us));
  };

  if (currentView === 'login') return <LoginScreen onLogin={handleLogin} uiConfig={appState.ui} />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans flex-col">
      {currentUser && <AppHeader currentUser={currentUser} uiConfig={appState.ui} activeBlock={activeBlock} onLogout={handleLogout} onOpenAdmin={handleOpenAdmin} onGoHome={handleGoHome} currentView={currentView} />}
      <div className="flex-1 flex relative overflow-hidden">
        {currentView === 'home' && currentUser && <HomeScreen onNewOrder={handleStartEditing} onTrackOrder={() => setCurrentView('tracking')} onManagePurchaseOrders={() => setCurrentView('purchase-management')} onVehicleScheduling={() => setCurrentView('vehicle-scheduling')} onLogout={handleLogout} onOpenAdmin={handleOpenAdmin} userRole={currentUser.role} userName={currentUser.name} permissions={currentUser.permissions} activeBlock={activeBlock} setActiveBlock={setActiveBlock} stats={{ totalGenerated: globalCounter, historyCount: orders.length, activeUsers: users.length }} />}
        {(currentView === 'editor' || currentView === 'admin') && currentUser && (
          <div className="flex-1 flex overflow-hidden h-full relative">
            {!isFinalizedView && adminTab !== 'fleet' && (
              <AdminSidebar state={appState} onUpdate={setAppState} onPrint={() => window.print()} isOpen={isAdminSidebarOpen} onClose={() => { if (currentView === 'editor') { setIsFinalizedView(true); setIsAdminSidebarOpen(false); } else { setIsAdminSidebarOpen(false); } }} isDownloading={isDownloading} currentUser={currentUser} mode={currentView === 'admin' ? 'admin' : 'editor'} onSaveDefault={() => db.saveGlobalSettings(appState)} onFinish={handleFinish} activeTab={adminTab} onTabChange={setAdminTab} availableSignatures={signatures} activeBlock={activeBlock} persons={persons} sectors={sectors} jobs={jobs} />
            )}
            <main className="flex-1 h-full overflow-hidden flex flex-col relative bg-slate-50">
              {currentView === 'admin' && adminTab === null ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                  <AdminDashboard
                    userName={currentUser.name}
                    onNewOrder={() => { setActiveBlock('oficio'); handleStartEditing(); }}
                    onManageUsers={() => setAdminTab('users')}
                    onSettings={() => setAdminTab('design')}
                    onHistory={() => setCurrentView('tracking')}
                    onSignatures={() => setAdminTab('signatures')}
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
                      allowedSignatureIds: u.allowedSignatureIds
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
                          tempPasswordExpiresAt: ru.temp_password_expires_at
                        }));
                        setUsers(mapped);
                      }
                    }
                  }}
                  onUpdateUser={async (u) => {
                    // Check if password changed (requires special handling or assume logic)
                    // For now, update profile fields
                    const { error } = await supabase.from('profiles').update({
                      name: u.name,
                      username: u.username,
                      role: u.role,
                      sector: u.sector,
                      job_title: u.jobTitle,
                      allowed_signature_ids: u.allowedSignatureIds,
                      permissions: u.permissions,
                      temp_password: u.tempPassword,
                      temp_password_expires_at: u.tempPasswordExpiresAt
                    }).eq('id', u.id);

                    if (u.password) {
                      // Update password if provided in edit (UI usually handles this via separate logic or specific flow)
                      // If the UI passes it in 'u' during update:
                      await supabase.rpc('update_user_password', { user_id: u.id, new_password: u.password });
                    }

                    if (error) {
                      console.error("Error updating user:", error);
                      alert("Erro ao atualizar: " + error.message);
                    } else {
                      // Optimistic update or refresh
                      setUsers(p => p.map(us => us.id === u.id ? u : us));
                    }
                  }}
                  onDeleteUser={async (id) => {
                    const { error } = await supabase.rpc('delete_user_admin', { user_id: id });
                    if (error) {
                      console.error("Error deleting user:", error);
                      alert("Erro ao deletar: " + error.message);
                    } else {
                      setUsers(p => p.filter(u => u.id !== id));
                    }
                  }}
                  availableSignatures={signatures}
                  jobs={jobs}
                  sectors={sectors}
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
                />
              ) : currentView === 'admin' && adminTab === 'fleet' ? (
                <FleetManagementScreen vehicles={vehicles} sectors={sectors} persons={persons} jobs={jobs} brands={brands} onAddVehicle={v => { db.saveVehicle(v); setVehicles(p => [...p, v]); }} onUpdateVehicle={v => { db.saveVehicle(v); setVehicles(p => p.map(vi => vi.id === v.id ? v : vi)); }} onDeleteVehicle={id => { db.deleteVehicle(id); setVehicles(p => p.filter(v => v.id !== id)); }} onAddBrand={b => { db.saveBrand(b); setBrands(p => [...p, b]); }} onBack={() => setAdminTab(null)} />
              ) : currentView === 'admin' && adminTab === 'signatures' ? (
                <SignatureManagementScreen signatures={signatures} currentUser={currentUser} onAddSignature={s => { db.saveSignature(s); setSignatures(p => [...p, s]); }} onUpdateSignature={s => { db.saveSignature(s); setSignatures(p => p.map(si => si.id === s.id ? s : si)); }} onDeleteSignature={id => { db.deleteSignature(id); setSignatures(p => p.filter(s => s.id !== id)); }} />
              ) : currentView === 'admin' && adminTab === 'ui' ? (
                <UIPreviewScreen ui={appState.ui} />
              ) : currentView === 'admin' && adminTab === 'design' ? (
                <AdminDocumentPreview state={appState} />
              ) : (
                <DocumentPreview ref={componentRef} state={appState} isGenerating={isDownloading} mode={currentView === 'admin' ? 'admin' : 'editor'} blockType={activeBlock} />
              )}
              {isFinalizedView && (
                <FinalizedActionBar onDownload={handleDownloadPdf} onBack={handleGoHome} onEdit={() => { setIsFinalizedView(false); setIsAdminSidebarOpen(true); }} onSend={handleSendOrder} showSendButton={activeBlock === 'compras'} isDownloading={isDownloading} documentTitle={appState.content.title} />
              )}
            </main>
          </div>
        )}
        {currentView === 'tracking' && currentUser && (
          <TrackingScreen onBack={handleGoHome} currentUser={currentUser} activeBlock={activeBlock} orders={orders} onDownloadPdf={(snapshot) => { const order = orders.find(o => o.documentSnapshot === snapshot); if (order) handleDownloadFromHistory(order); }} onClearAll={() => { db.clearAllOrders(); setOrders([]); }} onEditOrder={handleEditOrder} onDeleteOrder={id => { db.deleteOrder(id); setOrders(p => p.filter(o => o.id !== id)); }} onUpdateAttachments={handleUpdateOrderAttachments} totalCounter={globalCounter} onUpdatePaymentStatus={handleUpdatePaymentStatus} />
        )}
        {currentView === 'purchase-management' && currentUser && (
          <PurchaseManagementScreen onBack={handleGoHome} currentUser={currentUser} orders={orders} onDownloadPdf={(snapshot) => { const order = orders.find(o => o.documentSnapshot === snapshot); if (order) handleDownloadFromHistory(order); }} onUpdateStatus={handleUpdateOrderStatus} onUpdatePurchaseStatus={handleUpdatePurchaseStatus} onUpdateCompletionForecast={handleUpdateCompletionForecast} onUpdateAttachments={handleUpdateOrderAttachments} onDeleteOrder={id => { db.deleteOrder(id); setOrders(p => p.filter(o => o.id !== id)); }} />
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
    </div>
  );
};

export default App;