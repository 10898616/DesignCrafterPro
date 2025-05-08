import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoomDimensions } from "@/types/design";
import ColorPicker from "@/components/ui/color-picker";
import { initialFurnitureCatalog } from "@/lib/furniture-catalog";
import { Plus } from "lucide-react";

interface ToolsPanelProps {
  roomDimensions: RoomDimensions;
  onDimensionsChange: (dimensions: Partial<RoomDimensions>) => void;
  onAddFurniture: (furnitureType: string) => void;
}

export default function ToolsPanel({ 
  roomDimensions, 
  onDimensionsChange, 
  onAddFurniture 
}: ToolsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Filter furniture by category
  const filteredFurniture = selectedCategory === "all" 
    ? initialFurnitureCatalog 
    : initialFurnitureCatalog.filter(item => item.category === selectedCategory);
  
  // Get unique categories
  const categories = [
    ...new Set(initialFurnitureCatalog.map(item => item.category))
  ];
  
  // Handle room shape change
  const handleRoomShapeChange = (shape: string) => {
    // For simplicity, we're just handling rectangular rooms
    // Additional logic would be needed for other shapes
    console.log(`Room shape changed to: ${shape}`);
  };
  
  // Handle dimension change
  const handleDimensionChange = (
    dimension: keyof RoomDimensions, 
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      onDimensionsChange({ [dimension]: numValue });
    }
  };
  
  // Handle wall color change
  const handleWallColorChange = (color: string) => {
    onDimensionsChange({ wallColor: color });
  };

  return (
    <div className="w-64 bg-white shadow-sm border-r border-neutral-200 overflow-y-auto">
      <div className="p-4 border-b border-neutral-200">
        <Button 
          variant="secondary"
          className="w-full flex items-center justify-center"
          onClick={() => onAddFurniture("sofa")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Design
        </Button>
      </div>
      
      {/* Room Settings Panel */}
      <div className="p-4 border-b border-neutral-200">
        <h3 className="font-medium text-gray-900 mb-3">Room Settings</h3>
        
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Room Shape</Label>
            <Select
              defaultValue="rectangular"
              onValueChange={handleRoomShapeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select shape" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangular">Rectangular</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="l-shaped">L-Shaped</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm">Width (ft)</Label>
              <Input 
                type="number" 
                value={roomDimensions.width} 
                min="1"
                onChange={(e) => handleDimensionChange("width", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm">Length (ft)</Label>
              <Input 
                type="number" 
                value={roomDimensions.length} 
                min="1"
                onChange={(e) => handleDimensionChange("length", e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label className="text-sm">Height (ft)</Label>
            <Input 
              type="number" 
              value={roomDimensions.height} 
              min="1"
              onChange={(e) => handleDimensionChange("height", e.target.value)}
            />
          </div>
          
          <div>
            <Label className="text-sm">Wall Color</Label>
            <ColorPicker 
              color={roomDimensions.wallColor} 
              onChange={handleWallColorChange}
            />
          </div>
        </div>
      </div>
      
      {/* Furniture Catalog */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-3">Furniture Catalog</h3>
        
        <div className="mb-3">
          <Label className="text-sm">Category</Label>
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Furniture Items - Draggable */}
        <div className="grid grid-cols-2 gap-2">
          {filteredFurniture.map((item) => (
            <div 
              key={item.type}
              className="furniture-item bg-neutral-100 rounded-md p-2 text-center border border-neutral-200 hover:border-primary transition duration-200"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("furnitureType", item.type);
              }}
              onClick={() => onAddFurniture(item.type)}
            >
              <div className="bg-white rounded-md h-16 flex items-center justify-center mb-1">
                {item.icon}
              </div>
              <span className="text-xs font-medium">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
