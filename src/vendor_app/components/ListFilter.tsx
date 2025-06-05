// src/vendor_app/components/ListFilter.tsx
import React, { useState } from 'react';
import { Input } from '@/themes/default/components/Form';
import { Button } from '@/themes/default/components/Button';

export interface FilterParams {
  [key: string]: string | number | undefined;
}

interface FilterConfig {
  field: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'dateRange';
  options?: string[]; // dla type='select'
  placeholder?: string;
}

interface ListFilterProps {
  filterConfigs: FilterConfig[];
  onFilter: (filters: FilterParams) => void;
  onClear: () => void;
  loading?: boolean;
  title?: string;
}

export const ListFilter: React.FC<ListFilterProps> = ({ 
  filterConfigs,
  onFilter, 
  onClear, 
  loading = false,
  title = "Filtrowanie"
}) => {
  const [filters, setFilters] = useState<FilterParams>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };

  const handleNumberChange = (field: string, value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    setFilters(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleSubmit = () => {
    onFilter(filters);
  };

  const handleClear = () => {
    setFilters({});
    onClear();
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== ''
  );

  const renderFilterField = (config: FilterConfig) => {
    const value = filters[config.field] || '';

    switch (config.type) {
      case 'select':
        return (
          <div className="mb-3" key={config.field}>
            <label className="block mb-1 font-medium">{config.label}:</label>
            <select
              value={value}
              onChange={(e) => handleInputChange(config.field, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Wszystkie</option>
              {config.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );

      case 'number':
        return (
          <Input
            key={config.field}
            label={config.label}
            value={value.toString()}
            onChange={(val) => handleNumberChange(config.field, val)}
            type="text"
            placeholder={config.placeholder}
          />
        );

      case 'date':
        return (
          <Input
            key={config.field}
            label={config.label}
            value={value.toString()}
            onChange={(val) => handleInputChange(config.field, val)}
            type="text"
            placeholder={config.placeholder || "YYYY-MM-DD"}
          />
        );

      case 'text':
      default:
        return (
          <Input
            key={config.field}
            label={config.label}
            value={value.toString()}
            onChange={(val) => handleInputChange(config.field, val)}
            type="text"
            placeholder={config.placeholder}
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-6">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                Aktywne filtry
              </span>
            )}
            <Button
              variant="secondary"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Zwiń' : 'Rozwiń'}
            </Button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterConfigs.map(config => renderFilterField(config))}
          </div>

          <div className="flex gap-2 mt-6 pt-4 border-t">
            <Button
              onClick={handleSubmit}
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Filtrowanie...' : 'Zastosuj filtry'}
            </Button>
            
            <Button
              onClick={handleClear}
              variant="secondary"
              disabled={loading}
            >
              Wyczyść filtry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};