// src/components/SimpleSchemaPreview.tsx
import React from 'react';
import { Table, Field } from '../types';
import { Database } from 'lucide-react';

interface SimpleSchemaPreviewProps {
  schema: { tables: Table[] };
  vendorName: string;
}

const getFieldTypeColor = (type: Field['type']) => {
  const colors = {
    string: 'bg-blue-100 text-blue-800',
    text: 'bg-purple-100 text-purple-800', 
    number: 'bg-green-100 text-green-800',
    date: 'bg-orange-100 text-orange-800',
    boolean: 'bg-yellow-100 text-yellow-800',
    select: 'bg-pink-100 text-pink-800'
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

export const SimpleSchemaPreview: React.FC<SimpleSchemaPreviewProps> = ({ schema, vendorName }) => {
  if (schema.tables.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <Database className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p>Brak tabel w schema</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        <strong>{vendorName}</strong> - {schema.tables.length} {schema.tables.length === 1 ? 'tabela' : 'tabel'}
      </div>
      
      {schema.tables.map((table, tableIndex) => (
        <div key={tableIndex} className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-gray-600" />
              <h3 className="font-medium text-gray-900">{table.name}</h3>
              <span className="text-sm text-gray-500">({table.fields.length} pól)</span>
            </div>
          </div>
          
          <div className="p-4">
            <div className="space-y-2">
              {/* Standard fields */}
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="font-mono text-gray-600">id</span>
                <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-800">UUID (auto)</span>
              </div>
              
              {/* User defined fields */}
              {table.fields.map((field, fieldIndex) => (
                <div key={fieldIndex} className="flex items-center justify-between py-1 text-sm">
                  <span className="font-mono">{field.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 text-xs rounded ${getFieldTypeColor(field.type)}`}>
                      {field.type}
                    </span>
                    {field.options && (
                      <span className="text-xs text-gray-500">
                        ({field.options.slice(0, 2).join(', ')}{field.options.length > 2 ? '...' : ''})
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="font-mono text-gray-600">created_at</span>
                <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-800">timestamp (auto)</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};