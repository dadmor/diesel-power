// vendor-validator.ts
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import vendorSchema from './schema.json';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validateVendor = ajv.compile(vendorSchema);

export interface ValidationResult {
  success: boolean;
  data?: any;
  errors?: string[];
}

export function validate(data: unknown): ValidationResult {
  const isValid = validateVendor(data);
  
  if (isValid) {
    return { success: true, data };
  }
  
  return {
    success: false,
    errors: validateVendor.errors?.map(err => 
      `${err.instancePath || 'root'}: ${err.message}`
    ) || ['Unknown error']
  };
}