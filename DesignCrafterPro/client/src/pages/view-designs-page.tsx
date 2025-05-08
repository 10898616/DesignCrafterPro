import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { Design } from "@/types/design";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ViewDesignsPage() {
  const { toast } = useToast();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const previewId = params.get("preview");
  const [, navigate] = useLocation();
  
  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  // Fetch all designs
  const { data: designs, isLoading } = useQuery<Design[]>({
    queryKey: ["/api/designs"],
  });
  
  // Fetch specific design for preview
  const { data: previewDesign } = useQuery<Design>({
    queryKey: ["/api/designs", previewId],
    enabled: !!previewId,
  });
  
  // Delete design mutation
  const deleteDesignMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/designs/${id}`);
      return id;
    },
    onSuccess: (id: number) => {
      queryClient.invalidateQueries({ queryKey: ["/api/designs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/designs/recent"] });
      
      toast({
        title: "Design deleted",
        description: "Your design has been deleted successfully.",
      });
      
      // Close the confirm dialog
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting design",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter designs by search term
  const filteredDesigns = designs?.filter(design => 
    design.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle delete confirmation
  const confirmDelete = (id: number) => {
    setDeleteId(id);
  };
  
  // Execute delete when confirmed
  const handleDeleteConfirmed = () => {
    if (deleteId) {
      deleteDesignMutation.mutate(deleteId);
    }
  };
  
  // Close preview dialog
  const closePreview = () => {
    navigate("/view-designs", { replace: true });
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Designs</h1>
            <p className="text-muted-foreground">
              View, edit, and manage all your saved designs
            </p>
          </div>
          
          <Button asChild>
            <Link href="/new-design">
              Create New Design
            </Link>
          </Button>
        </div>
        
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search designs..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="absolute right-2 top-2.5"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          
          <Button variant="outline" className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-10">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading your designs...</p>
          </div>
        ) : filteredDesigns?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDesigns.map((design) => (
              <Card key={design.id}>
                <CardHeader>
                  <CardTitle>{design.name}</CardTitle>
                  <CardDescription>
                    Created {new Date(design.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-40 bg-muted rounded-md flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-muted-foreground"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.29 7 12 12 20.71 7"></polyline>
                      <line x1="12" y1="22" x2="12" y2="12"></line>
                    </svg>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 justify-between">
                  <div className="flex gap-2">
                    <Button asChild variant="default" size="sm">
                      <Link href={`/new-design?id=${design.id}`}>Edit</Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/view-designs?preview=${design.id}`)}
                    >
                      Preview
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    onClick={() => confirmDelete(design.id)}
                  >
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <h3 className="text-lg font-medium mb-2">No designs found</h3>
              {searchTerm ? (
                <p className="text-muted-foreground mb-4">
                  No designs match your search. Try a different term or clear your search.
                </p>
              ) : (
                <p className="text-muted-foreground mb-4">
                  You haven't created any designs yet. Start by creating your first design.
                </p>
              )}
              <Button asChild>
                <Link href="/new-design">Create New Design</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* Preview Dialog */}
      <Dialog open={!!previewId} onOpenChange={closePreview}>
        <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewDesign?.name || "Design Preview"}</DialogTitle>
            <DialogDescription>
              Created on {previewDesign ? new Date(previewDesign.createdAt).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto mt-4">
            {previewDesign ? (
              <div className="h-full bg-muted rounded-md p-4 flex items-center justify-center">
                <div className="text-center">
                  <p>Preview of design: {previewDesign.name}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {previewDesign.description || "No description provided."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closePreview}>Close</Button>
            <Button asChild>
              <Link href={`/new-design?id=${previewId}`}>Edit Design</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the design and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDesignMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
