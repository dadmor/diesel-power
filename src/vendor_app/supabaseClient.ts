// src/vendor_app/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// W Vite zmienne środowiskowe muszą zaczynać się od VITE_
// Upewnij się, że w pliku .env masz np.:
// VITE_SUPABASE_URL=https://xyz.supabase.co
// VITE_SUPABASE_ANON_KEY=twój_anon_key

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
