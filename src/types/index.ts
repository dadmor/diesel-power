// src/types/index.ts
export interface Field {
  name: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'date' | 'checkbox' | 'boolean' | 'select';
  options?: string[];
}

export interface Table {
  name: string;
  fields: Field[];
}

export interface Vendor {
  id: string;
  slug: string;
  name: string;
  schema: { tables: Table[] };
  created_at: string;
}

export interface CreateVendorTag {
  name: string;
  slug: string;
  schema: string;
}