// ===== src/components/Dashboard.tsx ===== (Kompaktowa wersja)
import React from "react";
import { Vendor } from "../types";
import {
  Users,
  Database as DatabaseIcon,
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Eye,
  MessageSquare,
} from "lucide-react";
import { Button, EmptyState, Loading } from "./shared";
import { useCrud } from "../hooks";

interface DashboardProps {
  onCreateNew: () => void;
  onEditApp: (vendor: Vendor) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onCreateNew,
  onEditApp,
}) => {
  const { data: vendors, loading, error, remove } = useCrud("vendors");

  const stats = {
    apps: vendors.length,
    tables: vendors.reduce((acc, v) => acc + v.schema.tables.length, 0),
    fields: vendors.reduce(
      (acc, v) =>
        acc + v.schema.tables.reduce((sum, t) => sum + t.fields.length, 0),
      0
    ),
  };

  const handleDelete = async (id: string) => {
    if (confirm("Na pewno usunąć?")) {
      await remove(id);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Compact Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-slate-900">
            Panel Zarządzania
          </h1>
          <p className="text-xs text-slate-500">Przegląd aplikacji</p>
        </div>
        <Button size="sm" icon={Plus} onClick={onCreateNew}>
          Nowa aplikacja
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Compact Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Users} label="Aplikacje" value={stats.apps} />
          <StatCard icon={DatabaseIcon} label="Tabele" value={stats.tables} />
          <StatCard icon={Calendar} label="Pola" value={stats.fields} />
        </div>

        {/* Applications */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-sm font-medium text-slate-900">
              Wszystkie aplikacje
            </h2>
          </div>

          {vendors.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={DatabaseIcon}
                title="Brak aplikacji"
                description="Utwórz swoją pierwszą aplikację."
                action={
                  <Button size="sm" icon={Plus} onClick={onCreateNew}>
                    Utwórz aplikację
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {vendors.map((vendor) => (
                <VendorRow
                  key={vendor.id}
                  vendor={vendor}
                  onEdit={() => onEditApp(vendor)}
                  onChatEdit={() =>
                    (window.location.href = `/edit-chat/${vendor.id}`)
                  }
                  onDelete={() => handleDelete(vendor.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: any;
  label: string;
  value: number | string;
}> = ({ icon: Icon, label, value }) => (
  <div className="bg-white p-3 rounded-lg border border-slate-200">
    <div className="flex items-center justify-between mb-1">
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <Icon className="h-4 w-4 text-slate-400" />
    </div>
    <p className="text-xl font-light text-slate-900">{value}</p>
  </div>
);

const VendorRow: React.FC<{
  vendor: Vendor;
  onEdit: () => void;
  onChatEdit: () => void;
  onDelete: () => void;
}> = ({ vendor, onEdit, onChatEdit, onDelete }) => (
  <div className="p-4 hover:bg-slate-50">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <div>
            <h3 className="text-sm font-medium text-slate-900">
              {vendor.name}
            </h3>
            <p className="text-xs text-slate-500">
              /{vendor.slug} • {vendor.schema.tables.length} tabel •{" "}
              {vendor.schema.tables.reduce(
                (sum, t) => sum + t.fields.length,
                0
              )}{" "}
              pól
            </p>
          </div>
        </div>
        <div className="mt-1">
          <p className="text-xs text-slate-600">
            {vendor.schema.tables
              .map((t) => t.name)
              .slice(0, 3)
              .join(", ")}
            {vendor.schema.tables.length > 3 && "..."}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-1">
        <ActionButton
          onClick={() => window.open(`/${vendor.slug}`, "_blank")}
          icon={Eye}
        />
        <ActionButton onClick={onChatEdit} icon={MessageSquare} />
        <ActionButton onClick={onEdit} icon={Edit3} />
        <ActionButton onClick={onDelete} icon={Trash2} color="red" />
      </div>
    </div>
  </div>
);

const ActionButton: React.FC<{
  onClick: () => void;
  icon: any;
  color?: string;
}> = ({ onClick, icon: Icon, color = "slate" }) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded transition-colors text-${color}-600 hover:bg-${color}-50`}
  >
    <Icon className="h-4 w-4" />
  </button>
);

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
      <p className="text-red-800 text-sm mb-4">{error}</p>
      <Button size="sm" onClick={() => window.location.reload()}>
        Spróbuj ponownie
      </Button>
    </div>
  </div>
);
