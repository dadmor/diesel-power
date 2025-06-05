// services.ts
import { supabase } from './auth';
import { Vendor, Column } from './types';

export class TableService {
  static async createVendorTables(vendor: Vendor): Promise<void> {
    const { schema, slug } = vendor;
    
    await supabase.rpc('set_vendor_context', { vendor_slug: slug });
    
    for (const table of schema.tables) {
      const tableName = `${slug}_${table.name}`;
      
      const columns = table.columns.map(col => {
        let columnDef = `${col.name} ${this.mapColumnType(col.type)}`;
        if (col.required) columnDef += ' NOT NULL';
        if (col.enum) columnDef += ` CHECK (${col.name} IN (${col.enum.map(v => `'${v}'`).join(', ')}))`;
        return columnDef;
      }).join(', ');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id BIGSERIAL PRIMARY KEY,
          ${columns},
          vendor_slug TEXT DEFAULT '${slug}' NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT ${tableName}_vendor_check CHECK (vendor_slug = '${slug}')
        );
        
        ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "${tableName}_vendor_policy" ON ${tableName}
          FOR ALL USING (vendor_slug = current_setting('jwt.claims.vendor_slug', true));
        
        CREATE INDEX IF NOT EXISTS ${tableName}_vendor_idx ON ${tableName}(vendor_slug);
      `;
      
      const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      if (error) {
        console.error(`Error creating table ${tableName}:`, error);
        throw new Error(`Failed to create table ${tableName}: ${error.message}`);
      }
    }
  }
  
  static async dropVendorTables(vendor: Vendor): Promise<void> {
    const { schema, slug } = vendor;
    
    await supabase.rpc('set_vendor_context', { vendor_slug: slug });
    
    for (const table of schema.tables) {
      const tableName = `${slug}_${table.name}`;
      const dropTableSQL = `DROP TABLE IF EXISTS ${tableName} CASCADE;`;
      
      const { error } = await supabase.rpc('exec_sql', { sql: dropTableSQL });
      if (error) {
        console.error(`Error dropping table ${tableName}:`, error);
      }
    }
  }
  
  static mapColumnType(type: Column['type']): string {
    switch (type) {
      case 'text': return 'TEXT';
      case 'integer': return 'INTEGER';
      case 'boolean': return 'BOOLEAN';
      case 'timestamp': return 'TIMESTAMP WITH TIME ZONE';
      default: return 'TEXT';
    }
  }
}

export class VendorService {
  static async getVendors(): Promise<Vendor[]> {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  static async createVendor(vendor: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>): Promise<Vendor> {
    const { data, error } = await supabase
      .from('vendors')
      .insert([vendor])
      .select()
      .single();
    
    if (error) throw error;
    
    try {
      await TableService.createVendorTables(data);
      return data;
    } catch (tableError) {
      await supabase.from('vendors').delete().eq('id', data.id);
      throw tableError;
    }
  }
  
  static async updateVendor(id: string, updates: Partial<Omit<Vendor, 'id'>>): Promise<Vendor> {
    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async deleteVendor(vendor: Vendor): Promise<void> {
    await TableService.dropVendorTables(vendor);
    
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', vendor.id);
    
    if (error) throw error;
  }
}
