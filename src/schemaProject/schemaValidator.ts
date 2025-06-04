// src/lib/schemaValidator.ts
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { PROJECT_SCHEMA, SESSION_SCHEMA } from './projectSchemas';

class SchemaValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    
    // Dodaj schemas
    this.ajv.addSchema(PROJECT_SCHEMA, 'project');
    this.ajv.addSchema(SESSION_SCHEMA, 'session');
  }

  validateProject(data: any) {
    // Pozwól na puste schema layers
    const dataToValidate = {
      ...data,
      schema: {
        concept: data.schema?.concept || null,
        database: data.schema?.database || null,
        ui: data.schema?.ui || null,
        refine: data.schema?.refine || null
      }
    };

    const validate = this.ajv.getSchema('project');
    if (!validate) throw new Error('Schema not found');
    
    const valid = validate(dataToValidate);
    if (!valid) {
      return {
        valid: false,
        errors: validate.errors?.map(err => ({
          field: err.instancePath,
          message: err.message,
          value: err.data
        }))
      };
    }
    
    return { valid: true, errors: null };
  }

  validateSession(data: any) {
    const validate = this.ajv.getSchema('session');
    if (!validate) throw new Error('Schema not found');
    
    const valid = validate(data);
    if (!valid) {
      return {
        valid: false,
        errors: validate.errors?.map(err => ({
          field: err.instancePath,
          message: err.message,
          value: err.data
        }))
      };
    }
    
    return { valid: true, errors: null };
  }

  // Walidacja częściowa dla aktualizacji
  validateProjectUpdate(data: any) {
    // Utwórz kopię schema bez required fields
    const updateSchema = JSON.parse(JSON.stringify(PROJECT_SCHEMA));
    delete updateSchema.required;
    
    const validate = this.ajv.compile(updateSchema);
    const valid = validate(data);
    
    if (!valid) {
      return {
        valid: false,
        errors: validate.errors?.map(err => ({
          field: err.instancePath,
          message: err.message,
          value: err.data
        }))
      };
    }
    
    return { valid: true, errors: null };
  }
}

export const validator = new SchemaValidator();