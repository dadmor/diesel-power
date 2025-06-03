// ===== src/components/Dashboard.tsx ===== (Fixed)
import React from 'react';
import { Vendor } from '../types';
import { Users, Database as DatabaseIcon, Calendar, Plus, Edit3, Trash2, Eye, MessageSquare } from 'lucide-react';
import { Layout, Button, Card, EmptyState, Loading } from './shared';
import { useCrud } from '../hooks';

interface DashboardProps {
  onCreateNew: () => void;
  onEditApp: (vendor: Vendor) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onCreateNew, onEditApp }) => {
  const { data: vendors, loading, error, remove } = useCrud('vendors');

  const stats = {
    apps: vendors.length,
    tables: vendors.reduce((acc, v) => acc + v.schema.tables.length, 0),
    fields: vendors.reduce((acc, v) => acc + v.schema.tables.reduce((sum, t) => sum + t.fields.length, 0), 0),
    lastDate: vendors[0]?.created_at
  };

  const handleDelete = async (id: string) => {
    if (confirm('Na pewno usunąć tę aplikację?')) {
      await remove(id);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;

  return (
    <Layout 
      title="Panel Zarządzania"
      subtitle="Przegląd wszystkich aplikacji"
      actions={
        <Button icon={Plus} onClick={onCreateNew}>
          Nowa aplikacja
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Users} label="Aplikacje" value={stats.apps} />
        <StatCard icon={DatabaseIcon} label="Tabele" value={stats.tables} />
        <StatCard icon={Calendar} label="Pola" value={stats.fields} />
        <StatCard icon={Calendar} label="Ostatnia" value={stats.lastDate ? new Date(stats.lastDate).toLocaleDateString('pl-PL') : '-'} />
      </div>

      {/* Applications */}
      <Card header={<h2 className="text-xl font-light text-slate-900">Wszystkie aplikacje</h2>}>
        {vendors.length === 0 ? (
          <EmptyState
            icon={DatabaseIcon}
            title="Brak aplikacji"
            description="Utwórz swoją pierwszą aplikację, aby rozpocząć."
            action={
              <Button icon={Plus} onClick={onCreateNew}>
                Utwórz pierwszą aplikację
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto -m-8">
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr>
                  {['Aplikacja', 'Slug', 'Tabele', 'Utworzono', 'Akcje'].map(header => (
                    <th key={header} className="px-8 py-5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {vendors.map(vendor => (
                  <VendorRow 
                    key={vendor.id} 
                    vendor={vendor} 
                    onEdit={() => onEditApp(vendor)}
                    onChatEdit={() => window.location.href = `/edit-chat/${vendor.id}`}
                    onDelete={() => handleDelete(vendor.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Layout>
  );
};

const StatCard: React.FC<{ icon: any; label: string; value: number | string }> = ({ 
  icon: Icon, label, value 
}) => (
  <Card className="p-6">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-medium text-slate-900">{label}</p>
      <Icon className="h-5 w-5 text-slate-400" />
    </div>
    <p className="text-3xl font-light text-slate-900">{value}</p>
  </Card>
);

const VendorRow: React.FC<{ 
  vendor: Vendor; 
  onEdit: () => void; 
  onChatEdit: () => void;
  onDelete: () => void 
}> = ({ vendor, onEdit, onChatEdit, onDelete }) => (
  <tr className="hover:bg-slate-50/50 transition-colors duration-150">
    <td className="px-8 py-6">
      <div className="text-sm font-medium text-slate-900">{vendor.name}</div>
      <div className="text-xs text-slate-500">
        {vendor.schema.tables.length} tabel, {vendor.schema.tables.reduce((sum, t) => sum + t.fields.length, 0)} pól
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
      <div className="flex items-center justify-end space-x-2">
        <ActionButton 
          onClick={() => window.open(`/${vendor.slug}`, '_blank')} 
          icon={Eye} 
          tooltip="Otwórz aplikację"
        />
        <ActionButton 
          onClick={onChatEdit} 
          icon={MessageSquare} 
          tooltip="Edytuj przez chat"
        />
        <ActionButton 
          onClick={onEdit} 
          icon={Edit3} 
          tooltip="Edytuj schema"
        />
        <ActionButton 
          onClick={onDelete} 
          icon={Trash2} 
          color="red" 
          tooltip="Usuń aplikację"
        />
      </div>
    </td>
  </tr>
);

const ActionButton: React.FC<{ 
  onClick: () => void; 
  icon: any; 
  color?: string;
  tooltip?: string;
}> = ({ onClick, icon: Icon, color = 'slate', tooltip }) => (
  <button
    onClick={onClick}
    title={tooltip}
    className={`p-2 rounded-lg transition-colors duration-150 text-${color}-600 hover:bg-${color}-50 hover:text-${color}-700`}
  >
    <Icon className="h-4 w-4" />
  </button>
);

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <Layout title="Błąd">
    <div className="bg-red-50/80 border border-red-200/60 rounded-2xl p-8 max-w-md mx-auto">
      <p className="text-red-800 mb-4 text-sm">{error}</p>
      <Button onClick={() => window.location.reload()}>
        Spróbuj ponownie
      </Button>
    </div>
  </Layout>
);