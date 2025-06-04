// src/appsPanel/api.ts - ZOPTYMALIZOWANY z relacjami
const SUPABASE_URL = "https://vvkjfzjikfuqdpmomdbx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2a2pmemppa2Z1cWRwbW9tZGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4OTE2NTcsImV4cCI6MjA2NDQ2NzY1N30.sVejmzInkxXnGxjm5rowJKuwTuVrcJ40Ix3Dk1W3ogE";

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

export const api = {
  // PODSTAWOWE CRUD dla vendorów
  async getVendors() {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vendors?select=*&order=created_at.desc`,
      { headers }
    );
    return res.json();
  },

  async getVendor(slug: string) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vendors?slug=eq.${slug}&select=*`,
      { headers }
    );
    const data = await res.json();
    return data[0];
  },

  async addVendor(vendor: any) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/vendors`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify(vendor),
    });
    const result = await res.json();

    // Zapisz konfigurację tabel w _system_tables
    if (vendor.schema?.tables) {
      for (const table of vendor.schema.tables) {
        await this.saveTableConfig(vendor.slug, table);
      }
    }

    return result;
  },

  async updateVendor(id: string, vendor: any) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/vendors?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify(vendor),
    });
    return res.json();
  },

  async deleteVendor(id: string) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/vendors?id=eq.${id}`, {
      method: "DELETE",
      headers,
    });
    return res.ok;
  },

  // NOWE: Zarządzanie konfiguracją tabel
  async saveTableConfig(vendorSlug: string, table: any) {
    await fetch(`${SUPABASE_URL}/rest/v1/_system_tables`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        vendor_slug: vendorSlug,
        table_name: table.name,
        columns: table,
      }),
    });
  },

  // NOWE: API dla aplikacji vendora z relacjami
  async getVendorData(vendorSlug: string, tableName: string, filters?: any) {
    const fullTableName = `${vendorSlug}_${tableName}`;
    let url = `${SUPABASE_URL}/rest/v1/${fullTableName}?select=*`;

    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) url += `&${key}=eq.${filters[key]}`;
      });
    }

    try {
      const res = await fetch(url, { headers });
      return res.ok ? res.json() : [];
    } catch {
      return [];
    }
  },

  async createVendorRecord(vendorSlug: string, tableName: string, data: any) {
    const fullTableName = `${vendorSlug}_${tableName}`;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${fullTableName}`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateVendorRecord(
    vendorSlug: string,
    tableName: string,
    id: string,
    data: any
  ) {
    const fullTableName = `${vendorSlug}_${tableName}`;
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${fullTableName}?id=eq.${id}`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(data),
      }
    );
    return res.json();
  },

  async deleteVendorRecord(vendorSlug: string, tableName: string, id: string) {
    const fullTableName = `${vendorSlug}_${tableName}`;
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${fullTableName}?id=eq.${id}`,
      {
        method: "DELETE",
        headers,
      }
    );
    return res.ok;
  },

  // NOWE: Obsługa relacji
  async getRelationOptions(vendorSlug: string, tableName: string) {
    const fullTableName = `${vendorSlug}_${tableName}`;
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${fullTableName}?select=id,name`,
        { headers }
      );
      const data = await res.json();
      return data.map((item: any) => ({
        value: item.id,
        label: item.name || item.id,
      }));
    } catch {
      return [];
    }
  },

  async getTableConfig(vendorSlug: string, tableName: string) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/_system_tables?vendor_slug=eq.${vendorSlug}&table_name=eq.${tableName}`,
      { headers }
    );
    const data = await res.json();
    return data[0]?.columns || {};
  },
};
