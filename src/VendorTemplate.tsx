// ===== src/VendorTemplate.tsx =====
import React from 'react';
import { Refine } from '@refinedev/core';
import { dataProvider } from '@refinedev/supabase';
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Vendor } from './types';

interface VendorAppProps {
  vendor: Vendor;
}

const ResourceList: React.FC<{ tableName: string; fields: any[] }> = ({ tableName, fields }) => {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: records, error } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setData(records || []);
      } catch (error) {
        console.error(`Error fetching ${tableName}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableName]);

  if (loading) {
    return <div className="p-4">Ładowanie...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold capitalize">{tableName.split('_')[1]}</h1>
        <Link 
          to={`create`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Dodaj nowy
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              {fields.map(field => (
                <th key={field.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {field.name}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((record) => (
              <tr key={record.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.id}
                </td>
                {fields.map(field => (
                  <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record[field.name] || '-'}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Link 
                    to={`${record.id}/edit`}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edytuj
                  </Link>
                  <button 
                    onClick={() => handleDelete(record.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Usuń
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  async function handleDelete(id: number) {
    if (confirm('Czy na pewno chcesz usunąć ten rekord?')) {
      try {
        await supabase.from(tableName).delete().eq('id', id);
        setData(data.filter(record => record.id !== id));
      } catch (error) {
        console.error('Error deleting record:', error);
      }
    }
  }
};

const ResourceForm: React.FC<{ tableName: string; fields: any[]; isEdit?: boolean }> = ({ 
  tableName, 
  fields, 
  isEdit = false 
}) => {
  const { id } = useParams();
  const [formData, setFormData] = React.useState<any>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isEdit && id) {
      const fetchRecord = async () => {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single();
        
        if (!error && data) {
          setFormData(data);
        }
      };
      fetchRecord();
    }
  }, [isEdit, id, tableName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit && id) {
        await supabase
          .from(tableName)
          .update(formData)
          .eq('id', id);
      } else {
        await supabase
          .from(tableName)
          .insert([formData]);
      }
      
      // Redirect back to list
      window.history.back();
    } catch (error) {
      console.error('Error saving record:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (fieldName: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldName]: value
    }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button 
          onClick={() => window.history.back()}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Powrót
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">
          {isEdit ? 'Edytuj' : 'Dodaj'} {tableName.split('_')[1]}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.name}
              </label>
              {field.type === 'select' ? (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Wybierz...</option>
                  {field.options?.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.type === 'text' ? (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
          ))}
          
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Zapisywanie...' : 'Zapisz'}
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const VendorApp: React.FC<VendorAppProps> = ({ vendor }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800">{vendor.name}</h2>
            <p className="text-gray-600 text-sm">Panel administracyjny</p>
          </div>
          
          <nav className="mt-6">
            {vendor.schema.tables.map(table => (
              <Link
                key={table.name}
                to={`/${vendor.slug}/${table.name}`}
                className="block px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-r-2 border-transparent hover:border-blue-600"
              >
                {table.name.charAt(0).toUpperCase() + table.name.slice(1)}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={
              <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                  Witaj w {vendor.name}
                </h1>
                <p className="text-gray-600 mb-6">
                  Wybierz sekcję z menu po lewej stronie, aby rozpocząć zarządzanie danymi.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vendor.schema.tables.map(table => (
                    <Link
                      key={table.name}
                      to={`/${vendor.slug}/${table.name}`}
                      className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
                    >
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {table.name.charAt(0).toUpperCase() + table.name.slice(1)}
                      </h3>
                      <p className="text-gray-600">
                        Zarządzaj danymi tabeli {table.name}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            } />
            
            {vendor.schema.tables.map(table => {
              const tableName = `${vendor.slug}_${table.name}`;
              return (
                <React.Fragment key={table.name}>
                  <Route 
                    path={`/${table.name}`} 
                    element={<ResourceList tableName={tableName} fields={table.fields} />} 
                  />
                  <Route 
                    path={`/${table.name}/create`} 
                    element={<ResourceForm tableName={tableName} fields={table.fields} />} 
                  />
                  <Route 
                    path={`/${table.name}/:id/edit`} 
                    element={<ResourceForm tableName={tableName} fields={table.fields} isEdit />} 
                  />
                </React.Fragment>
              );
            })}
          </Routes>
        </div>
      </div>
    </div>
  );
};
