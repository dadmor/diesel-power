// ===== src/vendorApp/components/Sidebar.tsx - NOWY PLIK =====
import React from 'react';
import { Link, useParams } from 'react-router-dom';

interface TableSchema {
  name: string;
  fields: any[];
}

interface SidebarProps {
  tables: TableSchema[];
  currentTable: TableSchema | null;
  onTableSelect: (table: TableSchema) => void;
  data: Record<string, any[]>;
  vendorSlug: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  tables, 
  currentTable, 
  onTableSelect, 
  data, 
  vendorSlug 
}) => {
  return (
    <div className="w-64 bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Tables</h3>
      <nav className="space-y-2">
        {tables.map(table => (
          <Link
            key={table.name}
            to={`/${vendorSlug}/${table.name}`}
            onClick={() => onTableSelect(table)}
            className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              currentTable?.name === table.name
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="capitalize">{table.name}</span>
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded">
                {data[table.name]?.length || 0}
              </span>
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
