import { useRef, useEffect, useState } from "react";
import { RoomDimensions, FurnitureItem } from "@/types/design";
import FurnitureItemComponent from "@/components/design/furniture-item";

interface RoomCanvasProps {
  roomDimensions: RoomDimensions;
  furnitureItems: FurnitureItem[];
  selectedItemId: string | undefined;
  zoomLevel: number;
  onSelectFurniture: (itemId: string | null) => void;
  onUpdateFurniture: (item: FurnitureItem) => void;
}

export default function RoomCanvas({
  roomDimensions,
  furnitureItems,
  selectedItemId,
  zoomLevel,
  onSelectFurniture,
  onUpdateFurniture
}: RoomCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  
  // Update canvas dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        setCanvasDimensions({
          width: canvasRef.current.offsetWidth,
          height: canvasRef.current.offsetHeight
        });
      }
    };
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    
    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);
  
  // Handle click on canvas (deselect furniture)
  const handleCanvasClick = () => {
    onSelectFurniture(null);
  };
  
  // Handle dropping furniture onto canvas
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const furnitureId = e.dataTransfer.getData("furniture-id");
    
    if (furnitureId && canvasRef.current) {
      // Find the furniture item
      const item = furnitureItems.find(item => item.id === furnitureId);
      
      if (item) {
        // Calculate the drop position relative to the canvas
        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        // Update the item position
        onUpdateFurniture({
          ...item,
          x: Math.max(0, Math.min(100 - item.width, x)),
          y: Math.max(0, Math.min(100 - item.depth, y))
        });
      }
    }
  };
  
  // Handle dragging over the canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // Room style based on dimensions and wall color
  const roomStyle = {
    transform: `scale(${zoomLevel})`,
    backgroundColor: roomDimensions.wallColor,
    transition: "transform 0.2s, background-color 0.3s"
  };
  
  return (
    <div 
      ref={canvasRef}
      className="bg-white rounded-lg shadow-sm h-full relative border border-neutral-200 overflow-hidden"
      onClick={handleCanvasClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Grid Lines */}
      <div className="absolute inset-0 grid-room"></div>
      
      {/* Room Walls */}
      <div 
        className="absolute inset-5 border-4 border-gray-300 grid-room transition-colors"
        style={roomStyle}
      >
        {/* Placed Furniture */}
        {furnitureItems.map(item => (
          <FurnitureItemComponent
            key={item.id}
            item={item}
            isSelected={item.id === selectedItemId}
            onSelect={onSelectFurniture}
            onUpdate={onUpdateFurniture}
          />
        ))}
      </div>
      
      {/* Dimensions Display */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-md shadow-sm text-xs font-medium text-gray-700 border border-neutral-200">
        {roomDimensions.length} ft × {roomDimensions.width} ft
      </div>
    </div>
  );
}
