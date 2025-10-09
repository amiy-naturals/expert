import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getConfig } from "./env";

let client: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (client) return client;
  const config = getConfig();
  client = createClient(config.supabaseUrl, config.supabaseServiceKey);
  return client;
}
