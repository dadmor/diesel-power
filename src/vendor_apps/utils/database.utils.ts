import { ColumnType } from '../types/vendor.types';
import { supabase } from '../config/supabase';

export const mapColType = (t: ColumnType) =>
  t === 'text'
    ? 'TEXT'
    : t === 'integer'
    ? 'INTEGER'
    : t === 'boolean'
    ? 'BOOLEAN'
    : 'TIMESTAMP WITH TIME ZONE';

export const execVendorSQL = async (slug: string, sql: string) => {
  const { error } = await supabase.rpc('exec_vendor_sql', { 
    vendor_slug: slug, 
    sql: sql 
  });
  if (error) throw new Error(`Błąd wykonywania SQL: ${error.message}`);
};