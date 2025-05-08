import { ReactNode } from "react";

export interface FurnitureCatalogItem {
  type: string;
  name: string;
  category: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultDepth: number;
  defaultColor: string;
  icon: ReactNode;
}

// Define furniture catalog with SVG icons
export const initialFurnitureCatalog: FurnitureCatalogItem[] = [
  {
    type: "sofa",
    name: "Sofa",
    category: "seating",
    defaultWidth: 20,
    defaultHeight: 32,
    defaultDepth: 35,
    defaultColor: "#3b82f6",
    icon: (
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-2xl text-gray-600"
      >
        <rect x="3" y="11" width="18" height="8" rx="2" />
        <path d="M21 19v2H3v-2" />
        <path d="M21 11V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
      </svg>
    )
  },
  {
    type: "chair",
    name: "Chair",
    category: "seating",
    defaultWidth: 10,
    defaultHeight: 30,
    defaultDepth: 10,
    defaultColor: "#10b981",
    icon: (
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-2xl text-gray-600"
      >
        <path d="M6 19v2M18 19v2M6 5v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5" />
        <path d="M19 5H5a2 2 0 0 1-2-2V2h18v1a2 2 0 0 1-2 2Z" />
      </svg>
    )
  },
  {
    type: "table",
    name: "Table",
    category: "tables",
    defaultWidth: 15,
    defaultHeight: 28,
    defaultDepth: 15,
    defaultColor: "#8b5cf6",
    icon: (
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-2xl text-gray-600"
      >
        <path d="M3 5h18M3 10h18M3 15h18M3 20h18" />
      </svg>
    )
  },
  {
    type: "bookshelf",
    name: "Bookshelf",
    category: "storage",
    defaultWidth: 15,
    defaultHeight: 60,
    defaultDepth: 8,
    defaultColor: "#f59e0b",
    icon: (
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-2xl text-gray-600"
      >
        <rect x="2" y="2" width="20" height="20" rx="2" />
        <line x1="2" y1="7" x2="22" y2="7" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="17" x2="22" y2="17" />
      </svg>
    )
  },
  {
    type: "coffee_table",
    name: "Coffee Table",
    category: "tables",
    defaultWidth: 12,
    defaultHeight: 16,
    defaultDepth: 8,
    defaultColor: "#6b7280",
    icon: (
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-2xl text-gray-600"
      >
        <path d="M3 10h18M6 6h12a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z" />
        <path d="M6 19v2M18 19v2" />
      </svg>
    )
  },
  {
    type: "bed",
    name: "Bed",
    category: "bedroom",
    defaultWidth: 25,
    defaultHeight: 24,
    defaultDepth: 35,
    defaultColor: "#ef4444",
    icon: (
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-2xl text-gray-600"
      >
        <path d="M2 9V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5" />
        <path d="M2 11v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-4 0H6a2 2 0 0 0-4 0Z" />
        <path d="M18 19v2M6 19v2" />
      </svg>
    )
  },
  {
    type: "dining_chair",
    name: "Dining Chair",
    category: "seating",
    defaultWidth: 8,
    defaultHeight: 30,
    defaultDepth: 8,
    defaultColor: "#0ea5e9",
    icon: (
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-2xl text-gray-600"
      >
        <path d="M6 19v2M18 19v2M6 5v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5" />
        <path d="M19 5H5a2 2 0 0 1-2-2V2h18v1a2 2 0 0 1-2 2Z" />
      </svg>
    )
  },
  {
    type: "dining_table",
    name: "Dining Table",
    category: "tables",
    defaultWidth: 20,
    defaultHeight: 30,
    defaultDepth: 15,
    defaultColor: "#14b8a6",
    icon: (
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-2xl text-gray-600"
      >
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <line x1="4" y1="10" x2="20" y2="10" />
      </svg>
    )
  },
  {
    type: "cabinet",
    name: "Cabinet",
    category: "storage",
    defaultWidth: 15,
    defaultHeight: 36,
    defaultDepth: 12,
    defaultColor: "#f43f5e",
    icon: (
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-2xl text-gray-600"
      >
        <rect x="3" y="2" width="18" height="20" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="12" y1="10" x2="12" y2="22" />
      </svg>
    )
  },
  {
    type: "desk",
    name: "Desk",
    category: "tables",
    defaultWidth: 18,
    defaultHeight: 30,
    defaultDepth: 10,
    defaultColor: "#ec4899",
    icon: (
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-2xl text-gray-600"
      >
        <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
        <path d="M4 10h16" />
      </svg>
    )
  },
];
