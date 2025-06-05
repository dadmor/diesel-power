// src/app-templates/widgets/TableFilters.tsx
import React from 'react';

interface TableFiltersProps {
  filters: string[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  table: any;
}

export const TableFilters: React.FC<TableFiltersProps> = ({
  filters,
  values,
  onChange,
  table
}) => {
  const handleFilterChange = (filterName: string, value: any) => {
    onChange({
      ...values,
      [filterName]: value
    });
  };

  const clearFilters = () => {
    onChange({});
  };

  const getFilterInput = (filterName: string) => {
    const column = table.columns?.find((col: any) => col.name === filterName);
    if (!column) return null;

    if (column.enum) {
      return (
        <select
          value={values[filterName] || ''}
          onChange={(e) => handleFilterChange(filterName, e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="">Wszystkie</option>
          {column.enum.map((option: string) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    return (
      <input
        type="text"
        placeholder={`Filtruj ${filterName}...`}
        value={values[filterName] || ''}
        onChange={(e) => handleFilterChange(filterName, e.target.value)}
        className="px-3 py-1 border border-gray-300 rounded text-sm"
      />
    );
  };

  if (filters.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex flex-wrap gap-4 items-center">
        <span className="text-sm font-medium text-gray-700">Filtry:</span>
        {filters.map(filter => (
          <div key={filter} className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 capitalize">
              {filter}:
            </label>
            {getFilterInput(filter)}
          </div>
        ))}
        {Object.keys(values).length > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Wyczyść filtry
          </button>
        )}
      </div>
    </div>
  );
};