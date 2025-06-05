// src/app-templates/widgets/StatsWidget.tsx
import React, { useState, useEffect } from 'react';
import { Vendor } from '../../vendor_apps';

interface StatsWidgetProps {
  vendor: Vendor;
  user: any;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({ vendor, user }) => {
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Statystyki systemu</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className={`text-3xl mb-2`}>
              {stat.icon}
            </div>
            <div className={`text-2xl font-bold text-${stat.color}-600 mb-1`}>
              {stat.count}
            </div>
            <div className="text-sm text-gray-600">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
