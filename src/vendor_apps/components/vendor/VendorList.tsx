import React, { useState, useEffect } from 'react';
import { Vendor } from '../../types/vendor.types';
import { VendorService } from '../../services/VendorService';
import { VendorForm } from './VendorForm';

export const VendorList: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
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
      <div className="flex items-center justify-center min-h-screen text-xl">
        Ładowanie...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dostawcy</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Dodaj
        </button>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((v) => (
          <div key={v.id} className="bg-white p-4 rounded shadow border">
            <div className="flex justify-between mb-3">
              <div>
                <h3 className="text-xl font-semibold">{v.name}</h3>
                <p className="text-gray-600">/{v.slug}</p>
              </div>
              <div className="space-x-2 text-sm">
                <button
                  onClick={() => {
                    setEditing(v);
                    setShowForm(true);
                  }}
                  className="text-blue-600"
                >
                  Edytuj
                </button>
                <button
                  onClick={() => handleDelete(v)}
                  className="text-red-600"
                >
                  Usuń
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              <strong>Tabele:</strong> {v.schema.tables.length}
            </p>
            <div className="mt-2 text-xs">
              {v.schema.tables.map((t, i) => (
                <div key={i} className="border-l-2 border-gray-200 pl-2 mb-1">
                  <div className="font-medium">{`${v.slug}_${t.name}`}</div>
                  <div className="text-gray-500">
                    {t.columns.map((c) => c.name).join(', ')}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Utworzono: {v.created_at ? new Date(v.created_at).toLocaleDateString('pl-PL') : '—'}
            </div>
          </div>
        ))}
      </div>

      {vendors.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          Brak dostawców. Dodaj nowego.
        </div>
      )}

      {showForm && (
        <VendorForm
          vendor={editing || undefined}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};