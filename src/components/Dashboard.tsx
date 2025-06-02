// src/components/Dashboard.tsx - Główny panel zarządzania aplikacjami
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getVendors } from '../lib/supabase';
import { Vendor } from '../types';
import { Plus, Settings, Eye, Calendar, Database, Edit, Search } from 'lucide-react';
import { SchemaNavigator } from './SchemaNavigator';

interface DashboardProps {
  onCreateNew: () => void;
  onEditApp: (vendor: Vendor) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onCreateNew, onEditApp }) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [schemaNavigatorVendor, setSchemaNavigatorVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const data = await getVendors();
        setVendors(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie aplikacji...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800">Błąd: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel Zarządzania</h1>
              <p className="text-gray-600">Zarządzaj swoimi aplikacjami</p>
            </div>
            <button
              onClick={onCreateNew}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Nowa Aplikacja</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Łączna liczba aplikacji</p>
                <p className="text-2xl font-semibold text-gray-900">{vendors.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Łączna liczba tabel</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {vendors.reduce((acc, vendor) => acc + vendor.schema.tables.length, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ostatnia aplikacja</p>
                <p className="text-lg font-semibold text-gray-900">
                  {vendors.length > 0 ? formatDate(vendors[0].created_at).split(',')[0] : 'Brak'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Twoje Aplikacje</h2>
          </div>
          
          {vendors.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Brak aplikacji</h3>
              <p className="text-gray-500 mb-4">Rozpocznij od stworzenia swojej pierwszej aplikacji</p>
              <button
                onClick={onCreateNew}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>Stwórz pierwszą aplikację</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {vendors.map((vendor) => (
                <div key={vendor.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          /{vendor.slug}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Database className="h-4 w-4" />
                          <span>{vendor.schema.tables.length} tabel</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Utworzono {formatDate(vendor.created_at)}</span>
                        </div>
                      </div>
                      
                      {/* Schema Preview */}
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {vendor.schema.tables.map((table) => (
                            <span 
                              key={table.name}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                            >
                              {table.name} ({table.fields.length} pól)
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 ml-6">
                      <button
                        onClick={() => setSchemaNavigatorVendor(vendor)}
                        className="inline-flex items-center space-x-1 text-gray-600 hover:text-purple-600 transition-colors"
                        title="Przeglądaj schema"
                      >
                        <Search className="h-4 w-4" />
                        <span className="text-sm">Schema</span>
                      </button>
                      
                      <button
                        onClick={() => onEditApp(vendor)}
                        className="inline-flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Edytuj aplikację"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="text-sm">Edytuj</span>
                      </button>
                      
                      <Link
                        to={`/${vendor.slug}`}
                        className="inline-flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors"
                        title="Otwórz aplikację"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">Otwórz</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schema Navigator Modal */}
      {schemaNavigatorVendor && (
        <SchemaNavigator 
          vendor={schemaNavigatorVendor}
          onClose={() => setSchemaNavigatorVendor(null)}
        />
      )}
    </div>
  );
};