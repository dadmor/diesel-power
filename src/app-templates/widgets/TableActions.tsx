// src/app-templates/widgets/TableActions.tsx
import React from 'react';

interface TableActionsProps {
  actions: string[];
  selectedCount: number;
  onAction: (action: string) => void;
  isAdminView: boolean;
  isSupervisorView: boolean;
}

export const TableActions: React.FC<TableActionsProps> = ({
  actions,
  selectedCount,
  onAction,
  isAdminView,
  isSupervisorView
}) => {
  const getActionButton = (action: string) => {
    const actionConfig: Record<string, { label: string; icon: string; variant: string }> = {
      'create': { label: 'Dodaj', icon: '➕', variant: 'primary' },
      'edit': { label: 'Edytuj', icon: '✏️', variant: 'secondary' },
      'delete': { label: 'Usuń', icon: '🗑️', variant: 'danger' },
      'assign': { label: 'Przypisz', icon: '👤', variant: 'secondary' },
      'approve': { label: 'Zatwierdź', icon: '✅', variant: 'success' },
      'export': { label: 'Eksportuj', icon: '📤', variant: 'secondary' },
      'import': { label: 'Importuj', icon: '📥', variant: 'secondary' },
      'bulk-edit': { label: 'Edycja masowa', icon: '⚙️', variant: 'secondary' }
    };

    const config = actionConfig[action];
    if (!config) return null;

    const disabled = ['edit', 'delete', 'assign', 'approve'].includes(action) && selectedCount === 0;

    return (
      <button
        key={action}
        onClick={() => onAction(action)}
        disabled={disabled}
        className={`
          px-4 py-2 rounded-lg font-medium transition-colors text-sm
          flex items-center space-x-2
          ${config.variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
            config.variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
            config.variant === 'success' ? 'bg-green-600 text-white hover:bg-green-700' :
            'bg-gray-200 text-gray-800 hover:bg-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
        {['edit', 'delete', 'assign'].includes(action) && selectedCount > 0 && (
          <span className="bg-white bg-opacity-20 rounded-full px-2 py-1 text-xs">
            {selectedCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-lg shadow-md">
      <div className="flex flex-wrap gap-2">
        {actions.map(action => getActionButton(action))}
      </div>
      
      {selectedCount > 0 && (
        <div className="text-sm text-gray-600">
          Zaznaczono: {selectedCount} element{selectedCount > 1 ? 'ów' : ''}
        </div>
      )}
      
      {(isAdminView || isSupervisorView) && (
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {isAdminView ? 'Tryb administratora' : 'Tryb supervisora'}
        </div>
      )}
    </div>
  );
};
