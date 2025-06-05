// src/shemaAgent/components/LayerTabs.tsx - ZAKTUALIZOWANY z theme
import React from "react";
import { Layer, LayerType, SchemaState } from "../types";
import { Tabs } from "@/themes/default";


interface LayerTabsProps {
  layers: Layer[];
  currentLayer: LayerType;
  setCurrentLayer: (layer: LayerType) => void;
  schema: SchemaState;
}

const LayerTabs: React.FC<LayerTabsProps> = ({
  layers,
  currentLayer,
  setCurrentLayer,
  schema,
}) => {
  const tabs = layers.map(layer => ({
    id: layer.id,
    name: layer.name,
    description: layer.description,
    isCompleted: !!schema[layer.id]
  }));

  return (
    <Tabs
      tabs={tabs}
      activeTab={currentLayer}
      onTabChange={(tabId) => setCurrentLayer(tabId as LayerType)}
    />
  );
};

export default LayerTabs;