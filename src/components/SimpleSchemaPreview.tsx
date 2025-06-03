// ===== src/components/SimpleSchemaPreview.tsx =====
import React from 'react';
import { Table, Field } from '../types';
import { Database } from 'lucide-react';

interface SimpleSchemaPreviewProps {
  schema: { tables: Table[] };
  vendorName: string;
}

const fieldTypeColors = {
  string: 'bg-blue-50 text-blue-700 border-blue-200',
  text: 'bg-purple-50 text-purple-700 border-purple-200',
  number: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  date: 'bg-amber-50 text-amber-700 border-amber-200',
  boolean: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  select: 'bg-pink-50 text-pink-700 border-pink-200'
};

export const SimpleSchemaPreview: React.FC<SimpleSchemaPreviewProps> = ({ schema, vendorName }) => {
  if (schema.tables.length === 0) {
    return (
      <div className="text-center text-slate-500 py-12">
        <Database className="h-12 w-12 mx-auto mb-3 text-slate-400 opacity-60" />
        <p className="text-sm">Brak tabel w schema</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-xs text-slate-600 mb-6 p-4 bg-slate-50/50 rounded-xl border border-slate-200/60">
        <span className="font-medium">{vendorName}</span> • {schema.tables.length} {schema.tables.length === 1 ? 'tabela' : 'tabel'}
      </div>
      
      {schema.tables.map((table, tableIndex) => (
        <div key={tableIndex} className="border border-slate-200/60 rounded-xl overflow-hidden bg-white/40">
          <div className="bg-slate-50/50 px-5 py-4 border-b border-slate-200/60">
            <div className="flex items-center space-x-3">
              <Database className="h-4 w-4 text-slate-600" />
              <h3 className="font-medium text-slate-900 text-sm">{table.name}</h3>
              <span className="text-xs text-slate-500">({table.fields.length} pól)</span>
            </div>
          </div>
          
          <div className="p-5">
            <div className="space-y-3">
              <FieldRow name="id" type="UUID (auto)" isSystem />
              {table.fields.map((field, fieldIndex) => (
                <FieldRow 
                  key={fieldIndex} 
                  name={field.name} 
                  type={field.type}
                  options={field.options}
                />
              ))}
              <FieldRow name="created_at" type="timestamp (auto)" isSystem />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const FieldRow: React.FC<{ name: string; type: string; options?: string[]; isSystem?: boolean }> = ({ 
  name, 
  type, 
  options, 
  isSystem 
}) => (
  <div className="flex items-center justify-between py-2 text-xs">
    <span className={`font-mono ${isSystem ? 'text-slate-500' : 'text-slate-900'}`}>{name}</span>
    <div className="flex items-center space-x-2">
      <span className={`px-3 py-1 text-xs rounded-lg border ${
        isSystem ? 'bg-slate-50 text-slate-600 border-slate-200' : 
        fieldTypeColors[type as keyof typeof fieldTypeColors] || 'bg-slate-50 text-slate-600 border-slate-200'
      }`}>
        {type}
      </span>
      {options && options.length > 0 && (
        <span className="text-xs text-slate-500">
          ({options.slice(0, 2).join(', ')}{options.length > 2 ? '...' : ''})
        </span>
      )}
    </div>
  </div>
);