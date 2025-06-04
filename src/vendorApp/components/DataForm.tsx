// ===== src/vendorApp/components/DataForm.tsx - NOWY PLIK =====
import React, { useState } from 'react';

interface TableField {
  name: string;
  type: string;
  options?: string[];
}

interface TableSchema {
  name: string;
  fields: TableField[];
}

interface DataFormProps {
  table: TableSchema;
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const DataForm: React.FC<DataFormProps> = ({ 
  table, 
  initialData, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState(
    initialData || table.fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const renderField = (field: TableField) => {
    const value = formData[field.name] || '';
    
    switch (field.type) {
      case 'text':
        return (
          <textarea
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        );
      case 'number':
      case 'integer':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      case 'date':
      case 'datetime':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        );
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose...</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        {initialData ? 'Edit' : 'Add'} {table.name.slice(0, -1)}
      </h3>
      
      <div className="space-y-4">
        {table.fields.map(field => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
              {field.name} {field.type === 'select' && field.options && `(${field.options.join(', ')})`}
            </label>
            {renderField(field)}
          </div>
        ))}
        
        <div className="flex gap-2 pt-4">
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataForm;