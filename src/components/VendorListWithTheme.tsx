// src/components/VendorListWithTheme.tsx - Zaktualizowana wersja VendorList z możliwością wyświetlania aplikacji
import React, { useState, useEffect } from 'react';
import { Vendor, VendorForm } from '../vendor_apps';
import { VendorService } from '../vendor_apps';

import { Layout, Card, Button } from '../themes/default';
import { VendorAppDisplay } from './VendorAppDisplay';


export const VendorListWithTheme: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [viewingApp, setViewingApp] = useState<Vendor | null>(null);
  const [error, setError] = useState('');

  const loadVendors = async () => {
    try {
      const data = await VendorService.getVendors();
      setVendors(data);
    } catch (err) {
      setError('Błąd ładowania: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleSave = async (vendorData: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editing) {
        await VendorService.updateVendor(editing.id!, vendorData);
      } else {
        await VendorService.createVendor(vendorData);
      }
      setShowForm(false);
      setEditing(null);
      await loadVendors();
    } catch (err) {
      throw new Error('Nie udało się zapisać: ' + (err instanceof Error ? err.message : ''));
    }
  };

  const handleDelete = async (vendor: Vendor) => {
    if (!confirm(`Usunąć "${vendor.name}"? To usunie wszystkie powiązane tabele.`)) return;
    try {
      await VendorService.deleteVendor(vendor);
      await loadVendors();
    } catch (err) {
      alert('Nie udało się usunąć: ' + (err instanceof Error ? err.message : ''));
    }
  };

  if (loading) {
    return (
      <Layout title="Ładowanie..." subtitle="Pobieranie listy vendorów">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (viewingApp) {
    return (
      <VendorAppDisplay 
        vendor={viewingApp} 
        onBack={() => setViewingApp(null)} 
      />
    );
  }

  return (
    <Layout title="System Multi-Vendor" subtitle="Zarządzanie aplikacjami vendorów">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Lista Vendorów</h2>
          <p className="text-gray-600">Zarządzaj aplikacjami i ich strukturami</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          ➕ Dodaj nowego vendora
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <Card key={vendor.id} hover>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{vendor.name}</h3>
                <p className="text-gray-600 font-mono text-sm">/{vendor.slug}</p>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setViewingApp(vendor)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded"
                  title="Wyświetl aplikację"
                >
                  👁️
                </button>
                <button
                  onClick={() => {
                    setEditing(vendor);
                    setShowForm(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edytuj"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(vendor)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Usuń"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tabele:</span>
                <span className="font-medium">{vendor.schema.tables.length}</span>
              </div>

              <div className="space-y-2">
                {vendor.schema.tables.slice(0, 3).map((table, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium text-sm text-gray-800">
                      {vendor.slug}_{table.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {table.columns.length} pól: {table.columns.slice(0, 3).map((c) => c.name).join(', ')}
                      {table.columns.length > 3 && '...'}
                    </div>
                  </div>
                ))}
                {vendor.schema.tables.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    i {vendor.schema.tables.length - 3} więcej...
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Utworzono:</span>
                  <span>
                    {vendor.created_at 
                      ? new Date(vendor.created_at).toLocaleDateString('pl-PL') 
                      : '—'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button
                onClick={() => setViewingApp(vendor)}
                className="w-full"
                size="sm"
              >
                🚀 Otwórz aplikację
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {vendors.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Brak vendorów</h3>
          <p className="text-gray-600 mb-4">Rozpocznij od dodania pierwszego vendora</p>
          <Button onClick={() => setShowForm(true)}>
            Dodaj pierwszego vendora
          </Button>
        </Card>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <VendorForm
            vendor={editing || undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        </div>
      )}
    </Layout>
  );
};