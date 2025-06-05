// src/themes/default/components/SchemaCard.tsx
import React from 'react';
import { JsonViewer } from './JsonViewer';

interface SchemaCardProps {
  title: string;
  description?: string;
  data: any;
  isCompleted?: boolean;
  className?: string;
  maxHeight?: string;
}

export const SchemaCard: React.FC<SchemaCardProps> = ({ 
  title, 
  description, 
  data, 
  isCompleted = false,
  className = "",
  maxHeight = "50vh"
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          {title}
          {isCompleted && (
            <span className="bg-green-100 text-green-800 px-2 py-1 text-xs rounded-full ml-auto">
              ✓ Gotowe
            </span>
          )}
        </h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">
            {description}
          </p>
        )}
      </div>
      <div className={`p-4 overflow-auto`} style={{ maxHeight }}>
        <JsonViewer data={data} />
      </div>
    </div>
  );
};