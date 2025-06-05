// types.ts
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface Column {
  name: string;
  type: 'text' | 'integer' | 'boolean' | 'timestamp';
  required?: boolean;
  enum?: string[];
}

export interface Table {
  name: string;
  columns: Column[];
}

export interface Schema {
  tables: Table[];
}

export interface Vendor {
  id?: string;
  slug: string;
  name: string;
  schema: Schema;
  created_at?: string;
  updated_at?: string;
}

// Używamy SupabaseUser zamiast własnego User
export type User = SupabaseUser;

export interface AuthContextType {
  user: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}