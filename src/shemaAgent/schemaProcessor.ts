// src/shemaAgent/schemaProcessor.ts
// ---------------------------------
// Generyczny processor taga z obsługą walidacji JSON Schema i parsowania pól,
// w szczególności specjalne rozłożenie każdego elementu "fields" (dla create_table).

import { ParsedTag, LayerType, validateAgainstSchema, TagConfig, ComputedField } from "./types";
import { LAYERS_CONFIG } from "./LAYERS";
import schema from "./SCHEMA.json";

// -----------------------------------------------------------------------------
// parseTags(text):
//   - Wyciąga z danego tekstu wszystkie wystąpienia taga w formacie XML:
//     np. "<create_table name="X" fields="a:b, c:d">".
//   - Zwraca tablicę { tag: "create_table", params: { name:"X", fields:"a:b,c:d" } }.
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// parseFields(fieldsStr):
//   - "fieldsStr" to ciąg typu "a:string:required,b:number,c:date:unique".
//   - Dzielimy po przecinku, a następnie każdą część rozbieramy na:
///    [nazwaPol, typ, opcjonalnie 'required', 'unique'].
//   - Zwracamy tablicę obiektów { name, type, required, unique }.
// -----------------------------------------------------------------------------
const parseFields = (fieldsStr: string) => {
  return fieldsStr
    .split(',')
    .map(fieldStr => {
      const parts = fieldStr.trim().split(':');
      const [name, type, ...flags] = parts;
      const validTypes = ['string', 'number', 'boolean', 'date', 'json'];
      if (!validTypes.includes(type)) {
        throw new Error(`❌ Nieprawidłowy typ pola: ${type}. Dozwolone typy: ${validTypes.join(', ')}`);
      }
      return {
        name: name.trim(),
        type: type.trim(),
        required: flags.includes('required'),
        unique: flags.includes('unique')
      };
    });
};

// -----------------------------------------------------------------------------
// processTag(layer, tag, params, currentData):
//   1. Pobiera konfigurację taga z LAYERS_CONFIG.
//   2. Sprawdza, czy tag istnieje w danej warstwie – jeśli nie, błąd.
//   3. Waliduje, czy AI podało wszystkie wymagane parametry (tagConfig.required).
//   4. Parsuje parametry z CSV → tablica (w szczególności “fields” dla create_table).
//   5. Generuje dodatkowe pola wg computedFields (np. slug z name).
//   6. Tworzy newItem i wstawia go do currentData (albo do odpowiedniej tablicy,
//      albo root-level).
//   7. Waliduje wynik względem fragmentu JSON-Schema (dla danej warstwy).
// -----------------------------------------------------------------------------
export const processTag = (
  layer: LayerType,
  tag: string,
  params: Record<string, string>,
  currentData: any
): any => {
  // 1) Pobierz konfigurację warstwy i taga
  const layerConfig = LAYERS_CONFIG[layer];
  if (!layerConfig) {
    throw new Error(`❌ Nieznana warstwa: ${layer}`);
  }

  const tagConfig: TagConfig | undefined = layerConfig.tags.find(t => t.name === tag);
  if (!tagConfig) {
    throw new Error(`❌ Nieznany tag "${tag}" w warstwie "${layer}"`);
  }

  // 2) Sprawdź wymagane parametry
  if (tagConfig.required) {
    const missing = tagConfig.required.filter(p => !params[p]);
    if (missing.length > 0) {
      throw new Error(`❌ Brakujące parametry w <${tag}>: ${missing.join(', ')}`);
    }
  }

  // 3) Parsowanie parametrów typu “lista” (CSV → tablica). Specjalne traktowanie "fields"
  if (tagConfig.parseListParams) {
    for (const key of tagConfig.parseListParams) {
      if (params[key]) {
        if (key === 'fields') {
          // Jeżeli to parametr "fields", rozbijamy ciąg na obiekty za pomocą parseFields()
          (params as any)[key] = parseFields(params[key]);
        } else {
          // Inne parametry: zwykły split po przecinku → tablica stringów
          (params as any)[key] = (params[key] as string)
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);
        }
      } else {
        // Jeśli parametr nie został podany, ustawiamy pustą tablicę
        (params as any)[key] = [];
      }
    }
  }

  // 4) Generowanie pól obliczonych (np. slug) wg computedFields
  if (tagConfig.computedFields) {
    for (const cf of tagConfig.computedFields) {
      const baseValue = params[cf.from];
      if (baseValue && !(cf.name in params)) {
        if (cf.type === 'slugify') {
          (params as any)[cf.name] = (baseValue as string)
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-]/g, '');
        }
      }
    }
  }

  // 5) Przygotuj nowy obiekt do wstawienia (newItem)
  const newItem: any = { ...params };

  // 6) Wstawienie do odpowiedniej struktury w currentData
  const result: any = { ...(currentData || {}) };
  if (tagConfig.outputArray) {
    const arrName = tagConfig.outputArray;
    result[arrName] = [ ...(result[arrName] || []), newItem ];
  } else {
    result[tag] = params;
  }

  // 7) Walidacja fragmentu rezultatu względem JSON-Schema (dla danej warstwy)
  try {
    // Wrapper typu { layer: result }, bo SCHEMA.json definiuje poszczególne
    // właściwości (system/database/ux) na najwyższym poziomie.
    const wrapper: any = { [layer]: result };
    const valid = validateAgainstSchema(wrapper, schema);
    if (!valid) {
      console.warn(`⚠️  Dane niezgodne z JSON-Schema dla warstwy "${layer}"`, result);
    }
  } catch (error) {
    console.error(`❌ Błąd walidacji JSON Schema:`, error);
    throw new Error(`Dane nie są zgodne ze schemą: ${error}`);
  }

  return result;
};
