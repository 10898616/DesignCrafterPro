import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Design } from "@/types/design";

export default function HomePage() {
  const { user } = useAuth();
  
  const { data: recentDesigns, isLoading } = useQuery<Design[]>({
    queryKey: ["/api/designs/recent"],
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username}!</h1>
          <p className="text-muted-foreground">
            Continue working on your furniture designs or create something new.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Total Designs</CardTitle>
              <CardDescription>All your saved designs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{isLoading ? "..." : recentDesigns?.length || 0}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Last Design</CardTitle>
              <CardDescription>Your most recent work</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {isLoading ? "Loading..." : (recentDesigns && recentDesigns.length > 0 
                  ? recentDesigns[0].name 
                  : "No designs yet")}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started right away</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/new-design">
                  Create New Design
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/view-designs">
                  View All Designs
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Recent Designs</h2>
            <Button asChild variant="outline">
              <Link href="/view-designs">View All</Link>
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-10">Loading recent designs...</div>
          ) : recentDesigns?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentDesigns.slice(0, 3).map((design) => (
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
                  <CardFooter className="flex justify-between">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/new-design?id=${design.id}`}>Edit</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/view-designs?preview=${design.id}`}>Preview</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <h3 className="text-lg font-medium mb-2">No designs yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first design to get started with RoomViz
                </p>
                <Button asChild>
                  <Link href="/new-design">Create New Design</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
