// types.ts - Uproszczone typy
export interface AppSchema {
    name: string;
    description: string;
    category: string;
  }
  
  export interface DatabaseField {
    name: string;
    type: string;
  }
  
  export interface DatabaseTable {
    name: string;
    fields: DatabaseField[];
  }
  
  export interface DatabaseRelation {
    from: string;
    to: string;
    type: string;
  }
  
  export interface DatabaseSchema {
    tables?: DatabaseTable[];
    relations?: DatabaseRelation[];
  }
  
  export interface UIPage {
    title: string;
    type: string;
    table: string;
  }
  
  export interface UITheme {
    primary: string;
    layout: string;
  }
  
  export interface UISchema {
    pages?: UIPage[];
    theme?: UITheme;
  }
  
  export interface ListView {
    table: string;
    columns: string[];
    filters: string[];
  }
  
  export interface FormView {
    table: string;
    fields: string[];
  }
  
  export interface Widget {
    type: string;
    title: string;
    data: string;
  }
  
  export interface RefineSchema {
    listViews?: ListView[];
    formViews?: FormView[];
    widgets?: Widget[];
  }
  
  export interface SchemaState {
    concept: AppSchema | null;
    database: DatabaseSchema | null;
    ui: UISchema | null;
    refine: RefineSchema | null;
  }
  
  export interface ParsedTag {
    tag: string;
    params: Record<string, string>;
  }
  
  export interface Message {
    id: number;
    text: string;
    type: 'user' | 'ai';
    tags: string[];
  }
  
  // Uproszczona warstwa bez ikon
  export interface Layer {
    id: keyof SchemaState;
    name: string;
    description: string;
  }
  
  export type LayerType = keyof SchemaState;
  
  // Konfiguracja tagów
  export interface TagConfig {
    name: string;
    description: string;
    params: string[];
    example: string;
    nextLayer?: LayerType | null;
  }
  
  // Konfiguracja warstwy
  export interface LayerConfig {
    name: string;
    description: string;
    placeholder: string;
    tags: TagConfig[];
  }