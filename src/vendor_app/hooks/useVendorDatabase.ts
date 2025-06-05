// src/vendor_app/hooks/useVendorDatabase.ts
import { useState } from 'react';
import { useSupabase } from '../context/SupabaseProvider';

export interface FilterParams {
  [key: string]: string | number | boolean | undefined;
}

// Hook do pracy z bazą danych vendora
export const useVendorDatabase = (vendorSlug: string) => {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Funkcja do wykonywania SQL dla vendora
  const execVendorSql = async (sql: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.rpc('exec_vendor_sql', {
        vendor_slug: vendorSlug,
        sql: sql
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Funkcja do budowania warunków WHERE na podstawie filtrów
  const buildWhereConditions = (filters: FilterParams): string[] => {
    const conditions: string[] = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'boolean') {
          conditions.push(`${key} = ${value}`);
        } else if (typeof value === 'number') {
          conditions.push(`${key} = ${value}`);
        } else if (key.includes('_min')) {
          // Dla filtrów min/max wartości
          const fieldName = key.replace('_min', '');
          conditions.push(`${fieldName} >= ${value}`);
        } else if (key.includes('_max')) {
          const fieldName = key.replace('_max', '');
          conditions.push(`${fieldName} <= ${value}`);
        } else if (key.includes('_od') || key.includes('_from')) {
          // Dla filtrów dat "od"
          const fieldName = key.replace('_od', '').replace('_from', '');
          conditions.push(`${fieldName} >= '${value}'`);
        } else if (key.includes('_do') || key.includes('_to')) {
          // Dla filtrów dat "do"
          const fieldName = key.replace('_do', '').replace('_to', '');
          conditions.push(`${fieldName} <= '${value}'`);
        } else if (key === 'aktywny') {
          // Specjalne traktowanie dla pola aktywny
          const boolValue = value === 'tak' || value === true;
          conditions.push(`aktywny = ${boolValue}`);
        } else {
          // Standardowe wyszukiwanie tekstowe (LIKE)
          conditions.push(`${key} ILIKE '%${value}%'`);
        }
      }
    });
    
    return conditions;
  };

  // Pobierz dane z tabeli z opcjonalnymi filtrami
  const fetchTableData = async (tableName: string, filters: FilterParams = {}) => {
    let sql = `SELECT * FROM ${vendorSlug}_${tableName}`;
    
    const conditions = buildWhereConditions(filters);
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sql += ` ORDER BY id DESC`;
    
    return await execVendorSql(sql);
  };

  // Pobierz dane z relacjami (np. faktury z nazwami klientów)
  const fetchTableDataWithRelations = async (tableName: string, filters: FilterParams = {}) => {
    if (tableName === 'faktury') {
      let sql = `
        SELECT 
          f.*,
          k.nazwa as klient_nazwa
        FROM ${vendorSlug}_faktury f
        LEFT JOIN ${vendorSlug}_klienci k ON f.klient_id = k.id
      `;
      
      const conditions: string[] = [];
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'klient_nazwa') {
            conditions.push(`k.nazwa ILIKE '%${value}%'`);
          } else if (key === 'status') {
            conditions.push(`f.status = '${value}'`);
          } else if (key === 'data_od') {
            conditions.push(`f.data_wystawienia >= '${value}'`);
          } else if (key === 'data_do') {
            conditions.push(`f.data_wystawienia <= '${value}'`);
          } else if (key === 'wartosc_min') {
            conditions.push(`f.wartosc_brutto >= ${value}`);
          } else if (key === 'wartosc_max') {
            conditions.push(`f.wartosc_brutto <= ${value}`);
          } else if (key === 'numer_faktury') {
            conditions.push(`f.numer_faktury ILIKE '%${value}%'`);
          }
        }
      });
      
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      sql += ` ORDER BY f.id DESC`;
      
      return await execVendorSql(sql);
    }
    
    // Dla innych tabel używaj standardowego fetchTableData
    return await fetchTableData(tableName, filters);
  };

  // Dodaj nowy rekord do tabeli
  const insertRecord = async (tableName: string, data: Record<string, any>) => {
    const fields = Object.keys(data).join(', ');
    const values = Object.values(data).map(value => {
      if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`; // Escape pojedynczych apostrofów
      } else if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
      } else if (value === null || value === undefined) {
        return 'NULL';
      } else {
        return value;
      }
    }).join(', ');

    const sql = `
      INSERT INTO ${vendorSlug}_${tableName} (${fields})
      VALUES (${values})
      RETURNING *
    `;

    return await execVendorSql(sql);
  };

  // Aktualizuj rekord w tabeli
  const updateRecord = async (tableName: string, id: number, data: Record<string, any>) => {
    const updates = Object.entries(data).map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key} = '${value.replace(/'/g, "''")}'`;
      } else if (typeof value === 'boolean') {
        return `${key} = ${value ? 'true' : 'false'}`;
      } else if (value === null || value === undefined) {
        return `${key} = NULL`;
      } else {
        return `${key} = ${value}`;
      }
    }).join(', ');

    const sql = `
      UPDATE ${vendorSlug}_${tableName}
      SET ${updates}
      WHERE id = ${id}
      RETURNING *
    `;

    return await execVendorSql(sql);
  };

  // Usuń rekord z tabeli
  const deleteRecord = async (tableName: string, id: number) => {
    const sql = `DELETE FROM ${vendorSlug}_${tableName} WHERE id = ${id}`;
    return await execVendorSql(sql);
  };

  // Pobierz pojedynczy rekord po ID
  const fetchRecordById = async (tableName: string, id: number) => {
    const sql = `SELECT * FROM ${vendorSlug}_${tableName} WHERE id = ${id}`;
    const result = await execVendorSql(sql);
    return result && result.length > 0 ? result[0] : null;
  };

  // Sprawdź czy tabela istnieje
  const checkTableExists = async (tableName: string): Promise<boolean> => {
    try {
      const sql = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${vendorSlug}_${tableName}'
        )
      `;
      const result = await execVendorSql(sql);
      return result && result[0] && result[0].exists;
    } catch {
      return false;
    }
  };

  // Utwórz tabelę na podstawie schema
  const createTable = async (tableName: string, fields: any[]) => {
    const fieldDefinitions = fields.map(field => {
      let definition = `${field.name}`;
      
      // Mapowanie typów
      switch (field.type) {
        case 'number':
          definition += field.name === 'id' ? ' SERIAL PRIMARY KEY' : ' NUMERIC';
          break;
        case 'string':
          definition += ' TEXT';
          break;
        case 'date':
          definition += ' DATE';
          break;
        case 'boolean':
          definition += ' BOOLEAN DEFAULT false';
          break;
        case 'textarea':
          definition += ' TEXT';
          break;
        case 'email':
          definition += ' TEXT';
          break;
        default:
          definition += ' TEXT';
      }

      // Dodaj constrainty
      if (field.required && field.name !== 'id') {
        definition += ' NOT NULL';
      }
      
      if (field.unique && field.name !== 'id') {
        definition += ' UNIQUE';
      }

      return definition;
    }).join(', ');

    const sql = `
      CREATE TABLE IF NOT EXISTS ${vendorSlug}_${tableName} (
        ${fieldDefinitions},
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    return await execVendorSql(sql);
  };

  return {
    loading,
    error,
    execVendorSql,
    fetchTableData,
    fetchTableDataWithRelations,
    insertRecord,
    updateRecord,
    deleteRecord,
    fetchRecordById,
    checkTableExists,
    createTable
  };
}