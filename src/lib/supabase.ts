// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { createTableName } from './utils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Brak konfiguracji Supabase - sprawdź zmienne środowiskowe');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sprawdzanie czy wszystko istnieje
export async function checkConnection() {
  try {
    // Sprawdź tabele vendors
    const { error: vendorsError } = await supabase.from('vendors').select('id').limit(1);
    const hasVendorsTable = !vendorsError || vendorsError.code !== '42P01';

    // Sprawdź funkcję exec_sql
    const { error: funcError } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    const hasExecFunction = !funcError;

    return { hasVendorsTable, hasExecFunction };
  } catch {
    return { hasVendorsTable: false, hasExecFunction: false };
  }
}

// Tworzenie całej infrastruktury w jednym SQL
export async function createBaseTables() {
  const sql = `
    -- Tabela vendors
    CREATE TABLE IF NOT EXISTS vendors (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      schema JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Funkcja exec_sql
    CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
    RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER
    AS $$ 
    BEGIN 
      EXECUTE sql; 
      RETURN 'OK';
    EXCEPTION 
      WHEN OTHERS THEN 
        RETURN SQLERRM; 
    END; 
    $$;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw new Error(`Setup failed: ${error.message}`);
  return { success: true };
}

// Vendor operations
export async function saveVendor(vendor: { slug: string; name: string; schema: object }) {
  const { data, error } = await supabase.from('vendors').insert(vendor).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getVendorBySlug(slug: string) {
  const { data, error } = await supabase.from('vendors').select('*').eq('slug', slug).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getVendors() {
  const { data, error } = await supabase.from('vendors').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

// Tworzenie tabel vendora - Z DEBUGIEM
export async function createTables(slug: string, tables: Array<{name: string, fields: Array<{name: string, type: string}>}>) {
  console.log('🔨 createTables called with:', { slug, tables });
  
  const createStatements = tables.map(table => {
    const tableName = createTableName(slug, table.name);
    console.log(`📋 Creating table: ${tableName}`);
    
    const columns = table.fields.map(field => {
      const type = field.type === 'number' ? 'INTEGER' : 
                   field.type === 'boolean' ? 'BOOLEAN' : 
                   field.type === 'date' ? 'DATE' : 'TEXT';
      console.log(`  - Field: ${field.name} (${field.type} → ${type})`);
      return `${field.name} ${type}`;
    }).join(', ');
    
    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      ${columns},
      created_at TIMESTAMP DEFAULT NOW()
    );`;
    
    console.log(`📝 Generated SQL for ${tableName}:`, sql);
    return sql;
  }).join('\n');

  console.log('🚀 Full SQL to execute:', createStatements);

  const { data, error } = await supabase.rpc('exec_sql', { sql: createStatements });
  
  console.log('📡 Supabase RPC response:', { data, error });
  
  if (error) {
    console.error('❌ SQL execution failed:', error);
    throw new Error(`Table creation failed: ${error.message}`);
  }
  
  if (data && data !== 'OK') {
    console.error('❌ SQL returned error:', data);
    throw new Error(`SQL error: ${data}`);
  }
  
  console.log('✅ Tables created successfully');
}