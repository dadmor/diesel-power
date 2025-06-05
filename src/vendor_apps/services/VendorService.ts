import { Vendor } from '../types/vendor.types';
import { supabase } from '../config/supabase';
import { mapColType, execVendorSQL } from '../utils/database.utils';

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

    const slug = data.slug;
    
    const createTablesSQL = vendor.schema.tables
      .map((table) => {
        const tableName = `${slug}_${table.name}`;
        const columns = table.columns
          .map((col) => {
            let def = `${col.name} ${mapColType(col.type)}`;
            if (col.required) def += ' NOT NULL';
            if (col.enum) def += ` CHECK (${col.name} IN (${col.enum.map((v) => `'${v}'`).join(', ')}))`;
            return def;
          })
          .join(', ');

        return `
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
  FOR ALL USING (vendor_slug = '${slug}');
CREATE INDEX IF NOT EXISTS ${tableName}_vendor_idx ON ${tableName}(vendor_slug);
`;
      })
      .join('\n');

    const foreignKeysSQL = vendor.schema.tables
      .map((table) => {
        const tableName = `${slug}_${table.name}`;
        return table.columns
          .filter((col) => col.foreignKey)
          .map((col) => {
            const fk = col.foreignKey!;
            const targetTable = `${slug}_${fk.table}`;
            const constraintName = `${tableName}_${col.name}_fkey`;
            const onDelete = fk.onDelete || 'NO ACTION';
            const onUpdate = fk.onUpdate || 'NO ACTION';
            
            return `
ALTER TABLE ${tableName} 
ADD CONSTRAINT ${constraintName} 
FOREIGN KEY (${col.name}) 
REFERENCES ${targetTable}(${fk.column})
ON DELETE ${onDelete}
ON UPDATE ${onUpdate};
`;
          })
          .join('\n');
      })
      .join('\n');

    const sql = createTablesSQL + '\n' + foreignKeysSQL;

    try {
      await execVendorSQL(slug, sql);
      return data;
    } catch (tableError) {
      await supabase.from('vendors').delete().eq('id', data.id);
      throw tableError;
    }
  }

  static async updateVendor(
    id: string,
    updates: Partial<Omit<Vendor, 'id'>>,
  ): Promise<Vendor> {
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
    const slug = vendor.slug;
    const sql = vendor.schema.tables
      .map((table) => `DROP TABLE IF EXISTS ${slug}_${table.name} CASCADE;`)
      .join('\n');

    await execVendorSQL(slug, sql);

    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', vendor.id);
    if (error) throw error;
  }
}