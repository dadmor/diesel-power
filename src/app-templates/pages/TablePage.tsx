// src/app-templates/pages/TablePage.tsx
import React, { useState, useEffect } from 'react';
import { Vendor } from '../../vendor_apps';
import { PageConfig } from '../utils/routeGenerator';
import { DataTable } from '../widgets/DataTable';
import { TableActions } from '../widgets/TableActions';
import { TableFilters } from '../widgets/TableFilters';

interface TablePageProps {
  vendor: Vendor;
  user: any;
  table: any;
  config: PageConfig;
  isAdminView: boolean;
  isSupervisorView: boolean;
}

export const TablePage: React.FC<TablePageProps> = ({
  vendor,
  user,
  table,
  config,
  isAdminView,
  isSupervisorView
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [table, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Generuj przykładowe dane na podstawie schematu tabeli
      const mockData = generateMockData(table, user);
      setData(mockData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (table: any, user: any) => {
    const mockData = [];
    const recordCount = Math.floor(Math.random() * 20) + 5;
    
    for (let i = 1; i <= recordCount; i++) {
      const record: any = { 
        id: i,
        created_at: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Generuj dane dla każdej kolumny
      table.columns?.forEach((column: any) => {
        if (column.name === 'id') return;
        
        switch (column.type) {
          case 'text':
            if (column.name.includes('email')) {
              record[column.name] = `user${i}@example.com`;
            } else if (column.name.includes('name')) {
              record[column.name] = `Test ${column.name} ${i}`;
            } else {
              record[column.name] = `Przykład ${column.name} ${i}`;
            }
            break;
          case 'integer':
            record[column.name] = Math.floor(Math.random() * 1000) + 1;
            break;
          case 'boolean':
            record[column.name] = Math.random() > 0.5;
            break;
          case 'timestamp':
            record[column.name] = new Date(Date.now() - Math.random() * 86400000 * 7).toISOString();
            break;
          default:
            if (column.enum) {
              record[column.name] = column.enum[Math.floor(Math.random() * column.enum.length)];
            } else {
              record[column.name] = `Wartość ${i}`;
            }
        }
      });
      
      // Jeśli to tabela z created_by, ustaw na current user dla niektórych rekordów
      if (table.columns?.some((col: any) => col.name === 'created_by')) {
        record.created_by = Math.random() > 0.5 ? user.id : Math.floor(Math.random() * 3) + 1;
      }
      
      mockData.push(record);
    }
    
    return mockData;
  };

  const handleAction = async (action: string, items?: any[]) => {
    const targetItems = items || selectedItems;
    
    switch (action) {
      case 'create':
        console.log('Create new item');
        // Tutaj można dodać modal tworzenia
        break;
      case 'edit':
        if (targetItems.length === 1) {
          console.log('Edit item:', targetItems[0]);
        }
        break;
      case 'delete':
        if (targetItems.length > 0) {
          console.log('Delete items:', targetItems);
          setData(data.filter(item => !targetItems.includes(item)));
          setSelectedItems([]);
        }
        break;
      case 'assign':
        console.log('Assign items:', targetItems);
        break;
      case 'export':
        console.log('Export data');
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
          <p className="text-gray-600">
            {isAdminView ? 'Widok administratora' : 
             isSupervisorView ? 'Widok supervisora' : 
             'Standardowy widok'}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Rekordów: {data.length}
        </div>
      </div>

      {/* Actions */}
      <TableActions
        actions={config.actions}
        selectedCount={selectedItems.length}
        onAction={handleAction}
        isAdminView={isAdminView}
        isSupervisorView={isSupervisorView}
      />

      {/* Filters */}
      {config.filters.length > 0 && (
        <TableFilters
          filters={config.filters}
          values={filters}
          onChange={setFilters}
          table={table}
        />
      )}

      {/* Table */}
      <DataTable
        vendor={vendor}
        table={table}
        data={data}
        loading={loading}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        onAction={handleAction}
        userRole={user.role}
        isAdminView={isAdminView}
      />
    </div>
  );
};