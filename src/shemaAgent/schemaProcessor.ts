// schemaProcessor.ts - Z walidacją względem JSON Schema
import { ParsedTag, LayerType, validateAgainstSchema } from "./types";
import { LAYERS_CONFIG } from "./LAYERS";

// Import właściwej JSON Schema
import schema from './SCHEMA.json';
const SCHEMA = schema;

export const parseTags = (text: string): ParsedTag[] => {
  const tagRegex = /<(\w+)([^>]*)>/g;
  const tags: ParsedTag[] = [];
  let match;

  while ((match = tagRegex.exec(text)) !== null) {
    const [, tagName, paramsStr] = match;
    const params: Record<string, string> = {};
    const paramRegex = /(\w+)="([^"]*)"/g;
    let paramMatch;

    while ((paramMatch = paramRegex.exec(paramsStr)) !== null) {
      params[paramMatch[1]] = paramMatch[2];
    }

    tags.push({ tag: tagName, params });
  }

  return tags;
};

// GENERYCZNY processor z walidacją
export const processTag = (
  layer: LayerType,
  tag: string,
  params: Record<string, string>,
  currentData: any
): any => {
  
  console.log(`🔄 Przetwarzanie: ${layer}_${tag}`, params);
  
  // Znajdź konfigurację tagu
  const layerConfig = LAYERS_CONFIG[layer as keyof typeof LAYERS_CONFIG];
  if (!layerConfig) {
    throw new Error(`❌ Nieznana warstwa: ${layer}`);
  }

  const tagConfig = layerConfig.tags.find(t => t.name === tag);
  if (!tagConfig) {
    throw new Error(`❌ Nieznany tag ${tag} w warstwie ${layer}`);
  }

  // Sprawdź czy wszystkie wymagane parametry są obecne
  const missingParams = tagConfig.params.filter(param => !params[param]);
  if (missingParams.length > 0) {
    throw new Error(`❌ Brakujące parametry: ${missingParams.join(', ')}`);
  }

  const data = currentData || {};

  // GENERYCZNE reguły przetwarzania
  const parseList = (value: string): string[] => 
    value ? value.split(',').map(item => item.trim()) : [];

  const parseFields = (fieldsStr: string) => {
    return fieldsStr.split(',').map(fieldStr => {
      const parts = fieldStr.trim().split(':');
      const [name, type, ...flags] = parts;
      
      // Walidacja typu pola
      const validTypes = ['string', 'number', 'boolean', 'date', 'json'];
      if (!validTypes.includes(type)) {
        throw new Error(`❌ Nieprawidłowy typ pola: ${type}. Dozwolone: ${validTypes.join(', ')}`);
      }
      
      return {
        name: name.trim(),
        type: type.trim(),
        required: flags.includes('required'),
        unique: flags.includes('unique')
      };
    });
  };

  let result;

  // GENERYCZNE reguły na podstawie nazwy tagu
  switch (true) {
    // Tagi typu "define_*" / "set_*" - ustawiają główny obiekt
    case tag.startsWith('define_'):
    case tag.startsWith('set_'):
      const objectName = tag.replace(/^(define_|set_)/, '');
      result = {
        ...data,
        [objectName]: params
      };
      break;

    // Tagi typu "create_*" - dodają do array
    case tag.startsWith('create_'):
      const arrayName = tag.replace('create_', '') + 's'; // create_table -> tables
      
      let newItem = { ...params };
      
      // Specjalne parsowanie dla pól
      if (params.fields) {
        newItem.fields = parseFields(params.fields);
      }
      
      result = {
        ...data,
        [arrayName]: [
          ...(data[arrayName] || []),
          newItem
        ]
      };
      break;

    // Tagi typu "add_*" - dodają do array lub do właściwości
    case tag.startsWith('add_'):
      const propertyName = tag.replace('add_', '') + 's'; // add_feature -> features
      
      if (typeof params === 'object' && Object.keys(params).length === 1) {
        // Jeśli tylko jeden parametr, dodaj jego wartość
        const value = Object.values(params)[0];
        result = {
          ...data,
          [propertyName]: [
            ...(data[propertyName] || []),
            value
          ]
        };
      } else {
        // Jeśli więcej parametrów, dodaj cały obiekt
        result = {
          ...data,
          [propertyName]: [
            ...(data[propertyName] || []),
            params
          ]
        };
      }
      break;

    // Fallback - surowe dane
    default:
      result = {
        ...data,
        [tag]: params
      };
  }

  // WALIDACJA względem prawdziwej JSON Schema
  try {
    // Sprawdź czy wynikowa struktura jest zgodna ze schemą
    const isValid = validateAgainstSchema(result, SCHEMA);
    if (!isValid) {
      console.warn(`⚠️  Dane nie są zgodne z JSON Schema dla warstwy ${layer}`, {
        expected: SCHEMA.properties[layer],
        actual: result
      });
    }
  } catch (error) {
    console.error(`❌ Błąd walidacji JSON Schema:`, error);
    throw new Error(`Dane nie są zgodne ze schemą: ${error}`);
  }

  console.log(`✅ Wynik dla ${layer}:`, result);
  return result;
};