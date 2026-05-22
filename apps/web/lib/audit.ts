// apps/web/lib/audit.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export type AuditAction = 'create' | 'update' | 'delete' | 'generate';
export type AuditEntity = 'tenant' | 'branding' | 'client' | 'project' | 'costing_sheet' | 'costing_item';

export async function audit(
  supa: SupabaseClient,
  args: {
    tenant_id: string;
    user_id: string | null;
    action: AuditAction;
    entity_type: AuditEntity;
    entity_id: string | null;
    diff?: unknown;
  },
) {
  await supa.from('audit_log').insert({
    tenant_id: args.tenant_id,
    user_id: args.user_id,
    action: args.action,
    entity_type: args.entity_type,
    entity_id: args.entity_id,
    diff_json: args.diff ?? null,
  });
}
