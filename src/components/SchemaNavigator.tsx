// src/components/SchemaNavigator.tsx - Zaawansowany navigator po schemacie
import React, { useState } from 'react';
import { Vendor, Table, Field } from '../types';
import { 
  Database, 
  Table as TableIcon, 
  Columns, 
  Eye, 
  Code,
  FileText,
  ChevronRight,
  ChevronDown,
  Search,
  Filter
} from 'lucide-react';

interface SchemaNavigatorProps {
  vendor: Vendor;
  onClose: () => void;
}

export const SchemaNavigator: React.FC<SchemaNavigatorProps> = ({ vendor, onClose }) => {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<Field['type'] | 'all'>('all');

  const toggleTableExpansion = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (expandedTables.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const getFieldTypeColor = (type: Field['type']) => {
    switch (type) {
      case 'string': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'text': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'number': return 'bg-green-100 text-green-800 border-green-200';
      case 'date': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'boolean': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'select': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFieldIcon = (type: Field['type']) => {
    switch (type) {
      case 'string': return '📝';
      case 'text': return '📄';
      case 'number': return '🔢';
      case 'date': return '📅';
      case 'boolean': return '☑️';
      case 'select': return '📋';
      default: return '❓';
    }
  };

  const getSqlType = (type: Field['type']): string => {
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

  const filteredTables = vendor.schema.tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.fields.some(field => 
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (filterType === 'all' || field.type === filterType)
    )
  );

  const generateTableSQL = (table: Table) => {
    const tableName = `${vendor.slug}_${table.name}`;
    const columns = table.fields.map(field => 
      `  ${field.name} ${getSqlType(field.type)}`
    ).join(',\n');
    
    return `CREATE TABLE ${tableName} (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
${columns},
  created_at TIMESTAMP DEFAULT NOW()
);`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] m-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">{vendor.name}</h2>
                <p className="text-gray-300">Schema Navigator - /{vendor.slug}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Sidebar - Tables & Search */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Search & Filter */}
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Szukaj tabel i pól..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as Field['type'] | 'all')}
                  className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Wszystkie typy</option>
                  <option value="string">String</option>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Boolean</option>
                  <option value="select">Select</option>
                </select>
              </div>
            </div>

            {/* Tables List */}
            <div className="flex-1 overflow-y-auto">
              {filteredTables.map((table) => (
                <div key={table.name} className="border-b border-gray-100">
                  <div
                    className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    onClick={() => {
                      setSelectedTable(table);
                      setSelectedField(null);
                      toggleTableExpansion(table.name);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <TableIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{table.name}</p>
                        <p className="text-sm text-gray-500">{table.fields.length} pól</p>
                      </div>
                    </div>
                    {expandedTables.has(table.name) ? 
                      <ChevronDown className="h-4 w-4 text-gray-400" /> : 
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    }
                  </div>

                  {/* Fields List */}
                  {expandedTables.has(table.name) && (
                    <div className="bg-gray-50">
                      {table.fields
                        .filter(field => 
                          (filterType === 'all' || field.type === filterType) &&
                          field.name.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((field) => (
                        <div
                          key={field.name}
                          className="p-3 pl-12 hover:bg-gray-100 cursor-pointer border-l-2 border-transparent hover:border-blue-500"
                          onClick={() => {
                            setSelectedField(field);
                            setSelectedTable(table);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getFieldIcon(field.type)}</span>
                              <span className="font-mono text-sm text-gray-700">{field.name}</span>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded border ${getFieldTypeColor(field.type)}`}>
                              {field.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Details */}
          <div className="flex-1 overflow-y-auto">
            {selectedField && selectedTable ? (
              /* Field Details */
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{getFieldIcon(selectedField.type)}</span>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedField.name}</h3>
                    <span className={`px-3 py-1 rounded-full border ${getFieldTypeColor(selectedField.type)}`}>
                      {selectedField.type}
                    </span>
                  </div>
                  <p className="text-gray-600">w tabeli: <strong>{selectedTable.name}</strong></p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Field Properties */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Właściwości pola</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nazwa:</span>
                        <span className="font-mono">{selectedField.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Typ:</span>
                        <span>{selectedField.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">SQL Type:</span>
                        <span className="font-mono">{getSqlType(selectedField.type)}</span>
                      </div>
                      {selectedField.options && (
                        <div>
                          <span className="text-gray-600">Opcje:</span>
                          <div className="mt-1 space-y-1">
                            {selectedField.options.map((option, index) => (
                              <div key={index} className="bg-white px-2 py-1 rounded text-xs">
                                {option}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Usage Examples */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Przykłady użycia</h4>
                    <div className="space-y-2 text-sm">
                      {selectedField.type === 'string' && (
                        <div>
                          <p className="text-gray-600">Przykładowe wartości:</p>
                          <p className="font-mono text-xs bg-white p-2 rounded">
                            "Jan Kowalski", "Warszawa", "admin@example.com"
                          </p>
                        </div>
                      )}
                      {selectedField.type === 'number' && (
                        <div>
                          <p className="text-gray-600">Przykładowe wartości:</p>
                          <p className="font-mono text-xs bg-white p-2 rounded">
                            42, 1000, -5, 2024
                          </p>
                        </div>
                      )}
                      {selectedField.type === 'date' && (
                        <div>
                          <p className="text-gray-600">Format:</p>
                          <p className="font-mono text-xs bg-white p-2 rounded">
                            YYYY-MM-DD (2024-01-15)
                          </p>
                        </div>
                      )}
                      {selectedField.type === 'boolean' && (
                        <div>
                          <p className="text-gray-600">Możliwe wartości:</p>
                          <p className="font-mono text-xs bg-white p-2 rounded">
                            true, false
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedTable ? (
              /* Table Details */
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <TableIcon className="h-8 w-8 text-blue-600" />
                    <h3 className="text-2xl font-bold text-gray-900">{selectedTable.name}</h3>
                  </div>
                  <p className="text-gray-600">{selectedTable.fields.length} pól</p>
                </div>

                {/* Table Schema */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Columns className="h-5 w-5 mr-2" />
                    Struktura tabeli
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 px-3">Pole</th>
                          <th className="text-left py-2 px-3">Typ</th>
                          <th className="text-left py-2 px-3">SQL Type</th>
                          <th className="text-left py-2 px-3">Opcje</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-200 bg-gray-100">
                          <td className="py-2 px-3 font-mono text-gray-600">id</td>
                          <td className="py-2 px-3">UUID</td>
                          <td className="py-2 px-3 font-mono">UUID PRIMARY KEY</td>
                          <td className="py-2 px-3 text-gray-500">Auto-generated</td>
                        </tr>
                        {selectedTable.fields.map((field) => (
                          <tr key={field.name} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="py-2 px-3 font-mono">{field.name}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-1 text-xs rounded ${getFieldTypeColor(field.type)}`}>
                                {field.type}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono">{getSqlType(field.type)}</td>
                            <td className="py-2 px-3">
                              {field.options ? (
                                <div className="flex flex-wrap gap-1">
                                  {field.options.map((option, i) => (
                                    <span key={i} className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                                      {option}
                                    </span>
                                  ))}
                                </div>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-b border-gray-200 bg-gray-100">
                          <td className="py-2 px-3 font-mono text-gray-600">created_at</td>
                          <td className="py-2 px-3">timestamp</td>
                          <td className="py-2 px-3 font-mono">TIMESTAMP DEFAULT NOW()</td>
                          <td className="py-2 px-3 text-gray-500">Auto-generated</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SQL Code */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-3 flex items-center">
                    <Code className="h-5 w-5 mr-2" />
                    SQL Definition
                  </h4>
                  <pre className="text-green-400 text-sm overflow-x-auto">
                    {generateTableSQL(selectedTable)}
                  </pre>
                </div>
              </div>
            ) : (
              /* Welcome Screen */
              <div className="p-12 text-center">
                <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Eksplorator Schema
                </h3>
                <p className="text-gray-600 mb-4">
                  Wybierz tabelę z lewej strony, aby zobaczyć szczegóły
                </p>
                <div className="text-sm text-gray-500">
                  <p>📋 Kliknij na tabelę aby zobaczyć jej strukturę</p>
                  <p>🔍 Kliknij na pole aby zobaczyć szczegóły</p>
                  <p>🔎 Użyj wyszukiwania aby filtrować zawartość</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};