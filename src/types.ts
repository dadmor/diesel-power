// ===== src/types.ts =====
export interface FieldSchema {
    name: string;
    type: 'string' | 'number' | 'text' | 'date' | 'boolean' | 'select';
    options?: string[]; // dla select
  }
  
  export interface TableSchema {
    name: string;
    fields: FieldSchema[];
  }
  
  export interface VendorSchema {
    tables: TableSchema[];
  }
  
  export interface Vendor {
    id: string;
    slug: string;
    name: string;
    schema: VendorSchema;
    created_at: string;
  }
  
  export interface CreateVendorTag {
    name: string;
    slug: string;
    schema: string;
  }