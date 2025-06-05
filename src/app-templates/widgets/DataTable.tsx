// src/app-templates/widgets/DataTable.tsx
// Komponent tabeli danych z funkcjonalnością CRUD

import React, { useState } from 'react';
import { Vendor } from '../../vendor_apps';

interface DataTableProps {
  vendor: Vendor;
  table: any;
  data: any[];
  loading: boolean;
  selectedItems: any[];
  onSelectionChange: (items: any[]) => void;
  onAction: (action: string, items?: any[]) => void;
  userRole: string;
  isAdminView: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  vendor,
  table,
  data,
  loading,
  selectedItems,
  onSelectionChange,
  onAction,
  userRole,
  isAdminView
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Funkcje sortowania
  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];

      // Konwersja typów dla sortowania
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  // Funkcje selekcji
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(sortedData);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (item: any, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, item]);
    } else {
      onSelectionChange(selectedItems.filter(selected => selected.id !== item.id));
    }
  };

  const isSelected = (item: any) => {
    return selectedItems.some(selected => selected.id === item.id);
  };

  const allSelected = sortedData.length > 0 && selectedItems.length === sortedData.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < sortedData.length;

  // Formatowanie wartości
  const formatValue = (value: any, column: any) => {
    if (value === null || value === undefined) return '-';

    switch (column.type) {
      case 'boolean':
        return value ? '✅ Tak' : '❌ Nie';
      case 'timestamp':
        return new Date(value).toLocaleDateString('pl-PL');
      case 'integer':
        return typeof value === 'number' ? value.toLocaleString('pl-PL') : value;
      default:
        if (column.enum && Array.isArray(column.enum)) {
          return value;
        }
        return String(value);
    }
  };

  // Sprawdzenie uprawnień do edycji
  const canEdit = (item: any) => {
    if (isAdminView) return true;
    if (userRole === 'admin') return true;
    if (userRole === 'customer' && item.created_by === parseInt(localStorage.getItem('currentUserId') || '0')) return true;
    return false;
  };

  // Kolumny do wyświetlenia (pomijamy niektóre systemoĺłłłwe)
  const visibleColumns = table.columns.filter((col: any) => 
    !['created_at', 'updated_at', 'vendor_slug'].includes(col.name)
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Ładowanie danych...</span>
        </div>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Brak danych</h3>
          <p className="text-gray-600 mb-4">
            Nie znaleziono rekordów w tabeli {table.name}
          </p>
          <button
            onClick={() => onAction('create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Dodaj pierwszy rekord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Checkbox dla selekcji wszystkich */}
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>

              {/* ID Column */}
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                  {sortColumn === 'id' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>

              {/* Dynamic columns */}
              {visibleColumns.map((column: any) => (
                <th
                  key={column.name}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(column.name)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.name.replace('_', ' ')}</span>
                    {sortColumn === column.name && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}

              {/* Actions column */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item, index) => (
              <tr
                key={item.id}
                className={`
                  hover:bg-gray-50 transition-colors
                  ${isSelected(item) ? 'bg-blue-50' : ''}
                `}
              >
                {/* Checkbox */}
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={isSelected(item)}
                    onChange={(e) => handleSelectItem(item, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>

                {/* ID */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.id}
                </td>

                {/* Dynamic columns */}
                {visibleColumns.map((column: any) => (
                  <td key={column.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatValue(item[column.name], column)}
                  </td>
                ))}

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onAction('view', [item])}
                      className="text-blue-600 hover:text-blue-900"
                      title="Szczegóły"
                    >
                      👁️
                    </button>
                    {canEdit(item) && (
                      <button
                        onClick={() => onAction('edit', [item])}
                        className="text-green-600 hover:text-green-900"
                        title="Edytuj"
                      >
                        ✏️
                      </button>
                    )}
                    {(isAdminView || userRole === 'admin') && (
                      <button
                        onClick={() => onAction('delete', [item])}
                        className="text-red-600 hover:text-red-900"
                        title="Usuń"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer z informacjami */}
      <div className="bg-gray-50 px-6 py-3 flex justify-between items-center text-sm text-gray-700">
        <div>
          Wyświetlono {sortedData.length} rekordów
        </div>
        <div>
          {selectedItems.length > 0 && (
            <span>Zaznaczono: {selectedItems.length}</span>
          )}
        </div>
      </div>
    </div>
  );
};