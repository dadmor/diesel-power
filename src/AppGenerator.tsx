// ===== src/AppGenerator.tsx =====
import { VendorSchema, CreateVendorTag, FieldSchema, TableSchema } from './types';
import { createVendorTables, saveVendor } from './supabaseClient';

export const parseSchema = (schemaString: string): VendorSchema => {
  const tables: TableSchema[] = [];
  
  // Split by semicolon to get tables
  const tableStrings = schemaString.split(';');
  
  for (const tableString of tableStrings) {
    const [tableName, ...fieldStrings] = tableString.split(':');
    const fields: FieldSchema[] = [];
    
    // Join back and split by comma to get fields
    const fieldsString = fieldStrings.join(':');
    const fieldPairs = fieldsString.split(',');
    
    for (const fieldPair of fieldPairs) {
      const parts = fieldPair.split(':');
      if (parts.length >= 2) {
        const field: FieldSchema = {
          name: parts[0].trim(),
          type: parts[1].trim() as any
        };
        
        // Handle select options
        if (field.type === 'select' && parts.length > 2) {
          field.options = parts.slice(2);
        }
        
        fields.push(field);
      }
    }
    
    if (tableName && fields.length > 0) {
      tables.push({
        name: tableName.trim(),
        fields
      });
    }
  }
  
  return { tables };
};

export const parseVendorTag = async (tag: CreateVendorTag) => {
  try {
    // Parse schema
    const schema = parseSchema(tag.schema);
    
    // Create database tables
    await createVendorTables(tag.slug, schema);
    
    // Save vendor to database
    await saveVendor({
      slug: tag.slug,
      name: tag.name,
      schema
    });
    
    console.log(`Vendor ${tag.name} created successfully!`);
    return true;
  } catch (error) {
    console.error('Error creating vendor:', error);
    throw error;
  }
};