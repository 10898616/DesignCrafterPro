import { useState, useEffect } from "react";
import { FurnitureItem } from "@/types/design";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import ColorPicker from "@/components/ui/color-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownToLine, ArrowUpToLine, Maximize2, Minimize2, Move3d } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PropertiesPanelProps {
  selectedFurniture: FurnitureItem | null;
  onUpdateFurniture: (item: FurnitureItem) => void;
  onRemoveFurniture: (itemId: string) => void;
  onDuplicateFurniture: (itemId: string) => void;
}

export default function PropertiesPanel({
  selectedFurniture,
  onUpdateFurniture,
  onRemoveFurniture,
  onDuplicateFurniture
}: PropertiesPanelProps) {
  // Local state for furniture properties
  const [localProps, setLocalProps] = useState<Partial<FurnitureItem>>({});
  
  // Update local state when selected furniture changes
  useEffect(() => {
    if (selectedFurniture) {
      setLocalProps(selectedFurniture);
    } else {
      setLocalProps({});
    }
  }, [selectedFurniture]);
  
  // Handle property changes
  const handlePropertyChange = (
    property: keyof FurnitureItem, 
    value: number | string
  ) => {
    if (!selectedFurniture) return;
    
    const updatedProps = {
      ...localProps,
      [property]: value
    } as FurnitureItem;
    
    setLocalProps(updatedProps);
    onUpdateFurniture(updatedProps);
  };
  
  // Handle dimension change
  const handleDimensionChange = (
    dimension: "width" | "height" | "depth",
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      handlePropertyChange(dimension, numValue);
    }
  };
  
  // Handle position change
  const handlePositionChange = (
    axis: "x" | "y",
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      handlePropertyChange(axis, numValue);
    }
  };
  
  // Handle rotation change
  const handleRotationChange = (value: number[]) => {
    handlePropertyChange("rotation", value[0]);
  };
  
  // Handle remove furniture
  const handleRemove = () => {
    if (selectedFurniture) {
      onRemoveFurniture(selectedFurniture.id);
    }
  };
  
  // Handle duplicate furniture
  const handleDuplicate = () => {
    if (selectedFurniture) {
      onDuplicateFurniture(selectedFurniture.id);
    }
  };

  // Size presets for different furniture types
  const sizePresets = {
    // Default small size as requested: width: 4, height: 5, depth: 4
    sofa: {
      small: { width: 4, height: 5, depth: 4 },
      medium: { width: 80, height: 35, depth: 35 },
      large: { width: 100, height: 40, depth: 40 },
      extraLarge: { width: 120, height: 42, depth: 45 }
    },
    chair: {
      small: { width: 4, height: 5, depth: 4 },
      medium: { width: 24, height: 36, depth: 24 },
      large: { width: 28, height: 40, depth: 28 },
      extraLarge: { width: 32, height: 44, depth: 32 }
    },
    dining_chair: {
      small: { width: 4, height: 5, depth: 4 },
      medium: { width: 22, height: 38, depth: 22 },
      large: { width: 26, height: 40, depth: 26 },
      extraLarge: { width: 30, height: 44, depth: 28 }
    },
    table: {
      small: { width: 4, height: 5, depth: 4 },
      medium: { width: 48, height: 30, depth: 48 },
      large: { width: 60, height: 30, depth: 60 },
      extraLarge: { width: 72, height: 32, depth: 72 }
    },
    coffee_table: {
      small: { width: 4, height: 5, depth: 4 },
      medium: { width: 48, height: 18, depth: 30 },
      large: { width: 60, height: 20, depth: 36 },
      extraLarge: { width: 72, height: 22, depth: 42 }
    },
    dining_table: {
      small: { width: 4, height: 5, depth: 4 },
      medium: { width: 72, height: 30, depth: 42 },
      large: { width: 84, height: 32, depth: 48 },
      extraLarge: { width: 96, height: 32, depth: 54 }
    },
    desk: {
      small: { width: 4, height: 5, depth: 4 },
      medium: { width: 60, height: 30, depth: 30 },
      large: { width: 72, height: 32, depth: 36 },
      extraLarge: { width: 84, height: 32, depth: 42 }
    },
    bookshelf: {
      small: { width: 4, height: 5, depth: 4 },
      medium: { width: 36, height: 84, depth: 14 },
      large: { width: 42, height: 84, depth: 16 },
      extraLarge: { width: 48, height: 96, depth: 18 }
    },
    cabinet: {
      small: { width: 4, height: 5, depth: 4 },
      medium: { width: 42, height: 42, depth: 20 },
      large: { width: 48, height: 48, depth: 24 },
      extraLarge: { width: 54, height: 54, depth: 28 }
    }
  };

  // Apply size preset
  const applyPreset = (preset: 'small' | 'medium' | 'large' | 'extraLarge') => {
    if (!selectedFurniture || !selectedFurniture.type) return;
    
    // Get presets for this furniture type, defaulting to table if not found
    const furnitureType = selectedFurniture.type as keyof typeof sizePresets;
    const presets = sizePresets[furnitureType] || sizePresets.table;
    
    // Apply the selected preset
    const dimensions = presets[preset];
    
    // Calculate scaling factor to maintain proportions
    const scaleWidth = dimensions.width / (localProps.width || 1);
    const scaleHeight = dimensions.height / (localProps.height || 1);
    const scaleDepth = dimensions.depth / (localProps.depth || 1);
    
    // Create updated furniture with new dimensions
    const updatedFurniture = {
      ...localProps,
      width: dimensions.width,
      height: dimensions.height,
      depth: dimensions.depth
    } as FurnitureItem;
    
    // Apply the changes
    setLocalProps(updatedFurniture);
    onUpdateFurniture(updatedFurniture);
  };

  // Apply a proportional scale to all dimensions
  const applyScale = (scaleFactor: number) => {
    if (!selectedFurniture) return;
    
    const updatedFurniture = {
      ...localProps,
      width: Math.max(1, Math.round((localProps.width || 0) * scaleFactor)),
      height: Math.max(1, Math.round((localProps.height || 0) * scaleFactor)),
      depth: Math.max(1, Math.round((localProps.depth || 0) * scaleFactor))
    } as FurnitureItem;
    
    setLocalProps(updatedFurniture);
    onUpdateFurniture(updatedFurniture);
  };

  return (
    <div className="w-72 bg-white border-l border-neutral-200 overflow-y-auto">
      <div className="p-4 border-b border-neutral-200">
        <h3 className="font-medium text-gray-900">Selected Item Properties</h3>
      </div>
      
      {selectedFurniture ? (
        <div className="p-4">
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {selectedFurniture.name} Properties
            </h4>
            
            <div className="space-y-4">
              <Tabs defaultValue="dimensions" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="dimensions">Custom Size</TabsTrigger>
                  <TabsTrigger value="presets">Size Presets</TabsTrigger>
                </TabsList>
                <TabsContent value="dimensions" className="mt-2">
                  <Card className="border-0 shadow-none">
                    <CardContent className="p-1">
                      <div>
                        <Label className="text-sm">Dimensions</Label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <div>
                            <Input
                              type="number"
                              value={localProps.width}
                              min="1"
                              onChange={(e) => handleDimensionChange("width", e.target.value)}
                              className="mb-1"
                            />
                            <span className="text-xs text-gray-500">Width</span>
                          </div>
                          <div>
                            <Input
                              type="number"
                              value={localProps.depth}
                              min="1"
                              onChange={(e) => handleDimensionChange("depth", e.target.value)}
                              className="mb-1"
                            />
                            <span className="text-xs text-gray-500">Depth</span>
                          </div>
                          <div>
                            <Input
                              type="number"
                              value={localProps.height}
                              min="1"
                              onChange={(e) => handleDimensionChange("height", e.target.value)}
                              className="mb-1"
                            />
                            <span className="text-xs text-gray-500">Height</span>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <Label className="text-sm mb-2 block">Quick Resize</Label>
                          <div className="flex justify-between space-x-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 text-xs" 
                              onClick={() => applyScale(0.9)}
                            >
                              <Minimize2 className="h-3 w-3 mr-1" />
                              Smaller
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 text-xs"
                              onClick={() => applyScale(1.1)}
                            >
                              <Maximize2 className="h-3 w-3 mr-1" />
                              Larger
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="presets" className="mt-2">
                  <Card className="border-0 shadow-none">
                    <CardContent className="p-1">
                      <div>
                        <Label className="text-sm mb-2 block">Standard Sizes</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="justify-start" 
                            onClick={() => applyPreset('small')}
                          >
                            <ArrowDownToLine className="h-3 w-3 mr-2" />
                            Small
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="justify-start" 
                            onClick={() => applyPreset('medium')}
                          >
                            <Move3d className="h-3 w-3 mr-2" />
                            Medium
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="justify-start" 
                            onClick={() => applyPreset('large')}
                          >
                            <ArrowUpToLine className="h-3 w-3 mr-2" />
                            Large
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="justify-start" 
                            onClick={() => applyPreset('extraLarge')}
                          >
                            <Maximize2 className="h-3 w-3 mr-2" />
                            Extra Large
                          </Button>
                        </div>
                        
                        <div className="mt-3">
                          <Label className="text-sm mb-2 block">Dimensions Preview</Label>
                          <div className="text-xs p-3 bg-gray-50 rounded border">
                            <p><strong>Width:</strong> {localProps.width} units</p>
                            <p><strong>Height:</strong> {localProps.height} units</p>
                            <p><strong>Depth:</strong> {localProps.depth} units</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              <div>
                <Label className="text-sm">Rotation (degrees)</Label>
                <div className="mt-2">
                  <Slider
                    value={[localProps.rotation || 0]}
                    min={0}
                    max={359}
                    step={1}
                    onValueChange={handleRotationChange}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0°</span>
                    <span>180°</span>
                    <span>359°</span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm">Color</Label>
                <ColorPicker
                  color={localProps.color || "#3b82f6"}
                  onChange={(color) => handlePropertyChange("color", color)}
                />
              </div>
              
              <div>
                <Label className="text-sm">Position</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <Input
                      type="number"
                      value={localProps.x}
                      min="0"
                      onChange={(e) => handlePositionChange("x", e.target.value)}
                      className="mb-1"
                    />
                    <span className="text-xs text-gray-500">X (in)</span>
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={localProps.y}
                      min="0"
                      onChange={(e) => handlePositionChange("y", e.target.value)}
                      className="mb-1"
                    />
                    <span className="text-xs text-gray-500">Y (in)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDuplicate}
            >
              Duplicate
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleRemove}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <p className="text-sm text-gray-500 text-center py-8">
            Select a furniture item to view and edit its properties
          </p>
        </div>
      )}
    </div>
  );
}
