// src/vendor_app/components/DbForm.tsx
import React, { useState, useEffect } from 'react';
import { Input } from '@/themes/default/components/Form';
import { Button } from '@/themes/default/components/Button';

// Typy pól z schema (rozszerzony o więcej opcji)
interface TableField {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'textarea' | 'email' | 'password';
  unique?: boolean;
  required?: boolean;
  format?: 'currency' | 'percentage' | 'phone' | 'nip' | 'email';
  options?: string[]; // dla selectów
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  placeholder?: string;
  label?: string; // opcjonalna custom etykieta
}

interface TableSchema {
  name: string;
  fields: TableField[];
}

interface DbFormProps {
  tableSchema: TableSchema;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  initialData?: Record<string, any>;
  loading?: boolean;
  title?: string;
  submitButtonText?: string;
  onCancel?: () => void;
}

export const DbForm: React.FC<DbFormProps> = ({ 
  tableSchema,
  onSubmit, 
  initialData, 
  loading = false,
  title,
  submitButtonText,
  onCancel
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicjalizuj dane formularza
  useEffect(() => {
    const initData: Record<string, any> = {};
    
    tableSchema.fields
      .filter(field => field.name !== 'id') // Pomijamy pole ID
      .forEach(field => {
        initData[field.name] = initialData?.[field.name] || getDefaultValue(field);
      });
    
    setFormData(initData);
  }, [tableSchema, initialData]);

  // Pobierz domyślną wartość dla pola
  const getDefaultValue = (field: TableField): any => {
    switch (field.type) {
      case 'boolean':
        return false;
      case 'number':
        return '';
      case 'date':
        return '';
      default:
        return '';
    }
  };

  // Formatuj nazwę pola na czytelną etykietę
  const formatFieldLabel = (field: TableField): string => {
    if (field.label) return field.label;
    
    const labelMap: Record<string, string> = {
      'numer_faktury': 'Numer faktury',
      'data_wystawienia': 'Data wystawienia',
      'klient_id': 'Klient',
      'wartosc_netto': 'Wartość netto',
      'wartosc_brutto': 'Wartość brutto',
      'status': 'Status',
      'nazwa': 'Nazwa',
      'nip': 'NIP',
      'adres': 'Adres',
      'telefon': 'Telefon',
      'email': 'Email',
      'opis': 'Opis',
      'uwagi': 'Uwagi',
      'aktywny': 'Aktywny',
      'kategoria': 'Kategoria',
      'created_at': 'Utworzono',
      'updated_at': 'Zaktualizowano'
    };

    return labelMap[field.name] || field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Walidacja pola
  const validateField = (field: TableField, value: any): string | null => {
    // Sprawdź czy pole jest wymagane
    if (field.required && (!value || value.toString().trim() === '')) {
      return `${formatFieldLabel(field)} jest wymagane`;
    }

    // Jeśli pole jest puste i nie jest wymagane, nie waliduj dalej
    if (!value || value.toString().trim() === '') {
      return null;
    }

    // Walidacja specyficzna dla formatów
    if (field.format === 'nip') {
      const nipRegex = /^\d{10}$/;
      if (!nipRegex.test(value.replace(/[-\s]/g, ''))) {
        return 'NIP musi składać się z 10 cyfr';
      }
    }

    if (field.format === 'email' || field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Nieprawidłowy format email';
      }
    }

    if (field.format === 'phone') {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{9,}$/;
      if (!phoneRegex.test(value)) {
        return 'Nieprawidłowy format telefonu';
      }
    }

    // Walidacja długości
    if (field.validation?.minLength && value.length < field.validation.minLength) {
      return `Minimalna długość: ${field.validation.minLength} znaków`;
    }
    
    if (field.validation?.maxLength && value.length > field.validation.maxLength) {
      return `Maksymalna długość: ${field.validation.maxLength} znaków`;
    }

    // Walidacja wartości numerycznych
    if (field.type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return 'Wartość musi być liczbą';
      }
      
      if (field.validation?.min !== undefined && numValue < field.validation.min) {
        return `Minimalna wartość: ${field.validation.min}`;
      }
      
      if (field.validation?.max !== undefined && numValue > field.validation.max) {
        return `Maksymalna wartość: ${field.validation.max}`;
      }
    }

    // Walidacja wzorca
    if (field.validation?.pattern) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        return 'Nieprawidłowy format';
      }
    }

    return null;
  };

  // Walidacja całego formularza
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    tableSchema.fields
      .filter(field => field.name !== 'id')
      .forEach(field => {
        const error = validateField(field, formData[field.name]);
        if (error) {
          newErrors[field.name] = error;
        }
      });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      
      // Reset form after successful submission (only for new records)
      if (!initialData) {
        const resetData: Record<string, any> = {};
        tableSchema.fields
          .filter(field => field.name !== 'id')
          .forEach(field => {
            resetData[field.name] = getDefaultValue(field);
          });
        setFormData(resetData);
      }
    } catch (error) {
      console.error('Błąd podczas zapisywania:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Renderuj pole formularza
  const renderField = (field: TableField) => {
    if (field.name === 'id') return null; // Pomijamy pole ID

    const value = formData[field.name] || '';
    const error = errors[field.name];
    const label = formatFieldLabel(field) + (field.required ? ' *' : '');

    // Select dla pól z opcjami
    if (field.options && field.options.length > 0) {
      return (
        <div key={field.name} className="mb-3">
          <label className="block mb-1 font-medium">{label}:</label>
          <select
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required={field.required}
          >
            <option value="">Wybierz...</option>
            {field.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
      );
    }

    // Checkbox dla boolean
    if (field.type === 'boolean') {
      return (
        <div key={field.name} className="mb-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              className="mr-2"
            />
            <span className="font-medium">{label}</span>
          </label>
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
      );
    }

    // Określ typ dla Input component
    let componentType: 'text' | 'textarea' | 'password' | 'email' = 'text';
    if (field.type === 'textarea') componentType = 'textarea';
    if (field.type === 'password') componentType = 'password';
    if (field.type === 'email' || field.format === 'email') componentType = 'email';

    return (
      <div key={field.name}>
        <Input
          label={label}
          value={value.toString()}
          onChange={(newValue) => {
            if (field.type === 'number') {
              // Dla liczb, konwertuj na number lub pozostaw jako string jeśli puste
              const numValue = newValue === '' ? '' : parseFloat(newValue);
              handleChange(field.name, numValue);
            } else {
              handleChange(field.name, newValue);
            }
          }}
          type={componentType}
          placeholder={field.placeholder || `Wprowadź ${formatFieldLabel(field).toLowerCase()}`}
        />
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>
    );
  };

  // Określ układ kolumn (long fields na całą szerokość)
  const getLongFields = (): string[] => {
    return tableSchema.fields
      .filter(field => 
        field.type === 'textarea' || 
        field.name.includes('adres') ||
        field.name.includes('opis') ||
        field.name.includes('uwagi') ||
        field.name.includes('nazwa')
      )
      .map(field => field.name);
  };

  const longFields = getLongFields();

  const getTitle = () => {
    if (title) return title;
    const tableName = formatFieldLabel({ name: tableSchema.name } as TableField);
    return initialData ? `Edytuj ${tableName.toLowerCase()}` : `Dodaj ${tableName.toLowerCase()}`;
  };

  const getSubmitText = () => {
    if (submitButtonText) return submitButtonText;
    return loading 
      ? (initialData ? 'Aktualizowanie...' : 'Zapisywanie...') 
      : (initialData ? 'Aktualizuj' : 'Dodaj');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        {getTitle()}
      </h3>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tableSchema.fields
            .filter(field => field.name !== 'id')
            .map(field => (
              <div 
                key={field.name} 
                className={longFields.includes(field.name) ? 'md:col-span-2' : ''}
              >
                {renderField(field)}
              </div>
            ))
          }
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {getSubmitText()}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Anuluj
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};