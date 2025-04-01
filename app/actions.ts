"use server";

import { createClient } from '@supabase/supabase-js';
import { hash, compare } from "bcrypt";

// Créer le client Supabase avec les mêmes paramètres que NextAuth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Supabase client initialized successfully");

/**
 * Fetch data from the database
 * @param {string} table - The table name to query
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<any[]>} The query results
 */
export async function getData(table = "users", limit = 10) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(limit);
    
    if (error) {
      console.error(`Error fetching data from ${table}:`, error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Database query error:", error);
    return [];
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
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching record from ${table}:`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Database query error:", error);
    return null;
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
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);
    
    if (checkError) {
      console.error("Error checking existing user:", checkError);
      return { 
        success: false, 
        error: "Database error when checking user" 
      };
    }
    
    if (existingUser && existingUser.length > 0) {
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
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        { 
          email, 
          password: hashedPassword, 
          name, 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        }
      ])
      .select()
      .single();
    
    if (insertError) {
      console.error("Error creating user:", insertError);
      return { 
        success: false, 
        error: "Failed to create user account" 
      };
    }
    
    // Return success with user data (excluding password)
    const { password: _, ...userWithoutPassword } = newUser;
    return { 
      success: true, 
      user: userWithoutPassword
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return { 
      success: false, 
      error: "An unexpected error occurred" 
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
    console.log(`Authenticating user with email: ${email}`);
    
    // Get user by email
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      console.error("Database error during authentication:", error);
      return { 
        success: false, 
        error: "Database error during authentication" 
      };
    }
    
    if (!data) {
      console.log("No user found with this email");
      return { 
        success: false, 
        error: "User not found. Please check your email or sign up for a new account." 
      };
    }
    
    // Compare passwords
    console.log("Comparing passwords...");
    const passwordValid = await compare(password, data.password);
    console.log("Password match result:", passwordValid);
    
    if (!passwordValid) {
      return { 
        success: false, 
        error: "Incorrect password. Please try again." 
      };
    }
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = data;
    console.log("Authentication successful for user:", data.email);
    
    return { 
      success: true, 
      user: userWithoutPassword
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return { 
      success: false, 
      error: "An error occurred during authentication" 
    };
  }
}
