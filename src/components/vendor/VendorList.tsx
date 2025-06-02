// ===== src/components/vendor/VendorList.tsx =====
import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Field } from '../../types';

interface VendorListProps {
  tableName: string;
  fields: Field[];
  displayName: string;
}

export const VendorList: React.FC<VendorListProps> = ({ tableName, fields, displayName }) => {
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

  const handleDelete = async (id: number) => {
    if (confirm('Czy na pewno chcesz usunąć ten rekord?')) {
      try {
        await supabase.from(tableName).delete().eq('id', id);
        setData(data.filter(record => record.id !== id));
      } catch (error) {
        console.error('Error deleting record:', error);
      }
    }
  };

  if (loading) {
    return <div className="p-4">Ładowanie...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold capitalize">{displayName}</h1>
        <Link 
          to={`create`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Dodaj nowy
        </Link>
      </div>
      
      {data.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Brak danych</p>
          <Link 
            to="create"
            className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Dodaj pierwszy rekord
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                {fields.map(field => (
                  <th key={field.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {field.name}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akcje</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.id}</td>
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
      )}
    </div>
  );
};