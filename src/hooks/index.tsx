// ===== src/hooks/index.tsx =====
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Field } from '../types';

// CRUD Hook
export const useCrud = (tableName: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: records, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setData(records || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const create = async (item: any) => {
    const { data: newItem, error } = await supabase
      .from(tableName)
      .insert([item])
      .select()
      .single();
    
    if (error) throw error;
    setData(prev => [newItem, ...prev]);
    return newItem;
  };

  const update = async (id: string, updates: any) => {
    const { data: updatedItem, error } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    setData(prev => prev.map(item => item.id === id ? updatedItem : item));
    return updatedItem;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
    setData(prev => prev.filter(item => item.id !== id));
  };

  const findById = async (id: string) => {
    const { data: item, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return item;
  };

  useEffect(() => {
    fetchData();
  }, [tableName]);

  return {
    data,
    loading,
    error,
    create,
    update,
    remove,
    findById,
    refresh: fetchData
  };
};

// Form Hook
export const useForm = (initialValues: any = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setValue = (name: string, value: any) => {
    setValues((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const setFieldTouched = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const validateField = (field: Field, value: any) => {
    if (field.required && (!value || value.toString().trim() === '')) {
      return `${field.name} jest wymagane`;
    }
    if (field.type === 'number' && value && isNaN(Number(value))) {
      return `${field.name} musi być liczbą`;
    }
    return '';
  };

  const validate = (fields: Field[]) => {
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      const error = validateField(field, values[field.name]);
      if (error) newErrors[field.name] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validate,
    reset,
    setValues
  };
};

// Schema Editor Hook
export const useSchemaEditor = (initialSchema: any) => {
  const [schema, setSchema] = useState(initialSchema);

  const addTable = () => {
    const newTable = {
      name: `table_${schema.tables.length + 1}`,
      fields: [{ name: 'name', type: 'string' }]
    };
    setSchema((prev: any) => ({ ...prev, tables: [...prev.tables, newTable] }));
    return schema.tables.length;
  };

  const updateTable = (index: number, updates: any) => {
    setSchema((prev: any) => ({
      ...prev,
      tables: prev.tables.map((table: any, i: number) => 
        i === index ? { ...table, ...updates } : table
      )
    }));
  };

  const deleteTable = (index: number) => {
    setSchema((prev: any) => ({
      ...prev,
      tables: prev.tables.filter((_: any, i: number) => i !== index)
    }));
  };

  const addField = (tableIndex: number) => {
    const table = schema.tables[tableIndex];
    updateTable(tableIndex, {
      fields: [...table.fields, { name: `field_${table.fields.length + 1}`, type: 'string' }]
    });
  };

  const updateField = (tableIndex: number, fieldIndex: number, updates: any) => {
    const table = schema.tables[tableIndex];
    updateTable(tableIndex, {
      fields: table.fields.map((field: any, i: number) => 
        i === fieldIndex ? { ...field, ...updates } : field
      )
    });
  };

  const deleteField = (tableIndex: number, fieldIndex: number) => {
    const table = schema.tables[tableIndex];
    updateTable(tableIndex, {
      fields: table.fields.filter((_: any, i: number) => i !== fieldIndex)
    });
  };

  return {
    schema,
    setSchema,
    addTable,
    updateTable,
    deleteTable,
    addField,
    updateField,
    deleteField
  };
};