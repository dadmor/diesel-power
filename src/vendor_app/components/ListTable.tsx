// src/vendor_app/components/ListTable.tsx
import React from 'react';
import { DataTable } from '@/themes/default/components/DataTable';

// Typy pól z schema
interface TableField {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'textarea' | 'email' | 'password';
  unique?: boolean;
  required?: boolean;
  format?: 'currency' | 'percentage' | 'phone' | 'nip' | 'email';
  options?: string[]; // dla pól z ograniczonymi wartościami (status, kategoria, etc.)
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  placeholder?: string;
  label?: string;
}

interface TableSchema {
  name: string;
  fields: TableField[];
}

interface ListTableProps {
  data: any[];
  tableSchema: TableSchema;
  onRowClick?: (row: any) => void;
  loading?: boolean;
  title?: string;
  // Opcjonalne dodatkowe kolumny z relacji
  relationColumns?: Array<{
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
  }>;
}

export const ListTable: React.FC<ListTableProps> = ({ 
  data, 
  tableSchema,
  onRowClick, 
  loading = false,
  title,
  relationColumns = []
}) => {
  // Formatuj nazwę pola na czytelną etykietę
  const formatFieldLabel = (fieldName: string): string => {
    const labelMap: Record<string, string> = {
      'numer_faktury': 'Numer faktury',
      'data_wystawienia': 'Data wystawienia',
      'klient_id': 'Klient ID',
      'wartosc_netto': 'Wartość netto',
      'wartosc_brutto': 'Wartość brutto',
      'status': 'Status',
      'nazwa': 'Nazwa',
      'nip': 'NIP',
      'adres': 'Adres',
      'telefon': 'Telefon',
      'email': 'Email',
      'aktywny': 'Aktywny',
      'kategoria': 'Kategoria',
      'created_at': 'Utworzono',
      'updated_at': 'Zaktualizowano'
    };

    return labelMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Formatuj wartość pola na podstawie typu i dodatkowych opcji
  const formatFieldValue = (value: any, field: TableField): React.ReactNode => {
    // Obsługa pustych wartości
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">-</span>;
    }

    // Formatowanie na podstawie typu pola
    switch (field.type) {
      case 'date':
        return new Date(value).toLocaleDateString('pl-PL');
        
      case 'number':
        if (field.format === 'currency') {
          return `${Number(value).toFixed(2)} PLN`;
        }
        if (field.format === 'percentage') {
          return `${Number(value).toFixed(1)}%`;
        }
        return Number(value).toLocaleString('pl-PL');
        
      case 'string':
        if (field.format === 'phone') {
          return formatPhone(String(value));
        }
        if (field.format === 'nip') {
          return formatNIP(String(value));
        }
        // Obsługa statusów z predefiniowanymi opcjami
        if (field.options && field.options.length > 0) {
          return formatStatus(String(value), field.name);
        }
        return value;
        
      case 'boolean':
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {value ? 'Tak' : 'Nie'}
          </span>
        );
        
      default:
        return value;
    }
  };

  // Pomocnicze funkcje formatowania
  const formatPhone = (phone: string): string => {
    // Format: +48 123 456 789
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `+48 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatNIP = (nip: string): string => {
    // Format: 123-456-78-90
    const cleaned = nip.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`;
    }
    return nip;
  };

  const formatStatus = (status: string, fieldName: string): React.ReactNode => {
    // Mapowanie kolorów dla różnych statusów
    const getStatusColor = (status: string, fieldName: string): string => {
      // Statusy faktur
      if (fieldName === 'status') {
        const statusColors: Record<string, string> = {
          'wystawiona': 'bg-blue-100 text-blue-800',
          'oplacona': 'bg-green-100 text-green-800',
          'anulowana': 'bg-red-100 text-red-800',
          'przeterminowana': 'bg-yellow-100 text-yellow-800',
          'szkic': 'bg-gray-100 text-gray-800'
        };
        return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
      }
      
      // Kategorie klientów
      if (fieldName === 'kategoria') {
        const categoryColors: Record<string, string> = {
          'mały': 'bg-blue-100 text-blue-800',
          'średni': 'bg-green-100 text-green-800',
          'duży': 'bg-purple-100 text-purple-800',
          'enterprise': 'bg-yellow-100 text-yellow-800'
        };
        return categoryColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
      }
      
      // Domyślne kolory dla innych pól z opcjami
      return 'bg-blue-100 text-blue-800';
    };

    const colorClass = getStatusColor(status, fieldName);
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {status}
      </span>
    );
  };

  // Generuj kolumny na podstawie schema tabeli
  const generateColumns = () => {
    const schemaColumns = tableSchema.fields
      .filter(field => field.name !== 'id') // Ukryj ID column
      .map(field => ({
        key: field.name,
        label: formatFieldLabel(field.name),
        render: (value: any, row: any) => formatFieldValue(value, field)
      }));

    // Dodaj kolumny z relacji jeśli są
    return [...schemaColumns, ...relationColumns];
  };

  const columns = generateColumns();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Ładowanie danych...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          {title || formatFieldLabel(tableSchema.name)} ({data.length})
        </h3>
      </div>
      <DataTable 
        columns={columns} 
        data={data} 
        onRowClick={onRowClick}
      />
    </div>
  );
};