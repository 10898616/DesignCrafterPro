import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useSearch } from "wouter";
import Navbar from "@/components/layout/navbar";
import RoomEditor from "@/components/design/room-editor";
import { Design } from "@/types/design";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NewDesignPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const designId = params.get("id");
  const [, navigate] = useLocation();
  
  // State for design loading
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  // Fetch existing design if ID is provided
  const { data: existingDesign, isLoading: isDesignLoading } = useQuery<Design>({
    queryKey: ["/api/designs", designId],
    enabled: !!designId,
  });
  
  // Save design mutation
  const saveDesignMutation = useMutation({
    mutationFn: async (design: Partial<Design>) => {
      if (designId) {
        // Update existing design
        const res = await apiRequest("PATCH", `/api/designs/${designId}`, design);
        return await res.json();
      } else {
        // Create new design
        const res = await apiRequest("POST", "/api/designs", design);
        return await res.json();
      }
    },
    onSuccess: (savedDesign: Design) => {
      queryClient.invalidateQueries({ queryKey: ["/api/designs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/designs/recent"] });
      
      toast({
        title: designId ? "Design updated" : "Design saved",
        description: `Your design "${savedDesign.name}" has been ${designId ? "updated" : "saved"} successfully.`,
      });
      
      // If this was a new design, navigate to the edit URL with the ID
      if (!designId) {
        navigate(`/new-design?id=${savedDesign.id}`, { replace: true });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving design",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Set loading state based on conditions
  useEffect(() => {
    if (!designId || (designId && !isDesignLoading)) {
      setIsPageLoading(false);
    }
  }, [designId, isDesignLoading]);
  
  // Handle design save from children components
  const handleSaveDesign = (designData: Partial<Design>) => {
    saveDesignMutation.mutate({
      ...designData,
      userId: user?.id
    });
  };
  
  if (isPageLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="ml-2">Loading design...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <RoomEditor 
        initialDesign={existingDesign} 
        onSaveDesign={handleSaveDesign}
        isSaving={saveDesignMutation.isPending}
      />
    </div>
  );
}
