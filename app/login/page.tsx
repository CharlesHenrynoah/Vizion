"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { Loader2 } from "lucide-react";

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
  const router = useRouter();

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
    
    try {
      setIsLoading(true);
      
      // Send data to your API endpoint
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to sign in");
      }
      
      // Redirect to dashboard or home page
      router.push('/dashboard');
      
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center w-full py-10">
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
                    className="w-full border-blue-400/30 bg-white/60 flex items-center justify-center gap-2 text-blue-300" 
                    type="button"
                    onClick={() => window.location.href = '/api/auth/google'}
                    disabled={isLoading}
                  >
                    <FcGoogle className="h-5 w-5" />
                    Sign in with Google
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-400/30 bg-white/60 flex items-center justify-center gap-2 text-blue-300" 
                    type="button"
                    onClick={() => window.location.href = '/api/auth/github'}
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
                    <span className="px-2 bg-white text-blue-400">Or continue with</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <p>{error}</p>
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                  {/* Email field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-blue-400 font-medium text-sm">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      className="bg-white text-blue-400 border-blue-400/30 focus:ring-1 focus:ring-blue-400 focus:outline-none rounded-md"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Password field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-blue-400 font-medium text-sm">Password</Label>
                      <Link href="/forgot-password" className="text-xs text-blue-400 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-white text-blue-400 border-blue-400/30 focus:ring-1 focus:ring-blue-400 focus:outline-none rounded-md"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Remember me checkbox */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-blue-400/30 text-blue-400 focus:ring-blue-400"
                    />
                    <Label htmlFor="rememberMe" className="text-sm text-blue-400">Remember me</Label>
                  </div>

                  {/* Submit button */}
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-400 hover:bg-blue-300 text-white font-medium py-2 rounded-md transition-all mt-2"
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

                  <div className="text-center mt-4">
                    <p className="text-sm text-blue-400">
                      Don't have an account?{" "}
                      <Link href="/signup" className="text-blue-500 hover:underline font-medium">
                        Sign up
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
