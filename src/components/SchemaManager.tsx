// ===== src/components/SchemaManager.tsx =====
import React, { useState } from 'react';
import { Vendor, Table, Field } from '../types';
import { updateVendorSchema, createTables } from '../lib/supabase';
import { SimpleSchemaPreview } from './SimpleSchemaPreview';
import { ArrowLeft, Save, Plus, Trash2, Database, Edit3, Eye } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-sm border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button onClick={onCancel} className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors duration-200">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Powrót</span>
              </button>
              <div>
                <h1 className="text-3xl font-light tracking-tight text-slate-900">{vendor.name}</h1>
                <p className="text-slate-600 text-sm">/{vendor.slug}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-medium transition-all duration-200 ${
                  mode === 'edit' ? 'bg-slate-900 text-white' : 'bg-white/60 text-slate-700 border border-slate-200'
                }`}
              >
                {mode === 'edit' ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                <span>{mode === 'edit' ? 'Podgląd' : 'Edytuj'}</span>
              </button>
              {mode === 'edit' && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-200"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Zapisywanie...' : 'Zapisz'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="max-w-7xl mx-auto px-8 py-5">
          <div className="bg-red-50/80 border border-red-200/60 rounded-2xl p-5 backdrop-blur-sm">
            <h3 className="text-red-800 font-medium mb-3 text-sm">Błędy:</h3>
            <ul className="text-red-700 text-xs space-y-1">
              {errors.map((error, i) => <li key={i}>• {error}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Tables Navigation */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="p-6 border-b border-slate-200/60 flex items-center justify-between">
              <h2 className="text-lg font-light text-slate-900">Tabele ({schema.tables.length})</h2>
              {mode === 'edit' && (
                <button onClick={addTable} className="text-slate-600 hover:text-slate-900 transition-colors duration-200">
                  <Plus className="h-5 w-5" />
                </button>
              )}
            </div>
            
            <div className="divide-y divide-slate-200/60">
              {schema.tables.map((table, index) => (
                <div 
                  key={index}
                  className={`p-5 cursor-pointer hover:bg-slate-50/50 transition-colors duration-150 ${
                    selectedTableIndex === index ? 'bg-slate-50/50 border-r-2 border-slate-900' : ''
                  }`}
                  onClick={() => setSelectedTableIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Database className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{table.name}</p>
                        <p className="text-xs text-slate-500">{table.fields.length} pól</p>
                      </div>
                    </div>
                    
                    {mode === 'edit' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTable(index); }}
                        className="text-red-500 hover:text-red-700 transition-colors duration-150"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {schema.tables.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                  <Database className="h-12 w-12 mx-auto mb-3 text-slate-400 opacity-60" />
                  <p className="text-sm">Brak tabel</p>
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {mode === 'view' ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-8">
                <h3 className="text-xl font-light text-slate-900 mb-6">Podgląd Schema</h3>
                <SimpleSchemaPreview schema={schema} vendorName={vendor.name} />
              </div>
            ) : selectedTable ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="p-8 border-b border-slate-200/60">
                  <h3 className="text-xl font-light text-slate-900">Edytuj: {selectedTable.name}</h3>
                </div>

                <div className="p-8">
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-slate-700 mb-3">Nazwa tabeli</label>
                    <input
                      type="text"
                      value={selectedTable.name}
                      onChange={(e) => updateTable(selectedTableIndex!, { name: e.target.value })}
                      className="w-full px-5 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm transition-all duration-200"
                    />
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-light text-slate-900">Pola</h4>
                    <button
                      onClick={() => addField(selectedTableIndex!)}
                      className="bg-slate-900 text-white px-5 py-3 rounded-xl text-sm hover:bg-slate-800 transition-all duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Pole</span>
                    </button>
                  </div>

                  <div className="space-y-5">
                    {selectedTable.fields.map((field, i) => (
                      <div key={i} className="p-6 border border-slate-200/60 rounded-2xl bg-white/40">
                        <div className="grid grid-cols-3 gap-5">
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateField(selectedTableIndex!, i, { name: e.target.value })}
                            placeholder="Nazwa pola"
                            className="px-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm transition-all duration-200"
                          />
                          <select
                            value={field.type}
                            onChange={(e) => updateField(selectedTableIndex!, i, { 
                              type: e.target.value as Field['type'],
                              options: e.target.value === 'select' ? ['opcja1', 'opcja2'] : undefined
                            })}
                            className="px-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm transition-all duration-200"
                          >
                            {fieldTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => deleteField(selectedTableIndex!, i)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-300 rounded-xl px-4 py-3 transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4 mx-auto" />
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
                            className="w-full mt-4 px-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm transition-all duration-200"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-16 text-center">
                <Eye className="h-16 w-16 text-slate-400 mx-auto mb-6 opacity-60" />
                <h3 className="text-xl font-light text-slate-900 mb-3">Wybierz tabelę</h3>
                <p className="text-slate-500 text-sm">Kliknij tabelę z lewej strony aby ją edytować</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};