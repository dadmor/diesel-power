// ===== src/lib/supabase.ts - POPRAWIONY =====
import { createClient } from '@supabase/supabase-js';
import { Vendor } from '../types';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const checkConnection = async () => {
  const { error: connectionError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .limit(1);

  if (connectionError) throw new Error(`Połączenie: ${connectionError.message}`);

  const { error: vendorsError } = await supabase.from('vendors').select('id').limit(1);
  const { error: funcError } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });

  return {
    hasVendorsTable: !vendorsError,
    hasExecFunction: !funcError
  };
};

export const createTables = async (slug: string, tables: any[]) => {
  for (const table of tables) {
    const tableName = `${slug}_${table.name}`;
    const columns = table.fields.map((f: any) => {
      const type = f.type === 'number' ? 'NUMERIC' : f.type === 'date' ? 'TIMESTAMP' : 'TEXT';
      return `${f.name} ${type}`;
    }).join(', ');

    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (
      id SERIAL PRIMARY KEY, ${columns},
      created_at TIMESTAMP DEFAULT NOW()
    );`;

    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
  }
};

export const saveVendor = async (vendor: Omit<Vendor, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('vendors').insert([vendor]).select().single();
  if (error) throw error;
  return data;
};

export const getVendor = async (slug: string) => {
  const { data, error } = await supabase.from('vendors').select('*').eq('slug', slug).single();
  if (error) throw error;
  return data;
};