import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Home, LayoutDashboard, LogOut, Menu, Settings, User, X } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const navLinks = [
    { 
      href: "/", 
      label: "Home", 
      icon: <Home className="w-4 h-4 mr-2" />,
      isActive: location === "/" 
    },
    { 
      href: "/new-design", 
      label: "New Design", 
      icon: <LayoutDashboard className="w-4 h-4 mr-2" />,
      isActive: location === "/new-design" || location.startsWith("/new-design?") 
    },
    { 
      href: "/view-designs", 
      label: "View Designs", 
      icon: <LayoutDashboard className="w-4 h-4 mr-2" />,
      isActive: location === "/view-designs" || location.startsWith("/view-designs?") 
    },
    { 
      href: "/settings", 
      label: "Settings", 
      icon: <Settings className="w-4 h-4 mr-2" />,
      isActive: location === "/settings" 
    }
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-full mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo and desktop navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <h1 className="text-xl font-bold text-primary cursor-pointer">RoomViz</h1>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <a className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                    ${link.isActive 
                      ? 'border-primary text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>
                    {link.label}
                  </a>
                </Link>
              ))}
            </div>
          </div>
          
          {/* User dropdown and mobile menu button */}
          <div className="flex items-center">
            {/* Desktop user dropdown */}
            <div className="hidden sm:flex items-center">
              <span className="text-sm text-gray-700 mr-2">{user?.username}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <a className="flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="default" 
                size="sm" 
                className="ml-4"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
            
            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMobileMenu}
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a 
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium
                    ${link.isActive
                      ? 'border-primary text-primary-dark bg-primary-50'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    {link.icon}
                    {link.label}
                  </div>
                </a>
              </Link>
            ))}
            <div
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 cursor-pointer"
              onClick={handleLogout}
            >
              <div className="flex items-center">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
