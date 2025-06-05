import React, { useState } from 'react';
import { Vendor, Schema } from '../../types/vendor.types';

interface VendorFormProps {
  vendor?: Vendor;
  onSave: (vendorData: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

const DEFAULT_SCHEMA = `{
  "tables": [
    {
      "name": "users",
      "columns": [
        {"name": "email", "type": "text", "required": true},
        {"name": "full_name", "type": "text", "required": true},
        {"name": "role", "type": "text", "enum": ["admin", "user", "support"]},
        {"name": "active", "type": "boolean"}
      ]
    },
    {
      "name": "tickets",
      "columns": [
        {"name": "title", "type": "text", "required": true},
        {"name": "description", "type": "text"},
        {"name": "status", "type": "text", "enum": ["open", "in_progress", "closed"]},
        {"name": "priority", "type": "integer"},
        {"name": "assigned_to", "type": "integer", "foreignKey": {"table": "users", "column": "id", "onDelete": "SET NULL"}},
        {"name": "created_by", "type": "integer", "required": true, "foreignKey": {"table": "users", "column": "id", "onDelete": "CASCADE"}}
      ]
    },
    {
      "name": "comments",
      "columns": [
        {"name": "content", "type": "text", "required": true},
        {"name": "ticket_id", "type": "integer", "required": true, "foreignKey": {"table": "tickets", "column": "id", "onDelete": "CASCADE"}},
        {"name": "author_id", "type": "integer", "required": true, "foreignKey": {"table": "users", "column": "id", "onDelete": "CASCADE"}}
      ]
    }
  ]
}`;

export const VendorForm: React.FC<VendorFormProps> = ({ vendor, onSave, onCancel }) => {
  const [slug, setSlug] = useState(vendor?.slug || '');
  const [name, setName] = useState(vendor?.name || '');
  const [schemaJson, setSchemaJson] = useState(
    vendor ? JSON.stringify(vendor.schema, null, 2) : DEFAULT_SCHEMA
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (!/^[a-z0-9-]+$/.test(slug)) {
        throw new Error('Slug może zawierać tylko małe litery, cyfry i myślniki.');
      }
      const schema: Schema = JSON.parse(schemaJson);
      await onSave({ slug, name, schema });
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Błędny format JSON w schemacie');
      } else {
        setError(err instanceof Error ? err.message : 'Wystąpił błąd');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          {vendor ? 'Edytuj dostawcę' : 'Nowy dostawca'}
        </h3>
        {error && <div className="text-red-600 mb-4">{error}</div>}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium">Slug</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="helpdesk-app"
              className="mt-1 w-full px-3 py-2 border rounded"
            />
            <p className="text-xs text-gray-500">tylko małe litery, cyfry, myślniki</p>
          </div>
          <div>
            <label className="block text-sm font-medium">Nazwa</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Helpdesk System"
              className="mt-1 w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        <label className="block text-sm font-medium">Schema (JSON)</label>
        <textarea
          required
          value={schemaJson}
          onChange={(e) => setSchemaJson(e.target.value)}
          rows={16}
          className="mt-1 w-full px-3 py-2 border rounded font-mono text-sm"
        />

        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded text-gray-700"
          >
            Anuluj
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Zapisuję...' : 'Zapisz'}
          </button>
        </div>
      </div>
    </div>
  );
};