// src/shemaAgent/layersLoader.ts
import { LayerType, Layer, SchemaState, TagConfig, LayerConfig } from './types';
import layersConfig from './LAYERS.json?json';

// Typ dla całej konfiguracji JSON
interface LayersConfigJson {
  layersConfig: Record<LayerType, LayerConfig>;
  defaultSchemaState: SchemaState;
  validationRules: {
    fieldTypes: string[];
    relationTypes: string[];
    pageTypes: string[];
    componentTypes: string[];
    layoutTypes: string[];
    styleTypes: string[];
    systemTypes: string[];
  };
}

// Wczytaj konfigurację z JSON
const config = layersConfig as LayersConfigJson;

// Export konfiguracji warstw (zamiennik LAYERS_CONFIG)
export const LAYERS_CONFIG: Record<LayerType, LayerConfig> = config.layersConfig;

// Export listy warstw (zamiennik LAYERS)
export const LAYERS: Layer[] = Object.entries(config.layersConfig).map(([id, layerConfig]) => ({
  id: id as LayerType,
  name: layerConfig.name,
  description: layerConfig.description
}));

// Export domyślnego stanu (zamiennik DEFAULT_SCHEMA_STATE)
export const DEFAULT_SCHEMA_STATE: SchemaState = config.defaultSchemaState;

// Export reguł walidacji
export const VALIDATION_RULES = config.validationRules;

// Funkcje pomocnicze dla walidacji
export const isValidFieldType = (type: string): boolean => 
  VALIDATION_RULES.fieldTypes.includes(type);

export const isValidRelationType = (type: string): boolean => 
  VALIDATION_RULES.relationTypes.includes(type);

export const isValidPageType = (type: string): boolean => 
  VALIDATION_RULES.pageTypes.includes(type);

export const isValidComponentType = (type: string): boolean => 
  VALIDATION_RULES.componentTypes.includes(type);

export const isValidLayoutType = (type: string): boolean => 
  VALIDATION_RULES.layoutTypes.includes(type);

export const isValidStyleType = (type: string): boolean => 
  VALIDATION_RULES.styleTypes.includes(type);

export const isValidSystemType = (type: string): boolean => 
  VALIDATION_RULES.systemTypes.includes(type);

// Funkcja do dynamicznego ładowania konfiguracji (opcjonalnie)
export const loadLayersConfig = async (url?: string): Promise<LayersConfigJson> => {
  if (url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load layers config from ${url}`);
    }
    return response.json();
  }
  return config;
};

// Funkcja do walidacji konfiguracji
export const validateLayersConfig = (config: any): config is LayersConfigJson => {
  if (!config.layersConfig || !config.defaultSchemaState || !config.validationRules) {
    return false;
  }
  
  // Sprawdź czy wszystkie warstwy mają wymagane pola
  for (const [layerId, layerConfig] of Object.entries(config.layersConfig)) {
    if (!layerConfig.name || !layerConfig.description || !layerConfig.tags) {
      console.error(`Invalid layer config for ${layerId}`);
      return false;
    }
    
    // Sprawdź tagi
    for (const tag of layerConfig.tags) {
      if (!tag.name || !tag.description || !tag.params || !tag.example) {
        console.error(`Invalid tag config in layer ${layerId}:`, tag);
        return false;
      }
    }
  }
  
  return true;
};