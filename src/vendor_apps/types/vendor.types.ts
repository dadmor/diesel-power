export type ColumnType = 'text' | 'integer' | 'boolean' | 'timestamp';

export interface Column {
  name: string;
  type: ColumnType;
  required?: boolean;
  enum?: string[];
  foreignKey?: {
    table: string;
    column: string;
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
    onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  };
}

export interface Table {
  name: string;
  columns: Column[];
}

export interface Schema {
  tables: Table[];
}

export interface Vendor {
  id?: string;
  slug: string;
  name: string;
  schema: Schema;
  created_at?: string;
  updated_at?: string;
}