// src/app-templates/types/index.ts
// Typy używane w systemie aplikacji

export interface VendorAppConfig {
    vendor: any;
    user: any;
    permissions: Permission[];
  }
  
  export interface RouteConfig {
    path: string;
    component: React.ComponentType<any>;
    title: string;
    icon: string;
    roles: string[];
    category?: string;
  }
  
  export interface PageMeta {
    title: string;
    description?: string;
    breadcrumbs?: Breadcrumb[];
  }
  
  export interface Breadcrumb {
    label: string;
    path?: string;
  }
  
  export interface ActionButton {
    action: string;
    label: string;
    icon: string;
    variant: 'primary' | 'secondary' | 'danger' | 'success';
    permission?: string;
  }
  
  export interface FilterField {
    name: string;
    type: 'text' | 'select' | 'date' | 'boolean';
    options?: string[];
    placeholder?: string;
  }
  
  export interface TableColumn {
    name: string;
    label: string;
    type: string;
    sortable?: boolean;
    filterable?: boolean;
    formatter?: (value: any) => string;
  }