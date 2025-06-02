// src/components/SchemaVisualizer.tsx - FIXED WITH PROPER TYPES
import React from 'react';
import { Table, Field } from '../types';

interface SchemaVisualizerProps {
  schema: { tables: Table[] };
  vendorName: string;
}

export const SchemaVisualizer: React.FC<SchemaVisualizerProps> = ({ schema, vendorName }) => {
  const getFieldTypeColor = (type: Field['type']) => {
    switch (type) {
      case 'string': return 'bg-blue-100 text-blue-800';
      case 'text': return 'bg-purple-100 text-purple-800';
      case 'number': return 'bg-green-100 text-green-800';
      case 'date': return 'bg-orange-100 text-orange-800';
      case 'boolean': return 'bg-yellow-100 text-yellow-800';
      case 'select': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFieldSqlType = (type: Field['type']): string => {
    switch (type) {
      case 'number': return 'INTEGER';
      case 'boolean': return 'BOOLEAN';
      case 'date': return 'DATE';
      case 'string':
      case 'text':
      case 'select':
      default: return 'TEXT';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center mb-4">
        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
        <h3 className="text-lg font-semibold text-gray-800">
          Schema: {vendorName}
        </h3>
      </div>
      
      <div className="space-y-4">
        {schema.tables.map((table, tableIndex) => (
          <div key={table.name} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h4 className="font-medium text-gray-800 flex items-center">
                <span className="w-6 h-6 bg-blue-500 text-white rounded text-xs flex items-center justify-center mr-2">
                  {tableIndex + 1}
                </span>
                {table.name}
              </h4>
            </div>
            
            <div className="p-4">
              <div className="grid gap-2">
                {/* Header row */}
                <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b pb-2">
                  <div>Pole</div>
                  <div>Typ</div>
                  <div>Opcje</div>
                  <div>SQL Type</div>
                </div>
                
                {/* ID field */}
                <div className="grid grid-cols-4 gap-2 py-1 border-b border-gray-100">
                  <div className="font-mono text-sm text-gray-600">id</div>
                  <div>
                    <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                      UUID
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">PRIMARY KEY</div>
                  <div className="font-mono text-xs text-gray-500">UUID</div>
                </div>
                
                {/* Fields */}
                {table.fields.map((field) => {
                  const sqlType = getFieldSqlType(field.type);
                  
                  return (
                    <div key={field.name} className="grid grid-cols-4 gap-2 py-1 border-b border-gray-100">
                      <div className="font-mono text-sm text-gray-800">
                        {field.name}
                      </div>
                      <div>
                        <span className={`px-2 py-1 text-xs rounded ${getFieldTypeColor(field.type)}`}>
                          {field.type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {field.options ? (
                          <div className="space-x-1">
                            {field.options.map((option, i) => (
                              <span key={i} className="inline-block px-1 py-0.5 bg-gray-100 rounded text-xs">
                                {option}
                              </span>
                            ))}
                          </div>
                        ) : '-'}
                      </div>
                      <div className="font-mono text-xs text-gray-500">
                        {sqlType}
                      </div>
                    </div>
                  );
                })}
                
                {/* Created_at field */}
                <div className="grid grid-cols-4 gap-2 py-1">
                  <div className="font-mono text-sm text-gray-600">created_at</div>
                  <div>
                    <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                      timestamp
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">DEFAULT NOW()</div>
                  <div className="font-mono text-xs text-gray-500">TIMESTAMP</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Tabele będą utworzone z prefiksem: <code className="bg-gray-100 px-1 rounded">slug_</code>
      </div>
    </div>
  );
};