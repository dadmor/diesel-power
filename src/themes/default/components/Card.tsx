// src/themes/default/components/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  editing?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, editing = false }) => {
  return (
    <div className={`p-3 mb-3 border border-gray-300 rounded ${editing ? 'bg-blue-50' : 'bg-white'}`}>
      {children}
    </div>
  );
};