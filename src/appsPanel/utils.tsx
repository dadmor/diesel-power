// src/appsPanel/utils.tsx - BEZ ZMIAN (już optymalne)
import React from "react";

export const validateSchema = (schemaString: string) => {
  try {
    const schema = JSON.parse(schemaString);
    if (!schema?.tables || !Array.isArray(schema.tables))
      return { valid: false, error: 'Schema must have "tables" array' };
    for (const table of schema.tables) {
      if (!table.name || !table.fields || !Array.isArray(table.fields))
        return { valid: false, error: 'Table must have "name" and "fields"' };
      for (const field of table.fields) {
        if (!field.name || !field.type)
          return { valid: false, error: 'Field must have "name" and "type"' };
      }
    }
    return { valid: true, schema };
  } catch {
    return { valid: false, error: "Invalid JSON" };
  }
};

export const Notification = ({ type, message, onClose }: any) => {
  if (!message) return null;
  const bg =
    type === "success"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";
  return (
    <div className={`${bg} px-4 py-3 rounded mb-4 flex justify-between`}>
      <span>
        {type === "success" ? "✅" : "❌"} {message}
      </span>
      <button onClick={onClose}>×</button>
    </div>
  );
};

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <h3 className="font-bold mb-2">{title}</h3>
        <p className="mb-4">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">
            Anuluj
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Usuń
          </button>
        </div>
      </div>
    </div>
  );
};