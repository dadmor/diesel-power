// src/components/Dashboard.tsx - Updated with new routing
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
    try {
      await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
      setVendors(vendors.filter(v => v.id !== id));
    } catch (error) {
      console.error('Error deleting vendor:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600" />
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
          <p className="text-red-800 mb-4">Błąd: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel Zarządzania</h1>
            <p className="mt-1 text-gray-600">Przegląd wszystkich aplikacji</p>
          </div>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            <Plus className="h-5 w-5" />
            <span>Nowa aplikacja</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">Aplikacje</p>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-gray-900">{vendors.length}</p>
            <p className="mt-1 text-sm text-gray-500">
              Łączna liczba aplikacji
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">Tabele</p>
              <DatabaseIcon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-gray-900">{totalTables}</p>
            <p className="mt-1 text-sm text-gray-500">
              Łączna liczba tabel
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">Pola</p>
              <TableIcon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-gray-900">{totalFields}</p>
            <p className="mt-1 text-sm text-gray-500">
              Łączna liczba pól
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">Ostatnia</p>
              <CalendarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-gray-900">
              {lastVendor ? formatDate(lastVendor.created_at) : '-'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Data utworzenia
            </p>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">Wszystkie aplikacje</h2>
          </div>
          
          {vendors.length === 0 ? (
            <div className="p-12 text-center">
              <DatabaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Brak aplikacji</h3>
              <p className="text-gray-500 mb-6">Utwórz swoją pierwszą aplikację, aby rozpocząć.</p>
              <button
                onClick={onCreateNew}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>Utwórz pierwszą aplikację</span>
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aplikacja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tabele
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utworzono
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                        <div className="text-sm text-gray-500">{vendor.schema.tables.length} tabel, {vendor.schema.tables.reduce((sum, t) => sum + t.fields.length, 0)} pól</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      /{vendor.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendor.schema.tables.map(t => t.name).join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(vendor.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => window.open(`/${vendor.slug}`, '_blank')}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Otwórz aplikację"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditApp(vendor)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edytuj schema"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Usuń aplikację"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};