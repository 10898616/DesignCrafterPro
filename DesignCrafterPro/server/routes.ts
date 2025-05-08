import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertDesignSchema, 
  updateDesignSchema,
  userPreferencesSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Ensure user is authenticated for protected routes
  const ensureAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // User preferences
  app.post("/api/user-preferences", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const preferences = userPreferencesSchema.parse(req.body);
      
      const updatedPreferences = await storage.saveUserPreferences(userId, preferences);
      res.status(200).json(updatedPreferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/user-preferences", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const preferences = await storage.getUserPreferences(userId);
      res.status(200).json(preferences);
    } catch (error) {
      next(error);
    }
  });

  // Designs
  app.post("/api/designs", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const designData = insertDesignSchema.parse({
        ...req.body,
        userId
      });
      
      const newDesign = await storage.createDesign(designData);
      res.status(201).json(newDesign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/designs", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const designs = await storage.getDesignsByUserId(userId);
      res.status(200).json(designs);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/designs/recent", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const designs = await storage.getRecentDesignsByUserId(userId, limit);
      res.status(200).json(designs);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/designs/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const designId = parseInt(req.params.id);
      
      if (isNaN(designId)) {
        return res.status(400).json({ message: "Invalid design ID" });
      }
      
      const design = await storage.getDesignById(designId);
      
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      
      if (design.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to view this design" });
      }
      
      res.status(200).json(design);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/designs/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const designId = parseInt(req.params.id);
      
      if (isNaN(designId)) {
        return res.status(400).json({ message: "Invalid design ID" });
      }
      
      // First check if the design exists and belongs to the user
      const existingDesign = await storage.getDesignById(designId);
      
      if (!existingDesign) {
        return res.status(404).json({ message: "Design not found" });
      }
      
      if (existingDesign.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this design" });
      }
      
      // Validate and update the design
      const updateData = updateDesignSchema.parse(req.body);
      const updatedDesign = await storage.updateDesign(designId, updateData);
      
      res.status(200).json(updatedDesign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/designs/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const designId = parseInt(req.params.id);
      
      if (isNaN(designId)) {
        return res.status(400).json({ message: "Invalid design ID" });
      }
      
      // Check if the design exists and belongs to the user
      const existingDesign = await storage.getDesignById(designId);
      
      if (!existingDesign) {
        return res.status(404).json({ message: "Design not found" });
      }
      
      if (existingDesign.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this design" });
      }
      
      await storage.deleteDesign(designId);
      res.status(200).json({ message: "Design deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  // User-related routes
  app.patch("/api/users/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId) || userId !== req.user!.id) {
        return res.status(403).json({ message: "You can only update your own account" });
      }
      
      const { username, email, fullName } = req.body;
      
      // Validate that the new username isn't already taken
      if (username && username !== req.user!.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, {
        username,
        email,
        fullName
      });
      
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
