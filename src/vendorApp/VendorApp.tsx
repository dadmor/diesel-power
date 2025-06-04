// ===== src/vendorApp/VendorApp.tsx - NOWY PLIK =====
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../schemaProject';
import DataForm from './components/DataForm';
import DataList from './components/DataList';
import { Sidebar } from 'lucide-react';



interface TableField {
  name: string;
  type: string;
  options?: string[];
}

interface TableSchema {
  name: string;
  fields: TableField[];
}

interface VendorSchema {
  id: string;
  slug: string;
  name: string;
  schema: {
    tables: TableSchema[];
  };
}

const VendorApp: React.FC = () => {
  const { vendorSlug, tableName } = useParams<{ vendorSlug: string; tableName?: string }>();
  const [vendor, setVendor] = useState<VendorSchema | null>(null);
  const [currentTable, setCurrentTable] = useState<TableSchema | null>(null);
  const [data, setData] = useState<Record<string, any[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wczytaj vendor z Supabase
  useEffect(() => {
    loadVendor();
  }, [vendorSlug]);

  // Ustaw aktualną tabelę
  useEffect(() => {
    if (vendor && tableName) {
      const table = vendor.schema.tables.find(t => t.name === tableName);
      setCurrentTable(table || vendor.schema.tables[0]);
    } else if (vendor) {
      setCurrentTable(vendor.schema.tables[0]);
    }
  }, [vendor, tableName]);

  // Wczytaj dane dla aktualnej tabeli
  useEffect(() => {
    if (currentTable && vendor) {
      loadTableData(currentTable.name);
    }
  }, [currentTable, vendor]);

  const loadVendor = async () => {
    if (!vendorSlug) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Sprawdź czy to schema project czy vendor app
      const { data: vendors, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('slug', vendorSlug)
        .single();

      if (error) throw error;
      
      if (!vendors) {
        setError(`Vendor app "${vendorSlug}" not found`);
        return;
      }

      // Konwertuj schema do formatu VendorSchema
      let vendorSchema: VendorSchema;
      
      if (vendors.schema?.type === 'schema_project') {
        // To jest schema project - konwertuj na vendor app
        vendorSchema = {
          id: vendors.id,
          slug: vendors.slug,
          name: vendors.name,
          schema: {
            tables: vendors.schema.layers?.database?.tables || []
          }
        };
      } else {
        // To jest vendor app
        vendorSchema = {
          id: vendors.id,
          slug: vendors.slug,
          name: vendors.name,
          schema: {
            tables: vendors.schema?.tables || []
          }
        };
      }

      setVendor(vendorSchema);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName: string) => {
    if (!vendor) return;
    
    try {
      const physicalTableName = `${vendor.slug}_${tableName}`;
      
      // Sprawdź czy tabela istnieje
      const { data, error } = await supabase
        .from(physicalTableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Jeśli tabela nie istnieje, utwórz ją
        if (error.code === '42P01') {
          await createPhysicalTable(tableName);
          setData(prev => ({ ...prev, [tableName]: [] }));
        } else {
          throw error;
        }
      } else {
        setData(prev => ({ ...prev, [tableName]: data || [] }));
      }
    } catch (err: any) {
      console.error('Error loading table data:', err);
      setData(prev => ({ ...prev, [tableName]: [] }));
    }
  };

  const createPhysicalTable = async (tableName: string) => {
    if (!vendor || !currentTable) return;
    
    const physicalTableName = `${vendor.slug}_${tableName}`;
    
    // Mapuj typy pól na SQL
    const columns = currentTable.fields.map(field => {
      let sqlType = 'TEXT';
      switch (field.type) {
        case 'number':
        case 'integer':
          sqlType = 'INTEGER';
          break;
        case 'boolean':
          sqlType = 'BOOLEAN';
          break;
        case 'date':
        case 'datetime':
          sqlType = 'DATE';
          break;
        default:
          sqlType = 'TEXT';
      }
      return `${field.name} ${sqlType}`;
    }).join(', ');

    const createSQL = `
      CREATE TABLE IF NOT EXISTS ${physicalTableName} (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        ${columns},
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: createSQL });
      if (error) throw error;
      
      console.log(`✅ Created table: ${physicalTableName}`);
    } catch (err: any) {
      console.error('Error creating table:', err);
    }
  };

  const handleSave = async (formData: any) => {
    if (!currentTable || !vendor) return;
    
    const physicalTableName = `${vendor.slug}_${currentTable.name}`;
    
    try {
      if (editingItem !== null && editingItem.id) {
        // Update
        const { error } = await supabase
          .from(physicalTableName)
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingItem.id);
        
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from(physicalTableName)
          .insert([formData]);
        
        if (error) throw error;
      }
      
      // Reload data
      await loadTableData(currentTable.name);
      setShowForm(false);
      setEditingItem(null);
      
    } catch (err: any) {
      alert(`Error saving: ${err.message}`);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item: any) => {
    if (!currentTable || !vendor || !item.id) return;
    
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const physicalTableName = `${vendor.slug}_${currentTable.name}`;
    
    try {
      const { error } = await supabase
        .from(physicalTableName)
        .delete()
        .eq('id', item.id);
      
      if (error) throw error;
      
      // Reload data
      await loadTableData(currentTable.name);
      
    } catch (err: any) {
      alert(`Error deleting: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {vendorSlug}...</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">App Not Found</h2>
          <p className="text-gray-600 mb-4">{error || `Vendor app "${vendorSlug}" doesn't exist.`}</p>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Generator
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
                <p className="text-sm text-gray-500">/{vendor.slug} • Generated CRUD App</p>
              </div>
              <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                ✓ Live
              </span>
            </div>
            <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">
              ← Back to Generator
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <Sidebar
            tables={vendor.schema.tables}
            currentTable={currentTable}
            onTableSelect={setCurrentTable}
            data={data}
            vendorSlug={vendor.slug}
          />

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {currentTable && (
              <>
                {showForm ? (
                  <DataForm
                    table={currentTable}
                    initialData={editingItem}
                    onSave={handleSave}
                    onCancel={() => { 
                      setShowForm(false); 
                      setEditingItem(null); 
                    }}
                  />
                ) : (
                  <DataList
                    table={currentTable}
                    data={data[currentTable.name] || []}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAdd={() => setShowForm(true)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorApp;