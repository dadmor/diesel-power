// src/schemaProject/index.ts
export { SchemaDatabase, setupSchemaSystem, supabase } from './schemaDatabase';
export { validator } from './schemaValidator';
export { PROJECT_SCHEMA, SESSION_SCHEMA } from './projectSchemas';
export { default as SchemaProjectManager } from './SchemaProjectManager';