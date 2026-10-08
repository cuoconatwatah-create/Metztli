// ─────────────────────────────────────────────────────────
// Metztli — Roles (Administrador, Usuario, Auditor): acceso a datos
//
// Los permisos reales los aplica Supabase (RLS + funciones SECURITY DEFINER,
// migración 006). Esto solo consulta y muestra lo que la base ya permite.
// ─────────────────────────────────────────────────────────

import { supabase } from '@/lib/supabase';

export type AppRole = 'admin' | 'user' | 'auditor';
export const ROLES: AppRole[] = ['admin', 'user', 'auditor'];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  user: 'Usuario',
  auditor: 'Auditor',
};

export function isRole(value: unknown): value is AppRole {
  return typeof value === 'string' && (ROLES as string[]).includes(value);
}

export interface AdminUser {
  uid: string;
  name: string | null;
  email_masked: string;
  user_role: AppRole;
  joined_at: string;
}

export interface AuditEvent {
  id: number;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AuditStats {
  users_total: number;
  by_role: Partial<Record<AppRole, number>>;
  forum_posts: number;
  myths: number;
  daily_logs: number;
  pregnancies_active: number;
  audit_events: number;
  generated_at: string;
}

export interface ForumPostRow {
  id: string;
  alias: string;
  category: string;
  question: string;
  created_at: string;
}

export interface MythRow {
  id: string;
  category: 'ciclo' | 'embarazo' | 'menopausia';
  myth: string;
  reality: string;
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/** Rol de la sesión actual; null si no hay sesión. */
export async function fetchMyRole(): Promise<AppRole | null> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return null;
  const row = unwrap(await supabase.from('user_roles').select('role').eq('user_id', uid).maybeSingle());
  return isRole((row as any)?.role) ? ((row as any).role as AppRole) : 'user';
}

// ── Administrador ──
export async function adminListUsers(): Promise<AdminUser[]> {
  return unwrap(await supabase.rpc('admin_list_users')) as AdminUser[];
}

export async function setUserRole(target: string, role: AppRole): Promise<void> {
  unwrap(await supabase.rpc('set_user_role', { target, new_role: role }));
}

export async function listForumPosts(limit = 50): Promise<ForumPostRow[]> {
  return unwrap(
    await supabase.from('forum_posts').select('id, alias, category, question, created_at').order('created_at', { ascending: false }).limit(limit)
  ) as ForumPostRow[];
}

/** Elimina una publicación. Devuelve false si la base no la borró (sin permiso o ya no existe). */
export async function deleteForumPost(id: string): Promise<boolean> {
  const rows = unwrap(await supabase.from('forum_posts').delete().eq('id', id).select('id')) as unknown[];
  return rows.length > 0;
}

export async function listMyths(): Promise<MythRow[]> {
  return unwrap(await supabase.from('myths').select('id, category, myth, reality').order('id')) as MythRow[];
}

export async function createMyth(m: Omit<MythRow, 'id'>): Promise<void> {
  const id = `x${Date.now().toString(36)}`;
  unwrap(await supabase.from('myths').insert({ id, ...m }));
}

export async function deleteMyth(id: string): Promise<boolean> {
  const rows = unwrap(await supabase.from('myths').delete().eq('id', id).select('id')) as unknown[];
  return rows.length > 0;
}

// ── Auditoría (administrador y auditor) ──
export async function fetchAuditStats(): Promise<AuditStats> {
  return unwrap(await supabase.rpc('audit_stats')) as AuditStats;
}

export async function fetchAuditLog(limit = 50): Promise<AuditEvent[]> {
  return unwrap(
    await supabase
      .from('audit_log')
      .select('id, actor_id, actor_role, action, target_table, target_id, details, created_at')
      .order('id', { ascending: false })
      .limit(limit)
  ) as AuditEvent[];
}
