import { useRef, useState } from "react";
import { FurnitureItem as FurnitureItemType } from "@/types/design";
import { useToast } from "@/hooks/use-toast";

interface FurnitureItemProps {
  item: FurnitureItemType;
  isSelected: boolean;
  onSelect: (itemId: string) => void;
  onUpdate: (updatedItem: FurnitureItemType) => void;
}

export default function FurnitureItem({
  item,
  isSelected,
  onSelect,
  onUpdate
}: FurnitureItemProps) {
  const { toast } = useToast();
  const furnitureRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Determine furniture color
  const furnitureColor = item.color || "#3b82f6";
  
  // Determine background color based on furniture type and color
  const getBgColor = () => {
    // Create a lighter version of the furniture color for the background
    return `${furnitureColor}33`; // 33 is 20% opacity in hex
  };
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("furniture-id", item.id);
    setIsDragging(true);
    
    // Select the item when starting to drag
    onSelect(item.id);
  };
  
  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  // Handle click to select
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(item.id);
  };
  
  // Handle rotation
  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({
      ...item,
      rotation: (item.rotation + 90) % 360
    });
  };
  
  // Handle remove
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    // This will be handled by the parent component's removal function
    // Here we just provide the UI for it
  };
  
  // Handle position change (used during drag operations)
  const updatePosition = (x: number, y: number) => {
    onUpdate({
      ...item,
      x,
      y
    });
  };
  
  // Furniture style
  const style = {
    width: `${item.width}%`,
    height: `${item.depth}%`,
    left: `${item.x}%`,
    top: `${item.y}%`,
    transform: `rotate(${item.rotation}deg)`,
    zIndex: isSelected ? 10 : 1,
  };
  
  // Furniture content based on type
  const getFurnitureIcon = () => {
    switch(item.type) {
      case "sofa":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke={furnitureColor} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18v7H3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16v2h18v-2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V7a2 2 0 012-2h14a2 2 0 012 2v2" />
          </svg>
        );
      case "chair":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke={furnitureColor} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12v8H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 16v2h12v-2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 8V5a1 1 0 011-1h6a1 1 0 011 1v3" />
          </svg>
        );
      case "table":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke={furnitureColor} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        );
      case "bookshelf":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke={furnitureColor} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5h14M5 10h14M5 15h14M5 20h14" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5v15M20 5v15" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke={furnitureColor} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5h14M5 12h14M5 19h14" />
          </svg>
        );
    }
  };

  return (
    <div
      ref={furnitureRef}
      className={`absolute furniture-piece ${isDragging ? 'dragging' : ''} ${isSelected ? 'ring-2 ring-primary' : ''}`}
      style={style}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <div 
        className={`h-full w-full flex items-center justify-center relative rounded-md 
                   border ${isSelected ? 'border-primary' : `border-${furnitureColor}`}`}
        style={{ backgroundColor: getBgColor() }}
      >
        {getFurnitureIcon()}
        
        {/* Furniture Controls - visible when selected */}
        {isSelected && (
          <div className="furniture-controls absolute inset-0">
            <div className="absolute -right-3 -top-3 bg-white border border-neutral-200 rounded-full p-1 shadow-sm cursor-pointer"
                onClick={handleRemove}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="absolute -left-3 -top-3 bg-white border border-neutral-200 rounded-full p-1 shadow-sm cursor-pointer"
                onClick={handleRotate}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
