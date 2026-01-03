
export enum FontFamily {
  SANS = 'font-sans',
  SERIF = 'font-serif',
  MONO = 'font-mono'
}

export type LogoAlignment = 'left' | 'center' | 'right';

export interface WatermarkConfig {
  enabled: boolean;
  imageUrl: string | null;
  opacity: number;
  size: number;
  grayscale: boolean;
}

export interface BrandingConfig {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: FontFamily;
  logoWidth: number;
  logoAlignment: LogoAlignment;
  watermark: WatermarkConfig;
}

export interface TextStyle {
  size: number;
  color: string;
  alignment: 'left' | 'center' | 'right';
}

export interface DocumentConfig {
  headerText: string;
  footerText: string;
  city: string;
  showDate: boolean;
  showPageNumbers: boolean;
  showSignature: boolean;
  showLeftBlock: boolean;
  showRightBlock: boolean;
  titleStyle: TextStyle;
  leftBlockStyle: {
    size: number;
    color: string;
  };
  rightBlockStyle: {
    size: number;
    color: string;
  };
}

export interface EvidenceItem {
  title: string;
  imageUrl: string;
}

export interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  unit: 'Pacote' | 'Caixa' | 'Kg' | 'Unidade' | 'Serviço';
}

export interface ContentData {
  title: string;
  body: string;
  protocol?: string;
  protocolId?: string;
  signatureName: string;
  signatureRole: string;
  signatureSector: string;
  leftBlockText: string;
  rightBlockText: string;
  subType?: 'diaria' | 'custeio';
  showDiariaSignatures?: boolean;
  showExtraField?: boolean;
  extraFieldText?: string;
  processType?: string;
  completionForecast?: string;
  evidenceItems?: EvidenceItem[];
  purchaseItems?: PurchaseItem[];
  priority?: 'Normal' | 'Média' | 'Alta' | 'Urgência';
  priorityJustification?: string;
  requesterName?: string;
  requesterRole?: string;
  requesterSector?: string;
  destination?: string;
  departureDateTime?: string;
  returnDateTime?: string;
  lodgingCount?: number;
  authorizedBy?: string;
  distanceKm?: number;
  requestedValue?: string;
  descriptionReason?: string;
  paymentForecast?: string;
  useDigitalSignature?: boolean;
  digitalSignature?: {
    enabled: boolean;
    method: string;
    ip: string;
    date: string;
    id: string;
  };
  signatures?: { name: string; role: string; sector: string; id?: string }[];
  licitacaoStages?: {
    id: string;
    title: string;
    body: string;
    signatureName?: string;
    signatureRole?: string;
    signatureSector?: string;
    signatures?: { name: string; role: string; sector: string; id?: string }[];
  }[];
  licitacaoActiveDraft?: { body: string; signatureName?: string; signatureRole?: string; signatureSector?: string; signatures?: { name: string; role: string; sector: string; id?: string }[] };
  currentStageIndex?: number;
  viewingStageIndex?: number;
}

export interface UIConfig {
  loginLogoUrl: string | null;
  loginLogoHeight: number;
  headerLogoUrl: string | null;
  headerLogoHeight: number;
  homeLogoPosition: 'left' | 'center';
}

export interface AppState {
  branding: BrandingConfig;
  document: DocumentConfig;
  content: ContentData;
  ui: UIConfig;
}

export type UserRole = 'admin' | 'collaborator' | 'licitacao' | 'compras';

export type AppPermission = 'parent_criar_oficio' | 'parent_admin' | 'parent_compras' | 'parent_licitacao' | 'parent_diarias' | 'parent_compras_pedidos' | 'parent_frotas' | 'parent_agendamento_veiculo' | 'parent_licitacao_triagem' | 'parent_licitacao_processos';

export type BlockType = 'oficio' | 'compras' | 'licitacao' | 'diarias' | 'agendamento' | 'vs_calendar' | 'vs_history' | 'vs_approvals' | 'licitacao_screening';

export interface User {
  id: string;
  username: string;
  password?: string;
  tempPassword?: string;
  tempPasswordExpiresAt?: number;
  name: string;
  role: UserRole;
  sector?: string;
  jobTitle?: string;
  allowedSignatureIds?: string[];
  permissions: AppPermission[];
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorEnabled2?: boolean;
  twoFactorSecret2?: string;
  email?: string;
  whatsapp?: string;
}

export interface Signature {
  id: string;
  name: string;
  role: string;
  sector: string;
}

export interface StatusMovement {
  statusLabel: string;
  date: string;
  userName: string;
  justification?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  date: string;
}

export interface Order {
  id: string;
  protocol: string;
  title: string;
  status: 'pending' | 'completed' | 'canceled' | 'approved' | 'rejected' | 'awaiting_approval' | 'in_progress' | 'finishing';
  purchaseStatus?: 'recebido' | 'coletando_orcamento' | 'aprovacao_orcamento' | 'coletando_dotacao' | 'realizado' | 'concluido' | 'cancelado';
  statusHistory?: StatusMovement[];
  createdAt: string;
  userId: string;
  userName: string;
  blockType: BlockType;
  documentSnapshot?: AppState;
  paymentStatus?: 'pending' | 'paid';
  paymentDate?: string;
  budgetFileUrl?: string;
  attachments?: Attachment[];
  completionForecast?: string;
  stage?: string;
  requestingSector?: string;
}

export interface Person {
  id: string;
  name: string;
  jobId?: string;
  sectorId?: string;
}

export interface Sector {
  id: string;
  name: string;
}

export interface Job {
  id: string;
  name: string;
}

// Fleet Module Types
export type VehicleType = 'leve' | 'pesado' | 'acessorio';

export type VehicleStatus = 'operacional' | 'manutencao' | 'vistoria' | 'documentacao' | 'nao_liberado' | 'leilao' | 'leiloado' | 'batido';
export type MaintenanceStatus = 'em_dia' | 'andamento' | 'vencido';

export interface VehicleBrand {
  id: string;
  name: string;
  category: VehicleType;
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  model: string;
  plate: string;
  brand: string;
  year: string;
  color: string;
  renavam: string;
  chassis: string;
  sectorId: string;
  responsiblePersonId?: string;
  documentUrl?: string;
  documentName?: string;
  vehicleImageUrl?: string;
  status: VehicleStatus;
  maintenanceStatus: MaintenanceStatus;
  fuelTypes?: string[];
  requestManagerIds?: string[];
}

export type ScheduleStatus = 'pendente' | 'confirmado' | 'em_curso' | 'concluido' | 'cancelado';

export interface VehicleSchedule {
  id: string;
  protocol: string;
  vehicleId: string;
  driverId: string;
  serviceSectorId?: string;
  requesterPersonId?: string;
  departureDateTime: string;
  returnDateTime: string;
  destination: string;
  purpose: string;
  status: ScheduleStatus;
  requesterId: string;
  createdAt: string;
  vehicleLocation?: string;
  authorizedByName?: string;
}