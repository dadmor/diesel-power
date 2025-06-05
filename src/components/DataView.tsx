import { useState } from "react";
import { Vendor } from "../vendor_apps";
import { Button, Card, DataTable } from "../themes/default";

// src/components/DataView.tsx
export const DataView: React.FC<{ vendor: Vendor; appData: any }> = ({ vendor, appData }) => {
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
  
    const tables = appData.schema?.tables || vendor.schema?.tables || [];
  
    const loadTableData = async (tableName: string) => {
      setLoading(true);
      try {
        // Tutaj możesz dodać prawdziwe ładowanie danych z bazy
        // const data = await VendorAppService.getTableData(vendor.slug, tableName);
        
        // Przykładowe dane dla demonstracji
        const mockData = generateMockData(tableName, tables.find((t: any) => t.name === tableName));
        setTableData(mockData);
      } catch (error) {
        console.error('Error loading table data:', error);
        setTableData([]);
      } finally {
        setLoading(false);
      }
    };
  
    const generateMockData = (tableName: string, table: any) => {
      if (!table) return [];
      
      const mockData = [];
      for (let i = 1; i <= 5; i++) {
        const row: any = { id: i };
        const fields = table.fields || table.columns || [];
        
        fields.forEach((field: any) => {
          const fieldName = field.name;
          const fieldType = field.type;
          
          switch (fieldType) {
            case 'string':
            case 'text':
              row[fieldName] = `Przykład ${fieldName} ${i}`;
              break;
            case 'number':
            case 'integer':
              row[fieldName] = Math.floor(Math.random() * 100) + 1;
              break;
            case 'boolean':
              row[fieldName] = Math.random() > 0.5;
              break;
            case 'datetime':
            case 'timestamp':
              row[fieldName] = new Date().toISOString().split('T')[0];
              break;
            default:
              if (fieldType?.includes('select:')) {
                const options = fieldType.split(':')[1].split(',');
                row[fieldName] = options[Math.floor(Math.random() * options.length)];
              } else {
                row[fieldName] = `Wartość ${i}`;
              }
          }
        });
        
        mockData.push(row);
      }
      
      return mockData;
    };
  
    const getTableColumns = (table: any) => {
      const fields = table?.fields || table?.columns || [];
      return [
        { key: 'id', label: 'ID' },
        ...fields.map((field: any) => ({
          key: field.name,
          label: field.label || field.name.charAt(0).toUpperCase() + field.name.slice(1),
          render: (value: any) => {
            if (typeof value === 'boolean') {
              return value ? '✅' : '❌';
            }
            return String(value);
          }
        }))
      ];
    };
  
    return (
      <div className="space-y-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Wybierz tabelę</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tables.map((table: any) => (
              <Button
                key={table.name}
                variant={selectedTable === table.name ? 'primary' : 'secondary'}
                onClick={() => {
                  setSelectedTable(table.name);
                  loadTableData(table.name);
                }}
                className="justify-start"
              >
                {vendor.slug}_{table.name}
              </Button>
            ))}
          </div>
        </Card>
  
        {selectedTable && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Dane tabeli: {vendor.slug}_{selectedTable}
              </h3>
              <Button size="sm">
                ➕ Dodaj rekord
              </Button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <DataTable
                columns={getTableColumns(tables.find((t: any) => t.name === selectedTable))}
                data={tableData}
                onRowClick={(row) => console.log('Row clicked:', row)}
              />
            )}
          </Card>
        )}
      </div>
    );
  };