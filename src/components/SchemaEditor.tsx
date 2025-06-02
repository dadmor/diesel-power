// src/components/SchemaEditor.tsx - Edytor schematów z nawigacją
import React, { useState } from 'react';
import { Vendor, Table, Field } from '../types';
import { updateVendorSchema, createTables } from '../lib/supabase';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Database, 
  Edit3,
  Eye,
  ChevronRight,
  Settings
} from 'lucide-react';

interface SchemaEditorProps {
  vendor: Vendor;
  onSave: (updatedVendor: Vendor) => void;
  onCancel: () => void;
}

export const SchemaEditor: React.FC<SchemaEditorProps> = ({ vendor, onSave, onCancel }) => {
  const [schema, setSchema] = useState(vendor.schema);
  const [selectedTableIndex, setSelectedTableIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const fieldTypes: Field['type'][] = ['string', 'text', 'number', 'date', 'boolean', 'select'];

  const addTable = () => {
    const newTable: Table = {
      name: `table_${schema.tables.length + 1}`,
      fields: [
        { name: 'name', type: 'string' }
      ]
    };
    setSchema(prev => ({
      ...prev,
      tables: [...prev.tables, newTable]
    }));
    setSelectedTableIndex(schema.tables.length);
  };

  const updateTable = (index: number, updates: Partial<Table>) => {
    setSchema(prev => ({
      ...prev,
      tables: prev.tables.map((table, i) => 
        i === index ? { ...table, ...updates } : table
      )
    }));
  };

  const deleteTable = (index: number) => {
    if (confirm('Czy na pewno chcesz usunąć tę tabelę?')) {
      setSchema(prev => ({
        ...prev,
        tables: prev.tables.filter((_, i) => i !== index)
      }));
      if (selectedTableIndex === index) {
        setSelectedTableIndex(null);
      } else if (selectedTableIndex !== null && selectedTableIndex > index) {
        setSelectedTableIndex(selectedTableIndex - 1);
      }
    }
  };

  const addField = (tableIndex: number) => {
    const newField: Field = {
      name: `field_${schema.tables[tableIndex].fields.length + 1}`,
      type: 'string'
    };
    
    updateTable(tableIndex, {
      fields: [...schema.tables[tableIndex].fields, newField]
    });
  };

  const updateField = (tableIndex: number, fieldIndex: number, updates: Partial<Field>) => {
    const table = schema.tables[tableIndex];
    const updatedFields = table.fields.map((field, i) => 
      i === fieldIndex ? { ...field, ...updates } : field
    );
    updateTable(tableIndex, { fields: updatedFields });
  };

  const deleteField = (tableIndex: number, fieldIndex: number) => {
    if (confirm('Czy na pewno chcesz usunąć to pole?')) {
      const table = schema.tables[tableIndex];
      const updatedFields = table.fields.filter((_, i) => i !== fieldIndex);
      updateTable(tableIndex, { fields: updatedFields });
    }
  };

  const validateSchema = (): string[] => {
    const errors: string[] = [];
    
    if (schema.tables.length === 0) {
      errors.push('Schema musi zawierać przynajmniej jedną tabelę');
    }
    
    schema.tables.forEach((table, tableIndex) => {
      if (!table.name.trim()) {
        errors.push(`Tabela ${tableIndex + 1}: brak nazwy`);
      }
      
      if (table.fields.length === 0) {
        errors.push(`Tabela "${table.name}": brak pól`);
      }
      
      table.fields.forEach((field, fieldIndex) => {
        if (!field.name.trim()) {
          errors.push(`Tabela "${table.name}", pole ${fieldIndex + 1}: brak nazwy`);
        }
        
        if (field.type === 'select' && (!field.options || field.options.length === 0)) {
          errors.push(`Tabela "${table.name}", pole "${field.name}": pole select wymaga opcji`);
        }
      });
    });
    
    return errors;
  };

  const handleSave = async () => {
    const validationErrors = validateSchema();
    setErrors(validationErrors);
    
    if (validationErrors.length > 0) {
      return;
    }
    
    setSaving(true);
    try {
      // Zaktualizuj schema w bazie
      await updateVendorSchema(vendor.id, schema);
      
      // Utwórz nowe tabele (jeśli potrzeba)
      await createTables(vendor.slug, schema.tables);
      
      // Wywołaj callback z zaktualizowanym vendor
      const updatedVendor: Vendor = {
        ...vendor,
        schema
      };
      onSave(updatedVendor);
    } catch (error: any) {
      setErrors([error.message || 'Błąd podczas zapisywania']);
    } finally {
      setSaving(false);
    }
  };

  const selectedTable = selectedTableIndex !== null ? schema.tables[selectedTableIndex] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onCancel}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Powrót</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edytuj: {vendor.name}</h1>
                <p className="text-gray-600">/{vendor.slug}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium"
              >
                <Save className="h-5 w-5" />
                <span>{saving ? 'Zapisywanie...' : 'Zapisz'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium mb-2">Błędy walidacji:</h3>
            <ul className="text-red-700 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Tables Navigation */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Tabele</h2>
              <button
                onClick={addTable}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Dodaj</span>
              </button>
            </div>
            
            <div className="divide-y divide-gray-200">
              {schema.tables.map((table, index) => (
                <div 
                  key={index}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedTableIndex === index ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedTableIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Database className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{table.name}</p>
                        <p className="text-sm text-gray-500">{table.fields.length} pól</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {selectedTableIndex === index && (
                        <ChevronRight className="h-4 w-4 text-blue-500" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTable(index);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {schema.tables.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Database className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Brak tabel</p>
                  <button
                    onClick={addTable}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Dodaj pierwszą tabelę
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table Editor */}
          <div className="lg:col-span-2">
            {selectedTable ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <Settings className="h-6 w-6 text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      Edytuj tabelę
                    </h3>
                  </div>
                  
                  {/* Table Name */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nazwa tabeli
                    </label>
                    <input
                      type="text"
                      value={selectedTable.name}
                      onChange={(e) => updateTable(selectedTableIndex!, { name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="np. products, users, orders"
                    />
                  </div>
                </div>

                {/* Fields */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Pola</h4>
                    <button
                      onClick={() => addField(selectedTableIndex!)}
                      className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Dodaj pole</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {selectedTable.fields.map((field, fieldIndex) => (
                      <div key={fieldIndex} className="p-4 border border-gray-200 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Field Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nazwa pola
                            </label>
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) => updateField(selectedTableIndex!, fieldIndex, { name: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="np. name, email, price"
                            />
                          </div>

                          {/* Field Type */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Typ pola
                            </label>
                            <select
                              value={field.type}
                              onChange={(e) => updateField(selectedTableIndex!, fieldIndex, { 
                                type: e.target.value as Field['type'],
                                options: e.target.value === 'select' ? ['opcja1', 'opcja2'] : undefined
                              })}
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {fieldTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>

                          {/* Actions */}
                          <div className="flex items-end">
                            <button
                              onClick={() => deleteField(selectedTableIndex!, fieldIndex)}
                              className="w-full p-2 text-red-600 hover:text-red-800 border border-red-300 hover:border-red-400 rounded"
                            >
                              <Trash2 className="h-4 w-4 mx-auto" />
                            </button>
                          </div>
                        </div>

                        {/* Select Options */}
                        {field.type === 'select' && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Opcje (oddzielone przecinkami)
                            </label>
                            <input
                              type="text"
                              value={field.options?.join(', ') || ''}
                              onChange={(e) => updateField(selectedTableIndex!, fieldIndex, {
                                options: e.target.value.split(',').map(opt => opt.trim()).filter(Boolean)
                              })}
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="opcja1, opcja2, opcja3"
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    {selectedTable.fields.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Edit3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>Brak pól w tej tabeli</p>
                        <button
                          onClick={() => addField(selectedTableIndex!)}
                          className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Dodaj pierwsze pole
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Wybierz tabelę do edycji
                </h3>
                <p className="text-gray-500">
                  Kliknij na tabelę po lewej stronie, aby rozpocząć edycję
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};