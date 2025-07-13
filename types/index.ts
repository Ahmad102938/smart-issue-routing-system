export type UserRole = 'STORE_REGISTER' | 'SERVICE_PROVIDER' | 'ADMIN' | 'MODERATOR';

export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'rejected_by_tech' | 'escalated' | 'completed' | 'closed';

export type TicketPriority = 'high' | 'medium' | 'low';

export type StoreStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'DEACTIVATED';

export type ServiceProviderStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'DEACTIVATED';

export interface User {
  id: string;
  username: string;
  email: string;
  phone_number: string;
  role: UserRole;
  associated_entity_id?: string;
  associated_store_id?: string;
  associated_provider_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  registration_status?: string;
  store?: Store;
  service_provider?: ServiceProvider;
}

export interface Store {
  id: string;
  name: string;
  store_id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  location_coordinates: {
    latitude: number;
    longitude: number;
  };
  status: StoreStatus;
  moderator_user_id?: string;
  created_at: string;
  approved_at?: string;
}

export interface ServiceProvider {
  id: string;
  company_name: string;
  primary_location_address: string;
  primary_location_coordinates: {
    latitude: number;
    longitude: number;
  };
  unique_company_id: string;
  skills: string;
  capacity_per_day: number;
  current_load: number;
  status: ServiceProviderStatus;
  approved_by_moderator_id?: string;
  created_at: string;
  approved_at?: string;
}

export interface Ticket {
  id: string;
  store_id: string;
  reporter_user_id: string;
  description: string;
  qr_asset_id?: string;
  ai_classification_category: string;
  ai_classification_subcategory: string;
  ai_priority: TicketPriority;
  location_in_store: string;
  status: TicketStatus;
  assigned_service_provider_id?: string;
  sla_deadline: string;
  created_at: string;
  assigned_at?: string;
  accepted_at?: string;
  completed_at?: string;
  closed_at?: string;
  store?: Store;
  assigned_provider?: ServiceProvider;
  reporter?: User;
}

export interface TicketAssignment {
  id: string;
  ticket_id: string;
  service_provider_id: string;
  assignment_sequence: number;
  assigned_at: string;
  status: 'proposed' | 'accepted' | 'rejected' | 'expired';
  accepted_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  accepted_emp_id?: string;
  accepted_phone_number?: string;
}

export interface Remark {
  id: string;
  ticket_id: string;
  user_id: string;
  remark_text: string;
  created_at: string;
  user?: User;
}

export interface Escalation {
  id: string;
  ticket_id: string;
  escalation_trigger_event: string;
  triggered_at: string;
  escalated_to_user_id: string;
  status: 'triggered' | 'acknowledged' | 'resolved';
  resolution_notes?: string;
}

export interface DashboardMetrics {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  completed_tickets: number;
  sla_compliance_rate: number;
  avg_resolution_time: number;
}

export interface AIClassification {
  category: string;
  subcategory: string;
  priority: TicketPriority;
  confidence: number;
}