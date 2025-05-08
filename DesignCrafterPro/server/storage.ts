import { db } from "@db";
import { 
  users, 
  insertUserSchema, 
  User, 
  designs, 
  userPreferences,
  InsertDesign, 
  Design, 
  UpdateDesign,
  UserPreferences
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "@db";

// Set up session store
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User related operations
  createUser(userData: Omit<User, "id">): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  updateUserPassword(id: number, password: string): Promise<void>;
  
  // Design related operations
  createDesign(designData: InsertDesign): Promise<Design>;
  getDesignById(id: number): Promise<Design | undefined>;
  getDesignsByUserId(userId: number): Promise<Design[]>;
  getRecentDesignsByUserId(userId: number, limit?: number): Promise<Design[]>;
  updateDesign(id: number, designData: UpdateDesign): Promise<Design>;
  deleteDesign(id: number): Promise<void>;
  
  // Preferences related operations
  saveUserPreferences(userId: number, preferences: UserPreferences): Promise<UserPreferences>;
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'session'
    });
  }
  
  // User operations
  async createUser(userData: Omit<User, "id">): Promise<User> {
    const parsedData = insertUserSchema.parse(userData);
    const [newUser] = await db.insert(users).values(parsedData).returning();
    return newUser;
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async updateUserPassword(id: number, password: string): Promise<void> {
    await db
      .update(users)
      .set({ password })
      .where(eq(users.id, id));
  }
  
  // Design operations
  async createDesign(designData: InsertDesign): Promise<Design> {
    const [newDesign] = await db.insert(designs).values(designData).returning();
    return newDesign;
  }
  
  async getDesignById(id: number): Promise<Design | undefined> {
    const result = await db.select().from(designs).where(eq(designs.id, id)).limit(1);
    return result[0];
  }
  
  async getDesignsByUserId(userId: number): Promise<Design[]> {
    return await db
      .select()
      .from(designs)
      .where(eq(designs.userId, userId))
      .orderBy(desc(designs.updatedAt));
  }
  
  async getRecentDesignsByUserId(userId: number, limit: number = 5): Promise<Design[]> {
    return await db
      .select()
      .from(designs)
      .where(eq(designs.userId, userId))
      .orderBy(desc(designs.updatedAt))
      .limit(limit);
  }
  
  async updateDesign(id: number, designData: UpdateDesign): Promise<Design> {
    const [updatedDesign] = await db
      .update(designs)
      .set({
        ...designData,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(designs.id, id))
      .returning();
    return updatedDesign;
  }
  
  async deleteDesign(id: number): Promise<void> {
    await db.delete(designs).where(eq(designs.id, id));
  }
  
  // Preferences operations
  async saveUserPreferences(userId: number, preferences: UserPreferences): Promise<UserPreferences> {
    // Check if preferences already exist for this user
    const existingPrefs = await this.getUserPreferences(userId);
    
    if (existingPrefs) {
      // Update existing preferences
      const [updatedPrefs] = await db
        .update(userPreferences)
        .set({
          ...preferences,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(userPreferences.userId, userId))
        .returning();
      return updatedPrefs;
    } else {
      // Create new preferences
      const [newPrefs] = await db
        .insert(userPreferences)
        .values({
          userId,
          ...preferences
        })
        .returning();
      return newPrefs;
    }
  }
  
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const result = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    return result[0];
  }
}

// Export singleton instance
export const storage: IStorage = new DatabaseStorage();
