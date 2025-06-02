// src/lib/generator.ts - FIXED WITH PROPER TYPES
import { CreateVendorTag, Field, Table } from '../types';
import { createTables, saveVendor } from './supabase';

export const parseSchema = (schemaString: string): { tables: Table[] } => {
  console.log('🔍 Parsing schema:', schemaString);
  
  const tables: Table[] = schemaString.split(';')
    .map(tableString => {
      console.log('🔍 Processing table string:', tableString);
      
      // Najpierw znajdź nazwę tabeli (przed pierwszym :)
      const firstColonIndex = tableString.indexOf(':');
      if (firstColonIndex === -1) {
        console.log('❌ No colon found in table string');
        return null;
      }
      
      const tableName = tableString.substring(0, firstColonIndex).trim();
      const fieldsString = tableString.substring(firstColonIndex + 1);
      
      console.log('📋 Table name:', tableName);
      console.log('📋 Fields string:', fieldsString);
      
      if (!tableName) {
        console.log('❌ Empty table name');
        return null;
      }
      
      // Parse fields - każde pole to name:type lub name:type:options
      const fields: Field[] = fieldsString.split(',')
        .map(fieldString => {
          const fieldParts = fieldString.trim().split(':');
          console.log('🔍 Field parts:', fieldParts);
          
          if (fieldParts.length < 2) {
            console.log('❌ Invalid field format:', fieldString);
            return null;
          }
          
          const fieldName = fieldParts[0]?.trim();
          const fieldType = fieldParts[1]?.trim() as Field['type'];
          
          if (!fieldName || !fieldType) {
            console.log('❌ Missing field name or type:', fieldString);
            return null;
          }
          
          // Validate field type
          const validTypes: Field['type'][] = ['string', 'text', 'number', 'date', 'boolean', 'select'];
          if (!validTypes.includes(fieldType)) {
            console.log('❌ Invalid field type:', fieldType);
            return null;
          }
          
          const field: Field = { 
            name: fieldName, 
            type: fieldType
          };
          
          // Dodaj options dla select
          if (field.type === 'select' && fieldParts.length > 2) {
            field.options = fieldParts.slice(2)
              .map(opt => opt?.trim())
              .filter(Boolean);
          }
          
          console.log('✅ Parsed field:', field);
          return field;
        })
        .filter((field): field is Field => field !== null);
      
      if (fields.length === 0) {
        console.log('❌ No valid fields found for table:', tableName);
        return null;
      }
      
      const table: Table = { name: tableName, fields };
      console.log('✅ Parsed table:', table);
      return table;
    })
    .filter((table): table is Table => table !== null);
  
  const result = { tables };
  console.log('📋 Final parsed schema:', result);
  return result;
};

export const createVendorApp = async (tag: CreateVendorTag) => {
  console.log('🚀 Creating vendor app:', tag);
  
  try {
    const schema = parseSchema(tag.schema);
    console.log('📊 Schema to create tables:', schema);
    
    if (schema.tables.length === 0) {
      throw new Error('No valid tables found in schema');
    }
    
    console.log('🔨 Creating tables for slug:', tag.slug);
    await createTables(tag.slug, schema.tables);
    console.log('✅ Tables created successfully');
    
    console.log('💾 Saving vendor to database');
    const result = await saveVendor({ slug: tag.slug, name: tag.name, schema });
    console.log('✅ Vendor saved successfully:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error in createVendorApp:', error);
    throw error;
  }
};