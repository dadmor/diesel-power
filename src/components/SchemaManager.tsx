// src/components/SchemaManager.tsx - Simplified without expandable lists
import React, { useState } from 'react';
import { Vendor, Table, Field } from '../types';
import { updateVendorSchema, createTables } from '../lib/supabase';
import { SimpleSchemaPreview } from './SimpleSchemaPreview';
import { 
  ArrowLeft, Save, Plus, Trash2, Database, 
  Edit3, Eye
} from 'lucide-react';

interface SchemaManagerProps {
  vendor: Vendor;
  onSave: (vendor: Vendor) => void;
  onCancel: () => void;
}

const fieldTypes: Field['type'][] = ['string', 'text', 'number', 'date', 'boolean', 'select'];

export const SchemaManager: React.FC<SchemaManagerProps> = ({ vendor, onSave, onCancel }) => {
  const [schema, setSchema] = useState(vendor.schema);
  const [selectedTableIndex, setSelectedTableIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<'edit' | 'view'>('view');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const selectedTable = selectedTableIndex !== null ? schema.tables[selectedTableIndex] : null;

  // Validation
  const validate = () => {
    const errs: string[] = [];
    if (schema.tables.length === 0) errs.push('Wymagana przynajmniej jedna tabela');
    schema.tables.forEach((table, i) => {
      if (!table.name.trim()) errs.push(`Tabela ${i + 1}: brak nazwy`);
      if (table.fields.length === 0) errs.push(`Tabela "${table.name}": brak pól`);
      table.fields.forEach((field, j) => {
        if (!field.name.trim()) errs.push(`Tabela "${table.name}", pole ${j + 1}: brak nazwy`);
        if (field.type === 'select' && !field.options?.length) 
          errs.push(`Pole "${field.name}": select wymaga opcji`);
      });
    });
    return errs;
  };

  // Table operations
  const addTable = () => {
    const newTable: Table = {
      name: `table_${schema.tables.length + 1}`,
      fields: [{ name: 'name', type: 'string' }]
    };
    setSchema(prev => ({ ...prev, tables: [...prev.tables, newTable] }));
    setSelectedTableIndex(schema.tables.length);
    setMode('edit');
  };

  const updateTable = (index: number, updates: Partial<Table>) => {
    setSchema(prev => ({
      ...prev,
      tables: prev.tables.map((table, i) => i === index ? { ...table, ...updates } : table)
    }));
  };

  const deleteTable = (index: number) => {
    if (!confirm('Usunąć tabelę?')) return;
    setSchema(prev => ({ ...prev, tables: prev.tables.filter((_, i) => i !== index) }));
    if (selectedTableIndex === index) setSelectedTableIndex(null);
    else if (selectedTableIndex !== null && selectedTableIndex > index) setSelectedTableIndex(selectedTableIndex - 1);
  };

  // Field operations
  const addField = (tableIndex: number) => {
    const table = schema.tables[tableIndex];
    updateTable(tableIndex, {
      fields: [...table.fields, { name: `field_${table.fields.length + 1}`, type: 'string' }]
    });
  };

  const updateField = (tableIndex: number, fieldIndex: number, updates: Partial<Field>) => {
    const table = schema.tables[tableIndex];
    updateTable(tableIndex, {
      fields: table.fields.map((field, i) => i === fieldIndex ? { ...field, ...updates } : field)
    });
  };

  const deleteField = (tableIndex: number, fieldIndex: number) => {
    if (!confirm('Usunąć pole?')) return;
    const table = schema.tables[tableIndex];
    updateTable(tableIndex, { fields: table.fields.filter((_, i) => i !== fieldIndex) });
  };

  // Save
  const handleSave = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    setSaving(true);
    try {
      await updateVendorSchema(vendor.id, schema);
      await createTables(vendor.slug, schema.tables);
      onSave({ ...vendor, schema });
    } catch (error: any) {
      setErrors([error.message || 'Błąd zapisywania']);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={onCancel} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
              <span>Powrót</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
              <p className="text-gray-600">/{vendor.slug}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
                mode === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {mode === 'edit' ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
              <span>{mode === 'edit' ? 'Podgląd' : 'Edytuj'}</span>
            </button>
            {mode === 'edit' && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Zapisywanie...' : 'Zapisz'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium mb-2">Błędy:</h3>
            <ul className="text-red-700 text-sm space-y-1">
              {errors.map((error, i) => <li key={i}>• {error}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Tables Navigation */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tabele ({schema.tables.length})</h2>
              {mode === 'edit' && (
                <button onClick={addTable} className="text-blue-600 hover:text-blue-700">
                  <Plus className="h-5 w-5" />
                </button>
              )}
            </div>
            
            <div className="divide-y">
              {schema.tables.map((table, index) => (
                <div 
                  key={index}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedTableIndex === index ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedTableIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Database className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{table.name}</p>
                        <p className="text-sm text-gray-500">{table.fields.length} pól</p>
                      </div>
                    </div>
                    
                    {mode === 'edit' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTable(index); }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {schema.tables.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Database className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Brak tabel</p>
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-2">
            {mode === 'view' ? (
              /* View Mode - Use SimpleSchemaPreview */
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4">Podgląd Schema</h3>
                <SimpleSchemaPreview schema={schema} vendorName={vendor.name} />
              </div>
            ) : selectedTable ? (
              /* Edit Mode */
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="text-xl font-semibold">Edytuj: {selectedTable.name}</h3>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Nazwa tabeli</label>
                    <input
                      type="text"
                      value={selectedTable.name}
                      onChange={(e) => updateTable(selectedTableIndex!, { name: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium">Pola</h4>
                    <button
                      onClick={() => addField(selectedTableIndex!)}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 inline mr-1" />
                      Pole
                    </button>
                  </div>

                  <div className="space-y-4">
                    {selectedTable.fields.map((field, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="grid grid-cols-3 gap-4">
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateField(selectedTableIndex!, i, { name: e.target.value })}
                            placeholder="Nazwa pola"
                            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <select
                            value={field.type}
                            onChange={(e) => updateField(selectedTableIndex!, i, { 
                              type: e.target.value as Field['type'],
                              options: e.target.value === 'select' ? ['opcja1', 'opcja2'] : undefined
                            })}
                            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
                          >
                            {fieldTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => deleteField(selectedTableIndex!, i)}
                            className="text-red-600 hover:text-red-800 border border-red-300 rounded p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {field.type === 'select' && (
                          <input
                            type="text"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) => updateField(selectedTableIndex!, i, {
                              options: e.target.value.split(',').map(opt => opt.trim()).filter(Boolean)
                            })}
                            placeholder="opcja1, opcja2, opcja3"
                            className="w-full mt-2 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* No table selected */
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Wybierz tabelę</h3>
                <p className="text-gray-500">Kliknij tabelę z lewej strony aby ją edytować</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};