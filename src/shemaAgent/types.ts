// types.ts - Typy zgodne z JSON Schema
export interface SchemaState {
  system: any | null;
  database: any | null;
  ux: any | null;
}

export type LayerType = keyof SchemaState;

export interface ParsedTag {
  tag: string;
  params: Record<string, string>;
}

export interface Message {
  id: number;
  text: string;
  type: 'user' | 'ai';
  tags: string[];
}

export interface Layer {
  id: LayerType;
  name: string;
  description: string;
}

export interface TagConfig {
  name: string;
  description: string;
  params: string[];
  example: string;
  nextLayer?: LayerType | null;
}

export interface LayerConfig {
  name: string;
  description: string;
  placeholder: string;
  defaultMessage: string;
  tags: TagConfig[];
}

export const DEFAULT_SCHEMA_STATE: SchemaState = {
  system: null,
  database: null,
  ux: null,
};

// Funkcja walidacji względem JSON Schema z AJV
import Ajv from 'ajv';

const ajv = new Ajv();

export const validateAgainstSchema = (data: any, schema: any): boolean => {
  try {
    const validate = ajv.compile(schema);
    const valid = validate(data);
    
    if (!valid) {
      console.error('Błędy walidacji JSON Schema:', validate.errors);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Błąd kompilacji schematu:', error);
    return false;
  }
};