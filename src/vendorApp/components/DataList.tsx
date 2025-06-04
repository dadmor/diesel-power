// ===== src/vendorApp/components/DataList.tsx - NOWY PLIK =====
import React from 'react';

interface TableField {
  name: string;
  type: string;
}

interface TableSchema {
  name: string;
  fields: TableField[];
}

interface DataListProps {
  table: TableSchema;
  data: any[];
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onAdd: () => void;
}

const DataList: React.FC<DataListProps> = ({ 
  table, 
  data, 
  onEdit, 
  onDelete, 
  onAdd 
}) => {
  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'date':
      case 'datetime':
        return new Date(value).toLocaleDateString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold capitalize">{table.name}</h3>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          Add New
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {table.fields.map(field => (
                <th key={field.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {field.name}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={table.fields.length + 1} className="px-6 py-8 text-center text-gray-500">
                  No data available. Click "Add New" to get started.
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-gray-50">
                  {table.fields.map(field => (
                    <td key={field.name} className="px-6 py-4 text-sm text-gray-900">
                      {formatValue(item[field.name], field.type)}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    <button 
                      onClick={() => onEdit(item)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => onDelete(item)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataList;