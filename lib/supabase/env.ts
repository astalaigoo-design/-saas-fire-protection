export type SupabaseStorageConfig = {
  url: string;
  serviceRoleKey: string;
  bucket: string;
};

export function getSupabaseStorageConfig(): SupabaseStorageConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket =
    process.env.SUPABASE_STORAGE_BUCKET?.trim() || "inspection-photos";

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing. Add it from Supabase → Project Settings → API.",
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing. Add it from Supabase → Project Settings → API (service_role, server only).",
    );
  }

  return { url, serviceRoleKey, bucket };
}

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export type SupabaseStorageStatus = {
  configured: boolean;
  bucket: string;
};

export function getSupabaseStorageStatus(): SupabaseStorageStatus {
  return {
    configured: isSupabaseStorageConfigured(),
    bucket: process.env.SUPABASE_STORAGE_BUCKET?.trim() || "inspection-photos",
  };
}
