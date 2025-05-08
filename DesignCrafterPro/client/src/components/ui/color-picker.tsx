import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

// Predefined color swatches
const colorSwatches = [
  "#3b82f6", // blue
  "#10b981", // green
  "#ef4444", // red
  "#f59e0b", // yellow
  "#8b5cf6", // purple
  "#6b7280", // gray
  "#ec4899", // pink
  "#0ea5e9", // light blue
  "#14b8a6", // teal
  "#f43f5e", // rose
  "#ffffff", // white
  "#000000", // black
];

export default function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(color);
  const isValidHex = (hex: string) => /^#[0-9A-F]{6}$/i.test(hex);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value when color prop changes
  useEffect(() => {
    setInputValue(color);
  }, [color]);

  // Handle direct hex input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Only update the actual color when the hex is valid
    if (isValidHex(value)) {
      onChange(value);
    }
  };

  // Handle input blur - attempt to fix invalid hex codes
  const handleInputBlur = () => {
    if (!isValidHex(inputValue)) {
      // If not a valid hex, revert to the last valid color
      setInputValue(color);
    }
  };

  // Handle color picker input change
  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onChange(value);
  };

  // Handle swatch selection
  const handleSwatchClick = (swatchColor: string) => {
    setInputValue(swatchColor);
    onChange(swatchColor);
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <div className="flex items-center">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="h-8 w-8 rounded border border-neutral-200 mr-2 overflow-hidden"
              style={{ backgroundColor: inputValue }}
              aria-label="Pick a color"
            />
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="color-picker-input">Choose a color</Label>
              <input
                type="color"
                id="color-picker-input"
                value={inputValue}
                onChange={handleColorPickerChange}
                className="w-full h-8 cursor-pointer rounded"
              />
              
              <Label className="mt-2">Color swatches</Label>
              <div className="grid grid-cols-6 gap-2">
                {colorSwatches.map((swatch) => (
                  <button
                    key={swatch}
                    className={`w-6 h-6 rounded-full border-2 ${
                      swatch === inputValue 
                        ? 'border-primary outline outline-2 outline-primary' 
                        : 'border-white'
                    }`}
                    style={{ backgroundColor: swatch }}
                    onClick={() => handleSwatchClick(swatch)}
                    aria-label={`Color: ${swatch}`}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="flex-1"
          placeholder="#RRGGBB"
          maxLength={7}
        />
      </div>
    </div>
  );
}
