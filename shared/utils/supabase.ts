import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Create a singleton Supabase client
let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create the Supabase client
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not found in environment variables");
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}

/**
 * Load all survey responses from Supabase
 */
export async function loadResponses(): Promise<any[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("survey_responses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading responses:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error loading responses:", error);
    return [];
  }
}

/**
 * Save a survey response to Supabase
 */
export async function saveResponse(responseData: any): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("survey_responses")
      .insert([{ data: responseData }]);

    if (error) {
      console.error("Error saving response:", error);
      alert("Failed to save response: " + error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error saving response:", error);
    alert("Failed to save response. Please try again.");
    return false;
  }
}
