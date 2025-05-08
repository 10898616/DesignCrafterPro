import { useState, useEffect } from "react";
import { Design, RoomDimensions, FurnitureItem } from "@/types/design";
import ToolsPanel from "@/components/design/tools-panel";
import PropertiesPanel from "@/components/design/properties-panel";
import RoomCanvas from "@/components/design/room-canvas";
import ThreeDView from "@/components/design/three-d-view";
import SaveDesignModal from "@/components/design/save-design-modal";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { useToast } from "@/hooks/use-toast";
import { Download, Save, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { initialFurnitureCatalog } from "@/lib/furniture-catalog";

interface RoomEditorProps {
  initialDesign?: Design;
  onSaveDesign: (designData: Partial<Design>) => void;
  isSaving: boolean;
}

export default function RoomEditor({ initialDesign, onSaveDesign, isSaving }: RoomEditorProps) {
  const { toast } = useToast();
  
  // State for room dimensions and furniture
  const [roomDimensions, setRoomDimensions] = useState<RoomDimensions>({
    width: initialDesign?.roomWidth || 12,
    length: initialDesign?.roomLength || 15,
    height: initialDesign?.roomHeight || 8,
    wallColor: initialDesign?.wallColor || "#808080" // Gray wall color as default
  });
  
  // State for furniture items
  const [furnitureItems, setFurnitureItems] = useState<FurnitureItem[]>(
    initialDesign?.furniture || []
  );
  
  // State for selected furniture
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureItem | null>(null);
  
  // State for view mode (2D/3D)
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  
  // State for zoom level
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // State for save modal
  const [isSaveModalOpen, setSaveModalOpen] = useState(false);
  
  // Update selected furniture when it changes in the list
  useEffect(() => {
    if (selectedFurniture) {
      const updatedFurniture = furnitureItems.find(item => item.id === selectedFurniture.id);
      if (updatedFurniture) {
        setSelectedFurniture(updatedFurniture);
      } else {
        // If the selected furniture was removed, clear selection
        setSelectedFurniture(null);
      }
    }
  }, [furnitureItems]);
  
  // Handle adding furniture to the room
  const handleAddFurniture = (furnitureType: string) => {
    const catalogItem = initialFurnitureCatalog.find(item => item.type === furnitureType);
    
    if (catalogItem) {
      // Always use the requested default size (width: 4, height: 5, depth: 4)
      const newItem: FurnitureItem = {
        id: uuidv4(),
        type: furnitureType,
        name: catalogItem.name,
        width: 4, // Default width as requested
        height: 5, // Default height as requested
        depth: 4, // Default depth as requested
        color: catalogItem.defaultColor,
        x: 50,
        y: 50,
        rotation: 0
      };
      
      setFurnitureItems([...furnitureItems, newItem]);
      setSelectedFurniture(newItem);
      
      toast({
        title: "Furniture added",
        description: `${catalogItem.name} has been added to the room.`
      });
    }
  };
  
  // Handle updating furniture properties
  const handleUpdateFurniture = (updatedItem: FurnitureItem) => {
    setFurnitureItems(furnitureItems.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
    
    // Update selected furniture if it's the one being updated
    if (selectedFurniture?.id === updatedItem.id) {
      setSelectedFurniture(updatedItem);
    }
  };
  
  // Handle removing furniture
  const handleRemoveFurniture = (itemId: string) => {
    setFurnitureItems(furnitureItems.filter(item => item.id !== itemId));
    
    // If the removed item was selected, clear selection
    if (selectedFurniture?.id === itemId) {
      setSelectedFurniture(null);
    }
    
    toast({
      title: "Furniture removed",
      description: "The furniture item has been removed from the room."
    });
  };
  
  // Handle duplicating furniture
  const handleDuplicateFurniture = (itemId: string) => {
    const itemToDuplicate = furnitureItems.find(item => item.id === itemId);
    
    if (itemToDuplicate) {
      const duplicatedItem: FurnitureItem = {
        ...itemToDuplicate,
        id: uuidv4(),
        x: itemToDuplicate.x + 20,
        y: itemToDuplicate.y + 20,
      };
      
      setFurnitureItems([...furnitureItems, duplicatedItem]);
      setSelectedFurniture(duplicatedItem);
      
      toast({
        title: "Furniture duplicated",
        description: `${itemToDuplicate.name} has been duplicated.`
      });
    }
  };
  
  // Handle room dimensions change
  const handleRoomDimensionsChange = (dimensions: Partial<RoomDimensions>) => {
    setRoomDimensions({
      ...roomDimensions,
      ...dimensions
    });
  };
  
  // Handle zoom in/out
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const handleResetZoom = () => {
    setZoomLevel(1);
  };
  
  // Handle furniture selection
  const handleSelectFurniture = (itemId: string | null) => {
    if (itemId === null) {
      setSelectedFurniture(null);
      return;
    }
    
    const item = furnitureItems.find(item => item.id === itemId);
    if (item) {
      setSelectedFurniture(item);
    }
  };
  
  // Handle save design
  const handleSave = () => {
    setSaveModalOpen(true);
  };
  
  const handleSaveConfirm = (name: string, description: string) => {
    onSaveDesign({
      name,
      description,
      roomWidth: roomDimensions.width,
      roomLength: roomDimensions.length,
      roomHeight: roomDimensions.height,
      wallColor: roomDimensions.wallColor,
      furniture: furnitureItems
    });
    
    setSaveModalOpen(false);
  };
  
  // Handle export design
  const handleExport = (format: string) => {
    // Implementation would depend on the export format
    toast({
      title: "Export started",
      description: `Exporting design as ${format}...`
    });
    
    // Simulate export process
    setTimeout(() => {
      toast({
        title: "Export complete",
        description: `Design has been exported as ${format}.`
      });
    }, 1500);
  };
  
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Tools Panel */}
      <ToolsPanel 
        roomDimensions={roomDimensions}
        onDimensionsChange={handleRoomDimensionsChange}
        onAddFurniture={handleAddFurniture}
      />
      
      {/* Main Visualization Area */}
      <div className="flex-1 flex flex-col">
        {/* Controls Bar */}
        <div className="flex justify-between p-4 bg-white border-b border-neutral-200">
          <div className="flex items-center space-x-4">
            <div className="bg-neutral-100 rounded-md flex items-center overflow-hidden">
              <Button
                variant={viewMode === "2D" ? "default" : "ghost"}
                onClick={() => setViewMode("2D")}
                className="rounded-none"
              >
                2D View
              </Button>
              <Button
                variant={viewMode === "3D" ? "default" : "ghost"}
                onClick={() => setViewMode("3D")}
                className="rounded-none"
              >
                3D View
              </Button>
            </div>
            
            <div className="border-l border-neutral-200 h-6"></div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleResetZoom}
                title="Reset View"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="default"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-accent text-white hover:bg-accent-dark"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Design"}
            </Button>
            
            <div className="relative group">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md hidden group-hover:block z-10">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start rounded-none" 
                  onClick={() => handleExport("JPG")}
                >
                  Export as JPG
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start rounded-none" 
                  onClick={() => handleExport("PNG")}
                >
                  Export as PNG
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start rounded-none" 
                  onClick={() => handleExport("3D")}
                >
                  Export as 3D Model
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Canvas Area */}
        <div className="flex-1 bg-neutral-100 relative overflow-hidden p-6">
          {viewMode === "2D" ? (
            <RoomCanvas
              roomDimensions={roomDimensions}
              furnitureItems={furnitureItems}
              selectedItemId={selectedFurniture?.id}
              zoomLevel={zoomLevel}
              onSelectFurniture={handleSelectFurniture}
              onUpdateFurniture={handleUpdateFurniture}
            />
          ) : (
            <ThreeDView
              roomDimensions={roomDimensions}
              furnitureItems={furnitureItems}
              selectedItemId={selectedFurniture?.id}
              onSelectFurniture={handleSelectFurniture}
              onUpdateFurniture={handleUpdateFurniture}
            />
          )}
        </div>
      </div>
      
      {/* Properties Panel */}
      <PropertiesPanel
        selectedFurniture={selectedFurniture}
        onUpdateFurniture={handleUpdateFurniture}
        onRemoveFurniture={handleRemoveFurniture}
        onDuplicateFurniture={handleDuplicateFurniture}
      />
      
      {/* Save Design Modal */}
      <SaveDesignModal
        isOpen={isSaveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSaveConfirm}
        initialName={initialDesign?.name || ""}
        initialDescription={initialDesign?.description || ""}
        isSaving={isSaving}
      />
    </div>
  );
}
