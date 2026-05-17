import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseStorageConfig } from "@/lib/supabase/env";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const { url, serviceRoleKey } = getSupabaseStorageConfig();
    adminClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}
