// src/app-templates/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { Vendor } from '../../vendor_apps';
import { PageConfig } from '../utils/routeGenerator';

interface HomePageProps {
  vendor: Vendor;
  user: any;
  config: PageConfig;
}

export const HomePage: React.FC<HomePageProps> = ({ vendor, user, config }) => {
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    generateStats();
  }, [vendor]);

  const generateStats = () => {
    const tableStats = vendor.schema.tables?.map((table: any) => ({
      name: table.name,
      label: formatTableName(table.name),
      count: Math.floor(Math.random() * 100) + 10,
      icon: getTableIcon(table.name),
      color: getTableColor(table.name)
    })) || [];

    setStats(tableStats);
  };

  const formatTableName = (name: string): string => {
    const translations: Record<string, string> = {
      'users': 'Użytkownicy',
      'tickets': 'Zgłoszenia',
      'comments': 'Komentarze',
      'categories': 'Kategorie',
      'customers': 'Klienci',
      'deals': 'Okazje'
    };
    return translations[name] || name;
  };

  const getTableIcon = (tableName: string): string => {
    const iconMap: Record<string, string> = {
      'users': '👥',
      'tickets': '🎫',
      'comments': '💬',
      'categories': '📂',
      'customers': '🏢',
      'deals': '💰'
    };
    return iconMap[tableName] || '📋';
  };

  const getTableColor = (tableName: string): string => {
    const colorMap: Record<string, string> = {
      'users': 'blue',
      'tickets': 'red',
      'comments': 'green',
      'categories': 'purple',
      'customers': 'indigo',
      'deals': 'yellow'
    };
    return colorMap[tableName] || 'gray';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
          <p className="text-gray-600">Witaj, {user.full_name || user.email}</p>
        </div>
        <div className="text-sm text-gray-500">
          Ostatnia aktywność: {new Date().toLocaleDateString('pl-PL')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className={`text-3xl mr-4`}>
                {stat.icon}
              </div>
              <div>
                <div className={`text-2xl font-bold text-${stat.color}-600`}>
                  {stat.count}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.label}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Items Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vendor.schema.tables?.slice(0, 2).map((table: any, index: number) => (
          <RecentItemsWidget 
            key={index}
            vendor={vendor}
            user={user}
            table={table.name}
            title={`Ostatnie ${formatTableName(table.name)}`}
          />
        ))}
      </div>

      {/* App Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informacje o aplikacji</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Nazwa:</span>
            <div className="text-gray-600">{vendor.name}</div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Slug:</span>
            <div className="text-gray-600 font-mono">{vendor.slug}</div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Tabele:</span>
            <div className="text-gray-600">{vendor.schema.tables?.length || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Import dla RecentItemsWidget
const RecentItemsWidget: React.FC<{
  vendor: Vendor;
  user: any;
  table: string;
  title: string;
}> = ({ vendor, user, table, title }) => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    generateRecentItems();
  }, [table]);

  const generateRecentItems = () => {
    const tableSchema = vendor.schema.tables?.find((t: any) => t.name === table);
    if (!tableSchema) return;

    const recentItems = [];
    for (let i = 1; i <= 5; i++) {
      const item: any = {
        id: i,
        created_at: new Date(Date.now() - i * 86400000).toISOString()
      };

      // Znajdź pierwszą kolumnę tekstową
      const firstTextColumn = tableSchema.columns?.find((col: any) => col.type === 'text');
      if (firstTextColumn) {
        item[firstTextColumn.name] = `Przykład ${firstTextColumn.name} ${i}`;
      }

      recentItems.push(item);
    }

    setItems(recentItems);
  };

  const getDisplayText = (item: any) => {
    const keys = Object.keys(item).filter(key => key !== 'id' && key !== 'created_at');
    const firstKey = keys[0];
    return item[firstKey] || `Element ${item.id}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">
                {getDisplayText(item)}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(item.created_at).toLocaleDateString('pl-PL')}
              </div>
            </div>
            <button className="text-blue-600 hover:text-blue-800 text-sm">
              Szczegóły
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Zobacz wszystkie →
        </button>
      </div>
    </div>
  );
};