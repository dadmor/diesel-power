// src/themes/default/components/Form.tsx
import React from 'react';

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'textarea';
  rows?: number;
}

export const Input: React.FC<InputProps> = ({ label, value, onChange, type = 'text', rows = 4 }) => {
  return (
    <div className="mb-3">
      <label className="block mb-1 font-medium">{label}:</label>
      {type === 'textarea' ? (
        <textarea
          rows={rows}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded font-mono"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
      )}
    </div>
  );
};