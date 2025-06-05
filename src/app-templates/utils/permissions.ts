// src/app-templates/utils/permissions.ts
// Zarządzanie uprawnieniami w aplikacji

export interface Permission {
    action: string;
    resource: string;
    condition?: (user: any, item?: any) => boolean;
  }
  
  export const checkPermission = (
    user: any,
    action: string,
    resource: string,
    item?: any
  ): boolean => {
    // Admin ma wszystkie uprawnienia
    if (user.role === 'admin') return true;
  
    // Sprawdź uprawnienia na podstawie roli i akcji
    switch (action) {
      case 'create':
        return ['admin', 'agent', 'customer'].includes(user.role);
      
      case 'edit':
        if (user.role === 'customer') {
          // Klient może edytować tylko swoje rekordy
          return item && item.created_by === user.id;
        }
        return ['admin', 'agent', 'supervisor'].includes(user.role);
      
      case 'delete':
        if (user.role === 'customer') {
          // Klient może usuwać tylko swoje rekordy (w zależności od konfiguracji)
          return item && item.created_by === user.id;
        }
        return ['admin', 'supervisor'].includes(user.role);
      
      case 'view':
        if (user.role === 'customer') {
          // Klient widzi tylko swoje rekordy
          return !item || item.created_by === user.id;
        }
        return true;
      
      case 'assign':
        return ['admin', 'supervisor', 'agent'].includes(user.role);
      
      case 'approve':
        return ['admin', 'supervisor'].includes(user.role);
      
      case 'export':
        return ['admin', 'supervisor'].includes(user.role);
      
      default:
        return false;
    }
  };
  
  export const getVisibleActions = (user: any, resource: string, isAdminView = false): string[] => {
    const actions: string[] = [];
  
    if (checkPermission(user, 'create', resource)) actions.push('create');
    if (checkPermission(user, 'edit', resource)) actions.push('edit');
    if (checkPermission(user, 'delete', resource)) actions.push('delete');
    if (checkPermission(user, 'assign', resource)) actions.push('assign');
    if (checkPermission(user, 'approve', resource)) actions.push('approve');
    if (checkPermission(user, 'export', resource)) actions.push('export');
  
    // Dodatkowe akcje dla widoku administratora
    if (isAdminView && user.role === 'admin') {
      actions.push('import', 'bulk-edit');
    }
  
    return actions;
  };