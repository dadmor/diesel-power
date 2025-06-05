import { useEffect, useState } from "react";
import { Vendor } from "../..";
import { Button, Card, DataTable } from "../../../themes/default";

// src/components/TableView.tsx
export const TableView: React.FC<{ vendor: Vendor; table: any; appData: any }> = ({ 
    vendor, 
    table, 
    appData 
  }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
  
    useEffect(() => {
      loadData();
    }, [table]);
  
    const loadData = async () => {
      setLoading(true);
      try {
        // Symulacja ładowania danych
        const mockData = [];
        for (let i = 1; i <= 10; i++) {
          const row: any = { id: i };
          const fields = table.fields || table.columns || [];
          
          fields.forEach((field: any) => {
            switch (field.type) {
              case 'string':
              case 'text':
                row[field.name] = `Przykład ${field.name} ${i}`;
                break;
              case 'number':
              case 'integer':
                row[field.name] = Math.floor(Math.random() * 1000) + 1;
                break;
              case 'boolean':
                row[field.name] = Math.random() > 0.5;
                break;
              case 'datetime':
              case 'timestamp':
                row[field.name] = new Date(Date.now() - Math.random() * 86400000 * 30).toISOString().split('T')[0];
                break;
              default:
                if (field.type?.includes('select:')) {
                  const options = field.type.split(':')[1].split(',');
                  row[field.name] = options[Math.floor(Math.random() * options.length)];
                } else {
                  row[field.name] = `Wartość ${i}`;
                }
            }
          });
          
          mockData.push(row);
        }
        setData(mockData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
  
    const columns = [
      { key: 'id', label: 'ID' },
      ...(table.fields || table.columns || []).map((field: any) => ({
        key: field.name,
        label: field.label || field.name.charAt(0).toUpperCase() + field.name.slice(1),
        render: (value: any) => {
          if (typeof value === 'boolean') {
            return value ? '✅ Tak' : '❌ Nie';
          }
          if (field.type === 'datetime' || field.type === 'timestamp') {
            return new Date(value).toLocaleDateString('pl-PL');
          }
          return String(value);
        }
      }))
    ];
  
    return (
      <Card>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold">
              Tabela: {vendor.slug}_{table.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {table.label || table.name} - {data.length} rekordów
            </p>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="secondary" onClick={loadData}>
              🔄 Odśwież
            </Button>
            <Button size="sm">
              ➕ Dodaj rekord
            </Button>
          </div>
        </div>
  
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={data}
            onRowClick={(row) => console.log('Edytuj rekord:', row)}
          />
        )}
  
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Struktura tabeli</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(table.fields || table.columns || []).map((field: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                <span className="font-medium">{field.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {field.type}
                  </span>
                  {field.required && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                      wymagane
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  };
  