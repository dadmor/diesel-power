// ===== src/lib/generator.ts - POPRAWIONY Z DEBUGIEM =====
import { CreateVendorTag, Field } from '../types';
import { createTables, saveVendor } from './supabase';

export const parseSchema = (schemaString: string) => {
  console.log('🔍 Parsing schema:', schemaString);
  
  const result = {
    tables: schemaString.split(';').map(tableString => {
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
      
      // Parse fields - każde pole to name:type lub name:type:options
      const fields = fieldsString.split(',').map(fieldString => {
        const fieldParts = fieldString.trim().split(':');
        console.log('🔍 Field parts:', fieldParts);
        
        if (fieldParts.length < 2) {
          console.log('❌ Invalid field format:', fieldString);
          return null;
        }
        
        const field: Field = { 
          name: fieldParts[0]?.trim() || '', 
          type: fieldParts[1]?.trim() as Field['type']
        };
        
        // Dodaj options dla select
        if (field.type === 'select' && fieldParts.length > 2) {
          field.options = fieldParts.slice(2).map(opt => opt?.trim()).filter(Boolean);
        }
        
        console.log('✅ Parsed field:', field);
        return field;
      }).filter(f => f && f.name && f.type);
      
      return { name: tableName, fields };
    }).filter(t => t && t.name && t.fields.length > 0)
  };
  
  console.log('📋 Final parsed schema:', result);
  return result;
};

export const createVendorApp = async (tag: CreateVendorTag) => {
  console.log('🚀 Creating vendor app:', tag);
  
  try {
    const schema = parseSchema(tag.schema);
    console.log('📊 Schema to create tables:', schema);
    
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