// src/themes/default/components/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div className={`
      bg-white rounded-xl shadow-lg border border-gray-200 p-6
      ${hover ? 'hover:shadow-xl hover:scale-105 transition-all duration-200' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};
