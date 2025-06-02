// ===== src/supabaseClient.ts =====
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const createVendorTables = async (vendorSlug: string, schema: any) => {
  const tables = [];
  
  for (const table of schema.tables) {
    const tableName = `${vendorSlug}_${table.name}`;
    
    // Budowanie SQL dla CREATE TABLE
    const columns = table.fields.map((field: any) => {
      let sqlType = 'TEXT';
      switch (field.type) {
        case 'number':
          sqlType = 'NUMERIC';
          break;
        case 'date':
          sqlType = 'TIMESTAMP';
          break;
        case 'boolean':
          sqlType = 'BOOLEAN';
          break;
        case 'text':
        case 'select':
        default:
          sqlType = 'TEXT';
      }
      return `${field.name} ${sqlType}`;
    }).join(', ');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        ${columns},
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql: createTableSQL });
      tables.push(tableName);
    } catch (error) {
      console.error(`Error creating table ${tableName}:`, error);
    }
  }
  
  return tables;
};

export const saveVendor = async (vendor: Omit<Vendor, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('vendors')
    .insert([vendor])
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const getVendor = async (slug: string) => {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('slug', slug)
    .single();
    
  if (error) throw error;
  return data;
};