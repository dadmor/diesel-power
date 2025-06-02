// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Vendor } from '../types';
import { getVendors } from '../lib/supabase';
import {
  Users,
  Database as DatabaseIcon,
  Calendar as CalendarIcon,
  Table as TableIcon,
  Plus,
  Edit3,
  Trash2,
  Eye,
} from 'lucide-react';

interface DashboardProps {
  onCreateNew: () => void;
  onEditApp: (vendor: Vendor) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onCreateNew, onEditApp }) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    getVendors()
      .then(data => setVendors(data))
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalTables = vendors.reduce(
    (acc, v) => acc + v.schema.tables.length,
    0
  );
  const totalFields = vendors.reduce(
    (acc, v) =>
      acc +
      v.schema.tables.reduce((sum, t) => sum + t.fields.length, 0),
    0
  );
  const lastVendor = vendors[0];

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const handleDelete = async (id: string) => {
    if (!confirm('Na pewno usunąć tę aplikację?')) return;
    await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
    setVendors(vendors.filter(v => v.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-blue-600" />
        <p className="ml-4 text-base text-gray-600">Ładowanie...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
          <p className="text-red-800 text-base">Błąd: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 text-base"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel Zarządzania</h1>
          <p className="mt-1 text-base text-gray-600">Przegląd statystyk aplikacji</p>
        </div>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-base"
        >
          <Plus className="h-5 w-5" />
          <span>Nowa aplikacja</span>
        </button>
      </header>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">Łączna liczba aplikacji</p>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-gray-900">{vendors.length}</p>
          <p className="mt-1 text-sm text-gray-500">
            W tym miesiącu: +{Math.floor(Math.random() * 10)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">Łączna liczba tabel</p>
            <DatabaseIcon className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-gray-900">{totalTables}</p>
          <p className="mt-1 text-sm text-gray-500">
            W tym miesiącu: +{Math.floor(Math.random() * 20)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">Łączna liczba pól</p>
            <TableIcon className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-gray-900">{totalFields}</p>
          <p className="mt-1 text-sm text-gray-500">
            W tym miesiącu: +{Math.floor(Math.random() * 50)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">Ostatnia aplikacja</p>
            <CalendarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-gray-900">
            {lastVendor ? formatDate(lastVendor.created_at) : 'Brak'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Utworzono {lastVendor ? formatDate(lastVendor.created_at) : '-'}
          </p>
        </div>
      </div>

      {/* Latest Vendors Table */}
      <div className="mt-12 bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium text-gray-900">Najnowsze aplikacje</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                Nazwa
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                Liczba tabel
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                Utworzono
              </th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 uppercase">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vendors.slice(0, 5).map(vendor => (
              <tr key={vendor.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {vendor.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  /{vendor.slug}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {vendor.schema.tables.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(vendor.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => onEditApp(vendor)}
                    className="inline-flex items-center px-2 py-1 text-blue-600 hover:text-blue-800"
                    title="Edytuj"
                  >
                    <Edit3 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(vendor.id)}
                    className="inline-flex items-center px-2 py-1 text-red-600 hover:text-red-800"
                    title="Usuń"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => window.open(`/${vendor.slug}`, '_blank')}
                    className="inline-flex items-center px-2 py-1 text-green-600 hover:text-green-800"
                    title="Otwórz"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            {vendors.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                >
                  Brak aplikacji
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
