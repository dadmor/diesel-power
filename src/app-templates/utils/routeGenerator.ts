// src/app-templates/utils/routeGenerator.ts
// Generowanie ścieżek i konfiguracji na podstawie schematu

import { Vendor } from '../../vendor_apps';

export interface AppRoute {
  path: string;
  title: string;
  icon: string;
  roles: string[];
  category?: string;
}

export interface PageConfig {
  title: string;
  table?: string;
  actions: string[];
  filters: string[];
  widgets?: WidgetConfig[];
}

export interface WidgetConfig {
  type: 'stats' | 'table' | 'chart' | 'recent';
  title: string;
  table?: string;
  size: 'sm' | 'md' | 'lg' | 'full';
}

export const generateRoutes = (vendor: Vendor): AppRoute[] => {
  const routes: AppRoute[] = [
    {
      path: '/home',
      title: 'Dashboard',
      icon: '🏠',
      roles: ['admin', 'agent', 'customer', 'supervisor'],
      category: 'main'
    }
  ];

  // Podstawowe ścieżki dla tabel
  vendor.schema.tables.forEach(table => {
    routes.push({
      path: `/${table.name}`,
      title: formatTableName(table.name),
      icon: getTableIcon(table.name),
      roles: ['admin', 'agent', 'customer', 'supervisor'],
      category: 'tables'
    });
  });

  // Ścieżki administracyjne (jeśli system ma role)
  if (hasRoleSystem(vendor.schema)) {
    vendor.schema.tables.forEach(table => {
      routes.push({
        path: `/admin/${table.name}`,
        title: `Admin: ${formatTableName(table.name)}`,
        icon: '⚙️',
        roles: ['admin'],
        category: 'admin'
      });

      routes.push({
        path: `/supervisor/${table.name}`,
        title: `Supervisor: ${formatTableName(table.name)}`,
        icon: '👨‍💼',
        roles: ['admin', 'supervisor'],
        category: 'supervisor'
      });
    });
  }

  return routes;
};

export const generatePageConfig = (vendor: Vendor, path: string, userRole: string): PageConfig => {
  if (path === '/home') {
    return {
      title: `${vendor.name} - Dashboard`,
      actions: ['refresh'],
      filters: [],
      widgets: [
        {
          type: 'stats',
          title: 'Statystyki systemu',
          size: 'full'
        },
        ...vendor.schema.tables.slice(0, 3).map(table => ({
          type: 'recent' as const,
          title: `Ostatnie ${formatTableName(table.name)}`,
          table: table.name,
          size: 'md' as const
        }))
      ]
    };
  }

  const tableName = path.replace(/^\/(?:admin\/|supervisor\/)?/, '');
  const table = vendor.schema.tables.find(t => t.name === tableName);
  
  if (!table) {
    return { title: 'Nie znaleziono', actions: [], filters: [] };
  }

  return {
    title: formatTableName(table.name),
    table: table.name,
    actions: getActionsForRole(userRole, path),
    filters: table.columns
      .filter(col => col.type === 'text' || col.enum)
      .map(col => col.name)
  };
};

const formatTableName = (name: string): string => {
  const translations: Record<string, string> = {
    'users': 'Użytkownicy',
    'tickets': 'Zgłoszenia',
    'comments': 'Komentarze',
    'categories': 'Kategorie',
    'customers': 'Klienci',
    'deals': 'Okazje',
    'products': 'Produkty',
    'orders': 'Zamówienia'
  };
  
  return translations[name] || name.charAt(0).toUpperCase() + name.slice(1);
};

const getTableIcon = (tableName: string): string => {
  const iconMap: Record<string, string> = {
    'users': '👥',
    'tickets': '🎫',
    'comments': '💬',
    'categories': '📂',
    'customers': '🏢',
    'deals': '💰',
    'products': '📦',
    'orders': '🛒'
  };
  return iconMap[tableName] || '📋';
};

const getActionsForRole = (role: string, path: string): string[] => {
  if (path.startsWith('/admin/')) {
    return ['create', 'edit', 'delete', 'export', 'import', 'bulk-edit'];
  }
  
  if (path.startsWith('/supervisor/')) {
    return ['create', 'edit', 'assign', 'approve', 'export'];
  }
  
  switch (role) {
    case 'admin':
      return ['create', 'edit', 'delete', 'export'];
    case 'agent':
    case 'supervisor':
      return ['create', 'edit', 'assign'];
    case 'customer':
      return ['create'];
    default:
      return [];
  }
};

const hasRoleSystem = (schema: any): boolean => {
  return schema.tables.some((table: any) => 
    table.columns.some((col: any) => col.name === 'role')
  );
};