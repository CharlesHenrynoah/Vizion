"use server";

import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { hash, compare } from "bcrypt";

// Get the database URL from environment variables
const databaseUrl = process.env.DATABASE_URL;

// Initialize the SQL query function with proper type arguments
let sql: NeonQueryFunction<false, false>;

try {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  // Initialize the Neon client
  sql = neon(databaseUrl);
  console.log("Neon SQL client initialized successfully");
} catch (error) {
  console.error("Failed to initialize Neon SQL client:", error);
  // Provide a fallback non-functional SQL function
  sql = (async () => { 
    throw new Error("Database connection not available"); 
  }) as unknown as NeonQueryFunction<false, false>;
}

/**
 * Fetch data from the database
 * @param {string} table - The table name to query
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<any[]>} The query results
 */
export async function getData(table = "users", limit = 10) {
  try {
    // Pour éviter les problèmes de SQL injection, nous utilisons une approche simplifiée
    // Notez que dans un environnement de production, il faudrait utiliser une méthode plus sécurisée
    let query;
    
    if (table === "users") {
      query = await sql`SELECT * FROM users LIMIT ${limit}`;
    } else if (table === "projects") {
      query = await sql`SELECT * FROM projects LIMIT ${limit}`;
    } else {
      throw new Error(`Table ${table} not supported`);
    }
    
    return { success: true, data: query };
  } catch (error) {
    console.error(`Error fetching data from ${table}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown database error",
      data: [] 
    };
  }
}

/**
 * Get a single record by ID
 * @param {string} table - The table name
 * @param {number} id - The record ID
 * @returns {Promise<any>} The record or null
 */
export async function getRecordById(table: string, id: number) {
  try {
    let results;
    
    if (table === "users") {
      results = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
    } else if (table === "projects") {
      results = await sql`SELECT * FROM projects WHERE id = ${id} LIMIT 1`;
    } else {
      throw new Error(`Table ${table} not supported`);
    }
    
    return { success: true, data: results[0] || null };
  } catch (error) {
    console.error(`Error fetching ${table} with ID ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown database error",
      data: null 
    };
  }
}

/**
 * Create a new user
 * @param {Object} userData - User data object
 * @param {string} userData.firstName - User first name
 * @param {string} userData.lastName - User last name
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password (will be hashed)
 * @returns {Promise<object>} Result object with success status and user data or error
 */
export async function createUser({ firstName, lastName, email, password }: { 
  firstName: string; 
  lastName: string; 
  email: string; 
  password: string; 
}) {
  try {
    // Check if user already exists
    const existingUser = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (existingUser.length > 0) {
      return { 
        success: false, 
        error: "User with this email already exists" 
      };
    }

    // Hash the password before storing
    const hashedPassword = await hash(password, 10);
    
    // Combine first and last name
    const name = `${firstName} ${lastName}`;
    
    // Insert the new user
    const result = await sql`
      INSERT INTO users (email, password, name, created_at, updated_at, is_active)
      VALUES (${email}, ${hashedPassword}, ${name}, NOW(), NOW(), true)
      RETURNING id, email, name, created_at, is_active
    `;
    
    return { 
      success: true, 
      user: result[0],
      message: "User created successfully" 
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error during user creation" 
    };
  }
}

/**
 * Authenticate a user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} Result object with success status and user data or error
 */
export async function authenticateUser(email: string, password: string) {
  try {
    // Find the user by email
    const users = await sql`
      SELECT id, email, password, name, created_at
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;
    
    if (users.length === 0) {
      return { 
        success: false, 
        error: "Invalid email or password" 
      };
    }
    
    const user = users[0];
    
    // Compare the provided password with the stored hash
    const passwordMatch = await compare(password, user.password);
    
    if (!passwordMatch) {
      return { 
        success: false, 
        error: "Invalid email or password" 
      };
    }
    
    // Don't return the password hash
    const { password: _, ...userWithoutPassword } = user;
    
    return { 
      success: true, 
      data: userWithoutPassword,
      message: "Authentication successful" 
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown authentication error" 
    };
  }
}
