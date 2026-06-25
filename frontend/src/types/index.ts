export interface Tenant {
  id: number;
  name: string;
  wa_phone_number: string;
  wa_phone_number_id: string;
  ig_account_id: string;
  greeting_message: string;
  closing_message: string;
  handoff_enabled: boolean;
  handoff_email: string;
  is_active: boolean;
  created_at: string;
  // Phase 6.2: added by backend when it ships
  wa_connected?: boolean;
  ig_connected?: boolean;
}

export interface FlowStep {
  id: number;
  tenant: number;
  label: string;
  message_text: string;
  is_start: boolean;
  is_terminal: boolean;
  created_at: string;
  options: FlowOption[];
}

export interface FlowOption {
  id: number;
  step: number;
  button_label: string;
  next_step: number | null;
}

export interface Session {
  id: number;
  tenant: number;
  channel: 'whatsapp' | 'instagram';
  customer_identifier: string;
  current_step: number | null;
  status: 'active' | 'completed' | 'handed_off';
  started_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  session: number;
  direction: 'inbound' | 'outbound';
  content: string;
  channel: 'whatsapp' | 'instagram';
  provider_message_id: string;
  sent_at: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  actor: string | null;
  verb?: string;
  action?: number;          // 0=create 1=update 2=delete (django-auditlog)
  content_type?: string;
  object_repr?: string;
  changes?: Record<string, [unknown, unknown]> | string | null;
  remote_addr?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string }>;
}
