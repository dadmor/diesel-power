// src/app-templates/services/VendorAppService.ts
// Serwis do komunikacji z bazą danych dla aplikacji vendora

import { execVendorSQL } from '../../vendor_apps/utils/database.utils';

export class VendorAppService {
  static async getTableData(
    vendorSlug: string, 
    tableName: string, 
    filters?: Record<string, any>,
    limit = 100
  ): Promise<any[]> {
    try {
      let sql = `SELECT * FROM ${vendorSlug}_${tableName}`;
      const conditions: string[] = [];
      
      // Dodaj filtry
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            if (typeof value === 'string') {
              conditions.push(`${key} ILIKE '%${value}%'`);
            } else {
              conditions.push(`${key} = '${value}'`);
            }
          }
        });
      }
      
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      sql += ` ORDER BY created_at DESC LIMIT ${limit}`;
      
      await execVendorSQL(vendorSlug, sql);
      // Tutaj będą rzeczywiste dane z bazy
      return [];
    } catch (error) {
      console.error('Error fetching table data:', error);
      return [];
    }
  }

  static async createRecord(
    vendorSlug: string,
    tableName: string,
    data: Record<string, any>
  ): Promise<any> {
    try {
      const columns = Object.keys(data).join(', ');
      const values = Object.values(data)
        .map(v => typeof v === 'string' ? `'${v}'` : v)
        .join(', ');
      
      const sql = `
        INSERT INTO ${vendorSlug}_${tableName} (${columns}) 
        VALUES (${values}) 
        RETURNING *
      `;
      
      await execVendorSQL(vendorSlug, sql);
      return { id: Date.now(), ...data };
    } catch (error) {
      console.error('Error creating record:', error);
      throw error;
    }
  }

  static async updateRecord(
    vendorSlug: string,
    tableName: string,
    id: string | number,
    data: Record<string, any>
  ): Promise<any> {
    try {
      const updates = Object.entries(data)
        .map(([key, value]) => `${key} = '${value}'`)
        .join(', ');
      
      const sql = `
        UPDATE ${vendorSlug}_${tableName} 
        SET ${updates}, updated_at = NOW() 
        WHERE id = ${id} 
        RETURNING *
      `;
      
      await execVendorSQL(vendorSlug, sql);
      return { id, ...data };
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  }

  static async deleteRecord(
    vendorSlug: string,
    tableName: string,
    id: string | number
  ): Promise<void> {
    try {
      const sql = `DELETE FROM ${vendorSlug}_${tableName} WHERE id = ${id}`;
      await execVendorSQL(vendorSlug, sql);
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }

  static async getTableStats(vendorSlug: string): Promise<Record<string, number>> {
    try {
      // Pobierz statystyki dla wszystkich tabel vendora
      const stats: Record<string, number> = {};
      
      // Tu będzie prawdziwe zapytanie do bazy
      // Na razie zwracamy przykładowe dane
      return {
        users: Math.floor(Math.random() * 100) + 10,
        tickets: Math.floor(Math.random() * 200) + 20,
        comments: Math.floor(Math.random() * 500) + 50
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {};
    }
  }
}
