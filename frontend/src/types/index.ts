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
  // Outbound only: did the provider actually accept it? Blank for inbound.
  delivery_status?: 'pending' | 'sent' | 'failed' | '';
  sent_at: string;
}

// Matches apps/audit/models.py. This was previously typed for django-auditlog
// (timestamp/actor/content_type/object_repr/changes, numeric action) — none of
// those field names exist on this API, so every cell rendered blank.
export interface AuditLog {
  id: number;
  created_at: string;
  admin_user: string | null;      // username, null for system actions
  action: string;                 // e.g. "created", "updated", "activated"
  entity_type: string;            // e.g. "Tenant", "FlowStep"
  entity_id: string;
  diff?: Record<string, unknown> | null;
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
