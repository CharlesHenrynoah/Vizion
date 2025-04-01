"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import ClientLayout from "../ClientLayout";

export default function LoginPage() {
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: ""
  });
  const router = useRouter();

  // Email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Password validation regex - at least 8 characters, 1 number, 1 symbol
  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[a-zA-Z]).{8,}$/;

  // Validate form fields on change
  useEffect(() => {
    const newValidationErrors = { ...validationErrors };
    
    // Email validation
    if (formData.email && !emailRegex.test(formData.email)) {
      newValidationErrors.email = "Please enter a valid email address";
    } else {
      newValidationErrors.email = "";
    }
    
    // Password validation
    if (formData.password && !passwordRegex.test(formData.password)) {
      newValidationErrors.password = "Password must be at least 8 characters, contain at least 1 number and 1 symbol";
    } else {
      newValidationErrors.password = "";
    }
    
    setValidationErrors(newValidationErrors);
  }, [formData]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      rememberMe: checked
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }
    
    // Validate email format
    if (!emailRegex.test(formData.email)) {
      setValidationErrors(prev => ({
        ...prev,
        email: "Please enter a valid email address"
      }));
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Try manual login first
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error messages from the API
        setError(data.message || "Failed to sign in");
        return;
      }
      
      if (data.success) {
        // Redirect to kanban page after successful login
        router.push('/kanban');
        return;
      }
      
      // Fallback to NextAuth if manual login fails
      console.log("Falling back to NextAuth...");
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
        callbackUrl: '/kanban'
      });
      
      if (result?.error) {
        // Handle different types of errors
        if (result.error.includes("No user found")) {
          setError("User not found. Please check your email or sign up for a new account.");
        } else if (result.error.includes("Invalid credentials")) {
          setError("Incorrect password. Please try again.");
        } else {
          setError(result.error || "Failed to sign in. Please try again.");
        }
        return;
      }
      
      // Redirect to kanban page
      router.push(result?.url || '/kanban');
      
    } catch (err: any) {
      setError(err.message || "An error occurred while signing in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ClientLayout>
      <div className="flex items-center justify-center min-h-screen py-12 px-4">
        <div className="flex flex-col relative z-10">
          <div className="w-full max-w-xl">
            {/* Header section with text only */}
            <div className="py-4 px-8 mb-8 text-center">
              <h1 className="text-3xl font-bold text-blue-400">Welcome back</h1>
              <p className="text-blue-400 mt-1">Sign in to continue with Vizion AI</p>
            </div>

            {/* Card component with same styling as project form */}
            <Card className="border-0 shadow-none bg-transparent">
              <CardContent className="p-0">
                <div className="bg-white/60 border border-blue-400/50 rounded-lg p-8 overflow-hidden relative shadow-2xl shadow-black/20">
                  {/* Social login options */}
                  <div className="space-y-4 mb-6">
                    <Button 
                      variant="outline" 
                      className="w-full border-blue-400/30 bg-white flex items-center justify-center gap-2 text-blue-300" 
                      type="button"
                      onClick={() => signIn('google', { callbackUrl: '/kanban' })}
                      disabled={isLoading}
                    >
                      <FcGoogle className="h-5 w-5" />
                      Sign in with Google
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-blue-400/30 bg-white flex items-center justify-center gap-2 text-blue-300" 
                      type="button"
                      onClick={() => signIn('github', { callbackUrl: '/kanban' })}
                      disabled={isLoading}
                    >
                      <FaGithub className="h-5 w-5" />
                      Sign in with GitHub
                    </Button>
                  </div>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full border-blue-400/30" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="px-2 bg-white/60 text-blue-300">Or continue with</span>
                    </div>
                  </div>

                  {/* Display error message if any */}
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md mb-4 text-sm">
                      {error}
                    </div>
                  )}

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    {/* Email field */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-blue-300 font-medium text-sm">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        className={`bg-white text-blue-300 border-blue-400/30 focus:ring-1 focus:ring-blue-400 focus:outline-none rounded-md ${validationErrors.email ? 'border-red-400' : ''}`}
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                      {validationErrors.email && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.email}</p>
                      )}
                    </div>

                    {/* Password field */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-blue-300 font-medium text-sm">Password</Label>
                        <Link href="/forgot-password" className="text-xs text-blue-400 hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className={`bg-white text-blue-300 border-blue-400/30 focus:ring-1 focus:ring-blue-400 focus:outline-none rounded-md ${validationErrors.password ? 'border-red-400' : ''}`}
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                      {validationErrors.password && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.password}</p>
                      )}
                    </div>

                    {/* Remember me checkbox */}
                    <div className="flex items-start space-x-3 pt-2">
                      <Checkbox 
                        id="rememberMe" 
                        checked={formData.rememberMe}
                        onCheckedChange={handleCheckboxChange}
                        className="border-blue-400/30 data-[state=checked]:bg-blue-400 data-[state=checked]:text-white mt-0.5"
                        disabled={isLoading}
                      />
                      <label htmlFor="rememberMe" className="text-sm text-blue-300 leading-tight">
                        Remember me
                      </label>
                    </div>

                    {/* Submit button */}
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-400 hover:bg-blue-300 text-white font-medium py-2 rounded-md transition-all mt-4"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign in"
                      )}
                    </Button>
                  </form>
                  
                  {/* Footer */}
                  <div className="flex justify-center mt-6 pt-6 border-t border-blue-400/30">
                    <p className="text-sm text-blue-300">
                      Don't have an account? <Link href="/signup" className="font-medium underline underline-offset-4 hover:text-blue-300 text-blue-400">Sign up</Link>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
