// src/lib/schemaDatabase.ts - dostosowany do istniejących tabel
import { createClient } from '@supabase/supabase-js';
import { validator } from './schemaValidator';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class SchemaDatabase {
  
  // === PROJEKTY SCHEMA (używamy vendors table) ===
  
  static async createSchemaProject(projectData: any) {
    const validation = validator.validateProject(projectData);
    if (!validation.valid) {
      throw new Error(`Błąd walidacji: ${JSON.stringify(validation.errors)}`);
    }

    // Tworzymy slug z nazwy
    const slug = projectData.name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50);

    const { data, error } = await supabase
      .from('vendors')
      .insert([{
        slug: `schema-${slug}-${Date.now()}`, // prefix żeby odróżnić od vendor apps
        name: projectData.name,
        schema: {
          type: 'schema_project',
          description: projectData.description,
          category: projectData.category,
          status: projectData.status || 'draft',
          layers: projectData.schema || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }])
      .select()
      .single();
    
    if (error) throw new Error(`Błąd tworzenia projektu: ${error.message}`);
    return this.formatSchemaProject(data);
  }

  static async getSchemaProject(id: string) {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Błąd odczytu: ${error.message}`);
    }

    // Sprawdź czy to schema project
    if (data.schema?.type !== 'schema_project') {
      return null;
    }

    return this.formatSchemaProject(data);
  }

  static async updateSchemaProject(id: string, updates: any) {
    const project = await this.getSchemaProject(id);
    if (!project) throw new Error('Projekt nie istnieje');

    const updatedSchema = {
      ...project.schema,
      ...updates.schema && { layers: { ...project.schema.layers, ...updates.schema } },
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('vendors')
      .update({
        name: updates.name || project.name,
        schema: updatedSchema
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Błąd aktualizacji: ${error.message}`);
    return this.formatSchemaProject(data);
  }

  static async listSchemaProjects(limit = 50) {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('schema->>type', 'schema_project')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(`Błąd listowania: ${error.message}`);
    return (data || []).map(item => this.formatSchemaProject(item));
  }

  // === TRACKOWANIE TABEL ===
  
  static async trackTable(vendorSlug: string, tableName: string, columns: any[]) {
    const { data, error } = await supabase
      .from('_system_tables')
      .insert([{
        vendor_slug: vendorSlug,
        table_name: tableName,
        columns: columns
      }])
      .select()
      .single();
    
    if (error) throw new Error(`Błąd trackowania tabeli: ${error.message}`);
    return data;
  }

  static async getVendorTables(vendorSlug: string) {
    const { data, error } = await supabase
      .from('_system_tables')
      .select('*')
      .eq('vendor_slug', vendorSlug)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Błąd odczytu tabel: ${error.message}`);
    return data || [];
  }

  static async deleteTable(vendorSlug: string, tableName: string) {
    // Usuń z trackingu
    const { error: trackError } = await supabase
      .from('_system_tables')
      .delete()
      .eq('vendor_slug', vendorSlug)
      .eq('table_name', tableName);
    
    if (trackError) throw new Error(`Błąd usuwania z trackingu: ${trackError.message}`);

    // Usuń fizyczną tabelę
    const { error: dropError } = await supabase.rpc('exec_sql', { 
      sql: `DROP TABLE IF EXISTS ${vendorSlug}_${tableName}` 
    });
    
    if (dropError) throw new Error(`Błąd usuwania tabeli: ${dropError.message}`);
  }

  // === KONWERSJA SCHEMA PROJECT -> VENDOR APP ===
  
  static async convertToVendorApp(projectId: string) {
    const project = await this.getSchemaProject(projectId);
    if (!project) throw new Error('Projekt nie istnieje');

    if (!project.schema.layers?.database?.tables) {
      throw new Error('Brak struktury bazy danych w projekcie');
    }

    // Utwórz vendor app
    const vendorSlug = project.name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');

    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .insert([{
        slug: vendorSlug,
        name: project.name,
        schema: {
          tables: project.schema.layers.database.tables.map((table: any) => ({
            name: table.name,
            fields: table.fields.map((field: any) => ({
              name: field.name,
              type: this.mapFieldType(field.type),
              ...(field.options && { options: field.options })
            }))
          }))
        }
      }])
      .select()
      .single();

    if (vendorError) throw new Error(`Błąd tworzenia vendor app: ${vendorError.message}`);

    // Utwórz fizyczne tabele
    await this.createPhysicalTables(vendorSlug, project.schema.layers.database.tables);

    // Trackuj tabele
    for (const table of project.schema.layers.database.tables) {
      await this.trackTable(vendorSlug, table.name, table.fields);
    }

    return vendor;
  }

  // === POMOCNICZE ===
  
  private static formatSchemaProject(data: any) {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.schema.description,
      category: data.schema.category,
      status: data.schema.status,
      schema: data.schema.layers || {},
      created_at: data.schema.created_at || data.created_at,
      updated_at: data.schema.updated_at
    };
  }

  private static async createPhysicalTables(vendorSlug: string, tables: any[]) {
    const createStatements = tables.map(table => {
      const tableName = `${vendorSlug}_${table.name}`;
      const columns = table.fields.map((field: any) => {
        const type = field.type === 'number' || field.type === 'integer' ? 'INTEGER' : 
                     field.type === 'boolean' ? 'BOOLEAN' : 
                     field.type === 'date' || field.type === 'datetime' ? 'DATE' : 'TEXT';
        return `${field.name} ${type}`;
      }).join(', ');
      
      return `CREATE TABLE IF NOT EXISTS ${tableName} (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        ${columns},
        created_at TIMESTAMP DEFAULT NOW()
      );`;
    }).join('\n');

    const { error } = await supabase.rpc('exec_sql', { sql: createStatements });
    if (error) throw new Error(`Błąd tworzenia tabel: ${error.message}`);
  }

  private static mapFieldType(schemaType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'text',
      'text': 'textarea', 
      'number': 'number',
      'integer': 'number',
      'boolean': 'checkbox',
      'date': 'date',
      'datetime': 'date',
      'email': 'email',
      'select': 'select'
    };
    
    return typeMap[schemaType] || 'text';
  }

  // === SESJE CZATU (prostsze - w schema jako array) ===
  
  static async addChatMessage(projectId: string, layer: string, message: any) {
    const project = await this.getSchemaProject(projectId);
    if (!project) throw new Error('Projekt nie istnieje');

    const sessions = project.schema.sessions || {};
    const layerMessages = sessions[layer] || [];
    
    const updatedSessions = {
      ...sessions,
      [layer]: [...layerMessages, { ...message, timestamp: Date.now() }]
    };

    return await this.updateSchemaProject(projectId, {
      schema: { sessions: updatedSessions }
    });
  }

  static async getChatMessages(projectId: string, layer: string) {
    const project = await this.getSchemaProject(projectId);
    if (!project) return [];
    
    return project.schema.sessions?.[layer] || [];
  }
}

// === FUNKCJE SETUP ===

export async function setupSchemaSystem() {
  // Sprawdź czy tabele istnieją
  const { data: vendorsCheck } = await supabase.from('vendors').select('id').limit(1);
  const { data: tablesCheck } = await supabase.from('_system_tables').select('id').limit(1);
  
  if (!vendorsCheck || !tablesCheck) {
    throw new Error('Brak wymaganych tabel. Wykonaj SQL setup najpierw.');
  }
  
  console.log('✅ System schema gotowy');
  return true;
}

// === PRZYKŁAD UŻYCIA ===

/*
// 1. Utwórz projekt schema
const project = await SchemaDatabase.createSchemaProject({
  name: "Mój CRM",
  description: "System zarządzania klientami",
  category: "crm",
  schema: {
    concept: { name: "CRM", features: ["klienci", "kontakty"] }
  }
});

// 2. Dodaj warstwę bazy danych
await SchemaDatabase.updateSchemaProject(project.id, {
  schema: {
    database: {
      tables: [
        {
          name: "klienci",
          fields: [
            { name: "nazwa", type: "string", required: true },
            { name: "email", type: "email" },
            { name: "telefon", type: "string" }
          ]
        }
      ]
    }
  }
});

// 3. Konwertuj na działającą aplikację
const vendorApp = await SchemaDatabase.convertToVendorApp(project.id);
console.log(`Aplikacja gotowa: /${vendorApp.slug}`);

// 4. Dodaj wiadomość do czatu
await SchemaDatabase.addChatMessage(project.id, 'concept', {
  id: 1,
  text: "Stwórz CRM",
  type: "user",
  tags: []
});
*/