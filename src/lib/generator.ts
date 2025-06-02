// ===== src/lib/generator.ts - POPRAWIONY =====
import { CreateVendorTag, Field } from '../types';
import { createTables, saveVendor } from './supabase';

export const parseSchema = (schemaString: string) => {
  return {
    tables: schemaString.split(';').map(tableString => {
      const [name, ...fieldStrings] = tableString.split(':');
      const fieldsString = fieldStrings.join(':');
      const fields = fieldsString.split(',').map(fieldPair => {
        const parts = fieldPair.split(':');
        
        // Utworz obiekt Field z odpowiednimi typami
        const field: Field = { 
          name: parts[0].trim(), 
          type: parts[1].trim() as Field['type']
        };
        
        // Dodaj options dla select (teraz TypeScript wie że Field może mieć options)
        if (field.type === 'select' && parts.length > 2) {
          field.options = parts.slice(2);
        }
        
        return field;
      }).filter(f => f.name && f.type);
      
      return { name: name.trim(), fields };
    }).filter(t => t.name && t.fields.length > 0)
  };
};

export const createVendorApp = async (tag: CreateVendorTag) => {
  const schema = parseSchema(tag.schema);
  await createTables(tag.slug, schema.tables);
  return await saveVendor({ slug: tag.slug, name: tag.name, schema });
};