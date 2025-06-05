// src/components/VendorAppDisplay.tsx
import React, { useState, useEffect } from 'react';
import { Vendor } from '../vendor_apps';
import { Layout, Card, Button, Navigation } from '../themes/default';
import { DashboardView } from './DashboardView';
import { TableView } from './TableView';
import { DEFAULT_APP_SCHEMA } from '../themes/default/defaultAppSchema';



interface VendorAppDisplayProps {
  vendor: Vendor;
  onBack: () => void;
}

export const VendorAppDisplay: React.FC<VendorAppDisplayProps> = ({ vendor, onBack }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppData();
  }, [vendor]);

  const loadAppData = async () => {
    try {
      setLoading(true);
      // Jeśli vendor ma kompletną strukturę z nawigacją, użyj jej
      if (vendor.schema && 'navigation' in vendor.schema) {
        setAppData(vendor.schema);
      } else {
        // Użyj domyślnej struktury i dostosuj do schematu vendora
        const defaultApp = { ...DEFAULT_APP_SCHEMA };
        defaultApp.name = vendor.name;
        defaultApp.slug = vendor.slug;
        
        // Dostosuj tabele z vendor.schema
        if (vendor.schema?.tables) {
          defaultApp.schema.tables = vendor.schema.tables.map(table => ({
            name: table.name,
            label: table.name.charAt(0).toUpperCase() + table.name.slice(1),
            fields: table.columns.map(col => ({
              name: col.name,
              type: mapColumnType(col.type),
              required: col.required || false,
              label: col.name.charAt(0).toUpperCase() + col.name.slice(1).replace('_', ' ')
            }))
          }));
        }
        
        setAppData(defaultApp);
      }
    } catch (error) {
      console.error('Error loading app data:', error);
      setAppData(DEFAULT_APP_SCHEMA);
    } finally {
      setLoading(false);
    }
  };

  const mapColumnType = (type: string): string => {
    switch (type) {
      case 'text': return 'string';
      case 'integer': return 'number';
      case 'boolean': return 'boolean';
      case 'timestamp': return 'datetime';
      default: return 'string';
    }
  };

  if (loading) {
    return (
      <Layout title="Ładowanie aplikacji..." subtitle={vendor.name}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!appData) {
    return (
      <Layout title="Błąd" subtitle="Nie udało się załadować aplikacji">
        <Card>
          <p className="text-red-600">Wystąpił błąd podczas ładowania aplikacji vendora.</p>
          <Button onClick={onBack} className="mt-4">Powrót</Button>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title={appData.name} subtitle={`Aplikacja vendora: ${vendor.slug}`}>
      <div className="mb-4">
        <Button onClick={onBack} variant="secondary" size="sm">
          ← Powrót do listy vendorów
        </Button>
      </div>

      <Navigation
        items={appData.navigation?.main || [
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'data', label: 'Dane', icon: '📋' }
        ]}
        onItemClick={setCurrentPage}
      />

      {currentPage === 'dashboard' && (
        <DashboardView vendor={vendor} appData={appData} />
      )}

      {currentPage === 'data' && (
        <DataView vendor={vendor} appData={appData} />
      )}

      {appData.schema?.tables?.map((table: any) => (
        currentPage === table.name && (
          <TableView 
            key={table.name}
            vendor={vendor} 
            table={table} 
            appData={appData} 
          />
        )
      ))}
    </Layout>
  );
};
