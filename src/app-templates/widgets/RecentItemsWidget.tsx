// src/app-templates/widgets/RecentItemsWidget.tsx
import React, { useState, useEffect } from 'react';
import { Vendor } from '../../vendor_apps';

interface RecentItemsWidgetProps {
  vendor: Vendor;
  user: any;
  table: string;
  title: string;
}

export const RecentItemsWidget: React.FC<RecentItemsWidgetProps> = ({
  vendor,
  user,
  table,
  title
}) => {
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

      // Generuj dane dla pierwszej kolumny tekstowej (zwykle title/name)
      const firstTextColumn = tableSchema.columns?.find((col: any) => col.type === 'text');
      if (firstTextColumn) {
        item[firstTextColumn.name] = `${firstTextColumn.name} ${i}`;
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