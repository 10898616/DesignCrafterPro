import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface SaveDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  initialName: string;
  initialDescription: string;
  isSaving: boolean;
}

export default function SaveDesignModal({
  isOpen,
  onClose,
  onSave,
  initialName,
  initialDescription,
  isSaving
}: SaveDesignModalProps) {
  const [name, setName] = useState(initialName || "");
  const [description, setDescription] = useState(initialDescription || "");
  const [nameError, setNameError] = useState("");
  
  // Reset form when the modal opens
  useEffect(() => {
    if (isOpen) {
      setName(initialName || "");
      setDescription(initialDescription || "");
      setNameError("");
    }
  }, [isOpen, initialName, initialDescription]);
  
  // Handle save
  const handleSave = () => {
    // Validate name
    if (!name.trim()) {
      setNameError("Design name is required");
      return;
    }
    
    onSave(name, description);
  };
  
  // Handle changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (e.target.value.trim()) {
      setNameError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Your Design</DialogTitle>
          <DialogDescription>
            Give your design a name and optional description.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="design-name">Design Name</Label>
            <Input
              id="design-name"
              placeholder="Enter a name for your design"
              value={name}
              onChange={handleNameChange}
              className={nameError ? "border-destructive" : ""}
            />
            {nameError && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="design-description">Description (Optional)</Label>
            <Textarea
              id="design-description"
              placeholder="Add a description of your design"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Design"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
