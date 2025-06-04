// src/appsPanel/VendorApp.tsx - Działająca aplikacja vendora z relacjami
import React, { useState, useEffect } from 'react';
import { api } from './api';

export const VendorApp = ({ vendor, onBack }: any) => {
  const [activeTable, setActiveTable] = useState('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [relationOptions, setRelationOptions] = useState<any>({});

  useEffect(() => {
    if (vendor.schema?.tables?.length > 0) {
      setActiveTable(vendor.schema.tables[0].name);
    }
  }, [vendor]);

  useEffect(() => {
    if (activeTable) {
      loadTableData();
      loadRelationOptions();
    }
  }, [activeTable, filters]);

  const getCurrentTable = () => {
    return vendor.schema?.tables?.find((t: any) => t.name === activeTable);
  };

  const loadTableData = async () => {
    setLoading(true);
    try {
      const data = await api.getVendorData(vendor.slug, activeTable, filters);
      setTableData(data);
    } catch (error) {
      console.error('Błąd ładowania danych:', error);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRelationOptions = async () => {
    const currentTable = getCurrentTable();
    if (!currentTable) return;

    const options: any = {};
    for (const field of currentTable.fields) {
      if (field.relation && field.relation.type === 'belongsTo') {
        const relationTable = field.relation.table;
        options[field.name] = await api.getRelationOptions(vendor.slug, relationTable);
      }
    }
    setRelationOptions(options);
  };

  const handleCreate = async () => {
    try {
      await api.createVendorRecord(vendor.slug, activeTable, formData);
      setFormData({});
      setIsCreating(false);
      loadTableData();
    } catch (error) {
      console.error('Błąd tworzenia rekordu:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await api.updateVendorRecord(vendor.slug, activeTable, editingId, formData);
      setFormData({});
      setEditingId(null);
      setIsCreating(false);
      loadTableData();
    } catch (error) {
      console.error('Błąd aktualizacji rekordu:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć ten rekord?')) {
      try {
        await api.deleteVendorRecord(vendor.slug, activeTable, id);
        loadTableData();
      } catch (error) {
        console.error('Błąd usuwania rekordu:', error);
      }
    }
  };

  const startEdit = (record: any) => {
    setFormData(record);
    setEditingId(record.id);
    setIsCreating(true);
  };

  const cancelEdit = () => {
    setFormData({});
    setEditingId(null);
    setIsCreating(false);
  };

  const renderFormField = (field: any, value: any, onChange: (value: any) => void) => {
    // Pole z relacją belongsTo - select dropdown
    if (field.relation && field.relation.type === 'belongsTo') {
      const options = relationOptions[field.name] || [];
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">-- Wybierz {field.relation.table} --</option>
          {options.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    // Standardowe pola
    switch (field.type) {
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded"
          />
        );
      case 'date':
        return (
          <input
            type="datetime-local"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        );
      case 'text':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            rows={3}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        );
    }
  };

  const currentTable = getCurrentTable();
  if (!currentTable) {
    return (
      <div className="p-6 text-center">
        <p>Brak konfiguracji tabel</p>
        <button onClick={onBack} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
          ← Powrót
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900">
                ← Powrót do panelu
              </button>
              <h1 className="text-2xl font-bold text-blue-600">{vendor.name}</h1>
            </div>
            <div className="text-sm text-gray-500">/{vendor.slug}</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex">
          {/* Sidebar - Menu tabel */}
          <div className="w-64 bg-white rounded-lg shadow-sm p-4 h-fit mr-6">
            <h3 className="font-semibold mb-4">Zasoby</h3>
            <nav className="space-y-1">
              {vendor.schema.tables.map((table: any) => (
                <button
                  key={table.name}
                  onClick={() => setActiveTable(table.name)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                    activeTable === table.name
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📋 {table.displayName || table.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Table Header */}
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {currentTable.displayName || currentTable.name}
                  </h2>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    ➕ Dodaj nowy
                  </button>
                </div>
              </div>

              {/* Create/Edit Form */}
              {isCreating && (
                <div className="border-b p-4 bg-gray-50">
                  <h3 className="font-medium mb-3">
                    {editingId ? 'Edytuj rekord' : 'Dodaj nowy rekord'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {currentTable.fields
                      .filter((field: any) => !['id', 'created_at', 'updated_at'].includes(field.name))
                      .map((field: any) => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium mb-1">
                          {field.name}
                          {field.required && <span className="text-red-500">*</span>}
                          {field.relation && (
                            <span className="text-blue-500 text-xs"> → {field.relation.table}</span>
                          )}
                        </label>
                        {renderFormField(
                          field,
                          formData[field.name],
                          (value) => setFormData((prev: any) => ({ ...prev, [field.name]: value }))
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={editingId ? handleUpdate : handleCreate}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      {editingId ? '💾 Zapisz' : '➕ Utwórz'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              )}

              {/* Data Table */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center">⏳ Ładowanie...</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {currentTable.fields.map((field: any) => (
                          <th
                            key={field.name}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {field.name}
                            {field.relation && <span className="text-blue-500"> →</span>}
                          </th>
                        ))}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Akcje
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tableData.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          {currentTable.fields.map((field: any) => (
                            <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {typeof record[field.name] === 'boolean' 
                                ? (record[field.name] ? '✅' : '❌')
                                : String(record[field.name] || '-')
                              }
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startEdit(record)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(record.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                
                {!loading && tableData.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-gray-500 mb-4">Brak danych w tabeli</p>
                    <p className="text-xs text-gray-400 mb-4">
                      Upewnij się, że tabela {vendor.slug}_{activeTable} istnieje w Supabase
                    </p>
                    <button
                      onClick={() => setIsCreating(true)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Dodaj pierwszy rekord
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};