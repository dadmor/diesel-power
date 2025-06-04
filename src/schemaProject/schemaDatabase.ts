// src/lib/schemaDatabase.ts
import { createClient } from '@supabase/supabase-js';
import { validator } from './schemaValidator';

// Użyj swojego istniejącego klienta Supabase lub utwórz nowy
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class SchemaDatabase {
  
  static async createProject(projectData: any) {
    // Walidacja danych
    const validation = validator.validateProject(projectData);
    if (!validation.valid) {
      throw new Error(`Błąd walidacji: ${JSON.stringify(validation.errors)}`);
    }

    const { data, error } = await supabase
      .from('schema_projects')
      .insert([{
        ...projectData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw new Error(`Błąd tworzenia projektu: ${error.message}`);
    return data;
  }

  static async updateProject(id: string, updates: any) {
    // Walidacja aktualizacji
    const validation = validator.validateProjectUpdate(updates);
    if (!validation.valid) {
      throw new Error(`Błąd walidacji: ${JSON.stringify(validation.errors)}`);
    }

    const { data, error } = await supabase
      .from('schema_projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Błąd aktualizacji: ${error.message}`);
    return data;
  }

  static async createSession(sessionData: any) {
    // Walidacja sesji
    const validation = validator.validateSession(sessionData);
    if (!validation.valid) {
      throw new Error(`Błąd walidacji sesji: ${JSON.stringify(validation.errors)}`);
    }

    const { data, error } = await supabase
      .from('schema_sessions')
      .insert([{
        ...sessionData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw new Error(`Błąd tworzenia sesji: ${error.message}`);
    return data;
  }

  // Pozostałe metody bez zmian...
  static async getProject(id: string) {
    const { data, error } = await supabase
      .from('schema_projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Błąd odczytu: ${error.message}`);
    }
    return data;
  }

  static async listProjects(limit = 50) {
    const { data, error } = await supabase
      .from('schema_projects')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(`Błąd listowania: ${error.message}`);
    return data || [];
  }
}

// SQL dla bazy danych (bez zmian w strukturze)
export const SCHEMA_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS schema_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  schema JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('draft', 'complete', 'deployed', 'archived')),
  CONSTRAINT valid_category CHECK (category IS NULL OR category IN ('ecommerce', 'crm', 'cms', 'dashboard', 'tool', 'other'))
);

CREATE TABLE IF NOT EXISTS schema_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES schema_projects(id) ON DELETE CASCADE,
  layer TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_layer CHECK (layer IN ('concept', 'database', 'ui', 'refine'))
);

CREATE INDEX IF NOT EXISTS idx_schema_projects_status ON schema_projects(status);
CREATE INDEX IF NOT EXISTS idx_schema_projects_updated_at ON schema_projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_schema_sessions_project_id ON schema_sessions(project_id);
`;