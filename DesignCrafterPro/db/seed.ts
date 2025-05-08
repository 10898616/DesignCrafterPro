import { db } from "./index";
import * as schema from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    console.log("🌱 Starting database seeding...");
    
    // Check if admin user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, "admin")
    });
    
    if (!existingUser) {
      console.log("Creating admin user...");
      const hashedPassword = await hashPassword("password");
      const adminUserData = schema.insertUserSchema.parse({
        username: "admin",
        password: hashedPassword,
        email: "admin@example.com",
        fullName: "Admin User"
      });
      
      // Insert admin user
      const [adminUser] = await db.insert(schema.users).values(adminUserData).returning();
      console.log(`✅ Created admin user with ID: ${adminUser.id}`);
      
      // Create user preferences
      await db.insert(schema.userPreferences).values({
        userId: adminUser.id,
        defaultTheme: "system",
        enableGridSnapping: true,
        enableAutoSave: false,
        defaultRoomWidth: "12",
        defaultRoomLength: "15",
        defaultRoomHeight: "8"
      });
      console.log("✅ Created admin user preferences");
      
      // Create sample designs
      const livingRoomDesign = {
        userId: adminUser.id,
        name: "Living Room Setup",
        description: "Modern living room arrangement with sofa and coffee table",
        roomWidth: 20,
        roomLength: 25,
        roomHeight: 10,
        wallColor: "#f5f5f5",
        furniture: JSON.stringify([
          {
            id: uuidv4(),
            type: "sofa",
            name: "Sofa",
            width: 20,
            height: 32,
            depth: 35,
            color: "#3b82f6",
            x: 35,
            y: 70,
            rotation: 0
          },
          {
            id: uuidv4(),
            type: "coffee_table",
            name: "Coffee Table",
            width: 12,
            height: 16,
            depth: 8,
            color: "#6b7280",
            x: 50,
            y: 50,
            rotation: 0
          }
        ])
      };
      
      const homeOfficeDesign = {
        userId: adminUser.id,
        name: "Home Office",
        description: "Productivity-focused home office setup",
        roomWidth: 15,
        roomLength: 15,
        roomHeight: 8,
        wallColor: "#e0e7ff",
        furniture: JSON.stringify([
          {
            id: uuidv4(),
            type: "desk",
            name: "Desk",
            width: 18,
            height: 30,
            depth: 10,
            color: "#ec4899",
            x: 50,
            y: 30,
            rotation: 0
          },
          {
            id: uuidv4(),
            type: "chair",
            name: "Office Chair",
            width: 10,
            height: 30,
            depth: 10,
            color: "#10b981",
            x: 50,
            y: 45,
            rotation: 0
          },
          {
            id: uuidv4(),
            type: "bookshelf",
            name: "Bookshelf",
            width: 15,
            height: 60,
            depth: 8,
            color: "#f59e0b",
            x: 85,
            y: 50,
            rotation: 0
          }
        ])
      };
      
      // Insert sample designs
      await db.insert(schema.designs).values(livingRoomDesign);
      await db.insert(schema.designs).values(homeOfficeDesign);
      console.log("✅ Created sample designs");
    } else {
      console.log("✅ Admin user already exists, skipping user creation");
      
      // Check if sample designs exist
      const existingDesigns = await db.query.designs.findMany({
        where: (designs, { eq }) => eq(designs.userId, existingUser.id)
      });
      
      if (existingDesigns.length === 0) {
        console.log("Creating sample designs for existing admin user...");
        // Create sample designs for existing user
        const livingRoomDesign = {
          userId: existingUser.id,
          name: "Living Room Setup",
          description: "Modern living room arrangement with sofa and coffee table",
          roomWidth: 20,
          roomLength: 25,
          roomHeight: 10,
          wallColor: "#f5f5f5",
          furniture: JSON.stringify([
            {
              id: uuidv4(),
              type: "sofa",
              name: "Sofa",
              width: 20,
              height: 32,
              depth: 35,
              color: "#3b82f6",
              x: 35,
              y: 70,
              rotation: 0
            },
            {
              id: uuidv4(),
              type: "coffee_table",
              name: "Coffee Table",
              width: 12,
              height: 16,
              depth: 8,
              color: "#6b7280",
              x: 50,
              y: 50,
              rotation: 0
            }
          ])
        };
        
        const homeOfficeDesign = {
          userId: existingUser.id,
          name: "Home Office",
          description: "Productivity-focused home office setup",
          roomWidth: 15,
          roomLength: 15,
          roomHeight: 8,
          wallColor: "#e0e7ff",
          furniture: JSON.stringify([
            {
              id: uuidv4(),
              type: "desk",
              name: "Desk",
              width: 18,
              height: 30,
              depth: 10,
              color: "#ec4899",
              x: 50,
              y: 30,
              rotation: 0
            },
            {
              id: uuidv4(),
              type: "chair",
              name: "Office Chair",
              width: 10,
              height: 30,
              depth: 10,
              color: "#10b981",
              x: 50,
              y: 45,
              rotation: 0
            },
            {
              id: uuidv4(),
              type: "bookshelf",
              name: "Bookshelf",
              width: 15,
              height: 60,
              depth: 8,
              color: "#f59e0b",
              x: 85,
              y: 50,
              rotation: 0
            }
          ])
        };
        
        // Insert sample designs
        await db.insert(schema.designs).values(livingRoomDesign);
        await db.insert(schema.designs).values(homeOfficeDesign);
        console.log("✅ Created sample designs");
      } else {
        console.log("✅ Sample designs already exist, skipping design creation");
      }
    }
    
    console.log("✅ Database seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    process.exit(0);
  }
}

seed();
