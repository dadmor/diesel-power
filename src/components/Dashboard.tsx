// ===== src/components/Dashboard.tsx =====
import React, { useState, useEffect } from 'react';
import { Vendor } from '../types';
import { getVendors } from '../lib/supabase';
import { Users, Database as DatabaseIcon, Calendar, Plus, Edit3, Trash2, Eye } from 'lucide-react';

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
      .then(setVendors)
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    apps: vendors.length,
    tables: vendors.reduce((acc, v) => acc + v.schema.tables.length, 0),
    fields: vendors.reduce((acc, v) => acc + v.schema.tables.reduce((sum, t) => sum + t.fields.length, 0), 0),
    lastDate: vendors[0]?.created_at
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Na pewno usunąć tę aplikację?')) return;
    try {
      await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
      setVendors(vendors.filter(v => v.id !== id));
    } catch (error) {
      console.error('Error deleting vendor:', error);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white/70 backdrop-blur-sm border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-light tracking-tight text-slate-900">Panel Zarządzania</h1>
              <p className="mt-2 text-slate-600">Przegląd wszystkich aplikacji</p>
            </div>
            <button
              onClick={onCreateNew}
              className="flex items-center space-x-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-medium transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              <span>Nowa aplikacja</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8 flex flex-col gap-6">
        {/* Stats Grid - Golden ratio spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-13">
          <StatCard icon={Users} label="Aplikacje" value={stats.apps} sublabel="Łączna liczba" />
          <StatCard icon={DatabaseIcon} label="Tabele" value={stats.tables} sublabel="Łączna liczba" />
          <StatCard icon={Calendar} label="Pola" value={stats.fields} sublabel="Łączna liczba" />
          <StatCard icon={Calendar} label="Ostatnia" value={stats.lastDate ? new Date(stats.lastDate).toLocaleDateString('pl-PL') : '-'} sublabel="Data utworzenia" />
        </div>

        {/* Applications */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-200/60">
            <h2 className="text-xl font-light text-slate-900">Wszystkie aplikacje</h2>
          </div>
          
          {vendors.length === 0 ? (
            <EmptyState onCreateNew={onCreateNew} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-8 py-5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aplikacja</th>
                    <th className="px-8 py-5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Slug</th>
                    <th className="px-8 py-5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tabele</th>
                    <th className="px-8 py-5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Utworzono</th>
                    <th className="px-8 py-5 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {vendors.map(vendor => (
                    <VendorRow 
                      key={vendor.id} 
                      vendor={vendor} 
                      onEdit={() => onEditApp(vendor)}
                      onDelete={() => handleDelete(vendor.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: any; label: string; value: number | string; sublabel: string }> = ({ icon: Icon, label, value, sublabel }) => (
  <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-6">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-medium text-slate-900">{label}</p>
      <Icon className="h-5 w-5 text-slate-400" />
    </div>
    <p className="text-3xl font-light text-slate-900 mb-1">{value}</p>
    <p className="text-xs text-slate-500">{sublabel}</p>
  </div>
);

const VendorRow: React.FC<{ vendor: Vendor; onEdit: () => void; onDelete: () => void }> = ({ vendor, onEdit, onDelete }) => (
  <tr className="hover:bg-slate-50/50 transition-colors duration-150">
    <td className="px-8 py-6">
      <div>
        <div className="text-sm font-medium text-slate-900">{vendor.name}</div>
        <div className="text-xs text-slate-500">
          {vendor.schema.tables.length} tabel, {vendor.schema.tables.reduce((sum, t) => sum + t.fields.length, 0)} pól
        </div>
      </div>
    </td>
    <td className="px-8 py-6 text-sm text-slate-500">/{vendor.slug}</td>
    <td className="px-8 py-6 text-sm text-slate-900">
      {vendor.schema.tables.map(t => t.name).join(', ')}
    </td>
    <td className="px-8 py-6 text-sm text-slate-500">
      {new Date(vendor.created_at).toLocaleDateString('pl-PL')}
    </td>
    <td className="px-8 py-6">
      <div className="flex items-center justify-end space-x-3">
        <ActionButton onClick={() => window.open(`/${vendor.slug}`, '_blank')} icon={Eye} color="emerald" />
        <ActionButton onClick={onEdit} icon={Edit3} color="blue" />
        <ActionButton onClick={onDelete} icon={Trash2} color="red" />
      </div>
    </td>
  </tr>
);

const ActionButton: React.FC<{ onClick: () => void; icon: any; color: string }> = ({ onClick, icon: Icon, color }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-lg transition-colors duration-150 text-${color}-600 hover:bg-${color}-50`}
  >
    <Icon className="h-4 w-4" />
  </button>
);

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
    <div className="flex items-center space-x-3">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900" />
      <p className="text-slate-600">Ładowanie...</p>
    </div>
  </div>
);

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
    <div className="bg-red-50/80 border border-red-200/60 rounded-2xl p-8 max-w-md backdrop-blur-sm">
      <p className="text-red-800 mb-4 text-sm">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors duration-200 text-sm"
      >
        Spróbuj ponownie
      </button>
    </div>
  </div>
);

const EmptyState: React.FC<{ onCreateNew: () => void }> = ({ onCreateNew }) => (
  <div className="p-16 text-center">
    <DatabaseIcon className="h-16 w-16 text-slate-400 mx-auto mb-6 opacity-60" />
    <h3 className="text-xl font-light text-slate-900 mb-3">Brak aplikacji</h3>
    <p className="text-slate-500 mb-8 text-sm">Utwórz swoją pierwszą aplikację, aby rozpocząć.</p>
    <button
      onClick={onCreateNew}
      className="flex items-center space-x-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-medium mx-auto transition-all duration-200"
    >
      <Plus className="h-5 w-5" />
      <span>Utwórz pierwszą aplikację</span>
    </button>
  </div>
);