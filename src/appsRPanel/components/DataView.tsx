// components/DataView.tsx
import { useState, useEffect } from 'react';
import { type Vendor } from '../services/vendorService';

interface DataViewProps {
  vendor: Vendor;
  onBack: () => void;
  vendorData: any[];
  loading: boolean;
  onLoadData: (tableName: string) => void;
  onAddRecord: (data: any) => Promise<void>;
}

export const DataView = ({ 
  vendor, 
  onBack, 
  vendorData, 
  loading, 
  onLoadData, 
  onAddRecord 
}: DataViewProps) => {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [error, setError] = useState<string>('');

  const selectTable = (tableName: string) => {
    setSelectedTable(tableName);
    setShowAddForm(false);
    onLoadData(tableName);
  };

  const startAddRecord = () => {
    const table = vendor.schema.tables.find(t => t.name === selectedTable);
    if (table) {
      // Generate example JSON based on table schema
      const example: any = {};
      table.columns.forEach(col => {
        switch (col.type) {
          case 'text':
            if (col.validation?.enum) {
              example[col.name] = col.validation.enum[0];
            } else {
              example[col.name] = `Example ${col.name}`;
            }
            break;
          case 'number':
            example[col.name] = col.validation?.min || 0;
            break;
          case 'boolean':
            example[col.name] = col.defaultValue || false;
            break;
          case 'date':
            example[col.name] = new Date().toISOString().split('T')[0];
            break;
          case 'uuid':
            example[col.name] = 'auto-generated';
            break;
          default:
            example[col.name] = null;
        }
      });
      
      setJsonInput(JSON.stringify(example, null, 2));
      setShowAddForm(true);
    }
  };

  const handleAddRecord = async () => {
    setError('');
    
    try {
      const data = JSON.parse(jsonInput);
      await onAddRecord(data);
      setShowAddForm(false);
      setJsonInput('');
      // Reload data
      onLoadData(selectedTable);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format');
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
  };

  // Tables overview
  if (!selectedTable) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="max-w-4xl mx-auto p-8">
          <div className="flex items-center mb-8">
            <button 
              onClick={onBack}
              className="border px-4 py-2 text-sm rounded-md hover:bg-gray-50 mr-4"
            >
              Back to Vendors
            </button>
            <div>
              <h1 className="text-2xl font-semibold">{vendor.name}</h1>
              <p className="text-sm text-gray-500">Tables & Data</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendor.schema.tables.map((table) => (
              <div key={table.name} className="bg-white border rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-2">{table.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{table.description}</p>
                <div className="text-xs text-gray-500 mb-4">
                  {table.columns.length} columns
                </div>
                <button
                  onClick={() => selectTable(table.name)}
                  className="w-full bg-gray-900 text-white px-4 py-2 text-sm rounded-md hover:bg-gray-800"
                >
                  View Records
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Add record form
  if (showAddForm) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="max-w-4xl mx-auto p-8">
          <div className="flex items-center mb-8">
            <button 
              onClick={() => setShowAddForm(false)}
              className="border px-4 py-2 text-sm rounded-md hover:bg-gray-50 mr-4"
            >
              Back
            </button>
            <h1 className="text-2xl font-semibold">
              Add Record to {selectedTable}
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex justify-between items-center">
              <pre className="whitespace-pre-wrap text-sm">{error}</pre>
              <button 
                onClick={() => setError('')} 
                className="ml-4 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}

          <div className="bg-white border rounded-lg p-6">
            <label className="block text-sm font-medium mb-2">Record Data (JSON)</label>
            
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-96 font-mono text-sm border rounded-md p-4"
              placeholder="Enter record data as JSON..."
              disabled={loading}
            />
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleAddRecord}
                className="bg-gray-900 text-white px-6 py-2 text-sm rounded-md hover:bg-gray-800 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Record'}
              </button>
              
              <button
                onClick={() => setShowAddForm(false)}
                className="border px-6 py-2 text-sm rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Table data view
  const table = vendor.schema.tables.find(t => t.name === selectedTable);
  
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button 
              onClick={() => setSelectedTable('')}
              className="border px-4 py-2 text-sm rounded-md hover:bg-gray-50 mr-4"
            >
              Back
            </button>
            <div>
              <h1 className="text-2xl font-semibold">{selectedTable}</h1>
              <p className="text-sm text-gray-500">{table?.description}</p>
            </div>
          </div>
          <button
            onClick={startAddRecord}
            className="bg-gray-900 text-white px-4 py-2 text-sm rounded-md hover:bg-gray-800"
            disabled={loading}
          >
            Add Record
          </button>
        </div>

        <div className="bg-white border rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading records...</p>
            </div>
          ) : vendorData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No records found</p>
              <button 
                onClick={startAddRecord} 
                className="bg-gray-900 text-white px-4 py-2 text-sm rounded-md hover:bg-gray-800"
              >
                Add first record
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vendorData.map((record) => (
                    <tr key={record.id}>
                      <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                        {record.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <pre className="text-xs bg-gray-50 p-2 rounded max-w-md overflow-auto">
                          {JSON.stringify(record.data, null, 2)}
                        </pre>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {new Date(record.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};