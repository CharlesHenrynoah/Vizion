"use client";

import { useState } from "react";
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

export default function SignUpPage() {
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false
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

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      agreeToTerms: checked
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError("All fields are required");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (!formData.agreeToTerms) {
      setError("You must agree to the terms and conditions");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Send data to your API endpoint
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to sign up");
      }
      
      // Redirect to Kanban page after successful registration
      router.push('/kanban');
      
    } catch (err: any) {
      setError(err.message || "An error occurred during sign up");
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
              <h1 className="text-3xl font-bold text-blue-400">Create your account</h1>
              <p className="text-blue-400 mt-1">Start turning your ideas into structured projects</p>
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
                      Sign up with Google
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-blue-400/30 bg-white flex items-center justify-center gap-2 text-blue-300" 
                      type="button"
                      onClick={() => signIn('github', { callbackUrl: '/kanban' })}
                      disabled={isLoading}
                    >
                      <FaGithub className="h-5 w-5" />
                      Sign up with GitHub
                    </Button>
                  </div>
                  
                  {/* Or separator */}
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
                    {/* First/Last Name row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-blue-300 font-medium text-sm">First name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          placeholder="John"
                          className="bg-white text-blue-300 border-blue-400/30 focus:ring-1 focus:ring-blue-400 focus:outline-none rounded-md"
                          value={formData.firstName}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-blue-300 font-medium text-sm">Last name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          placeholder="Doe"
                          className="bg-white text-blue-300 border-blue-400/30 focus:ring-1 focus:ring-blue-400 focus:outline-none rounded-md"
                          value={formData.lastName}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Email field */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-blue-300 font-medium text-sm">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        className="bg-white text-blue-300 border-blue-400/30 focus:ring-1 focus:ring-blue-400 focus:outline-none rounded-md"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Password field */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-blue-300 font-medium text-sm">Password</Label>
                      </div>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="bg-white text-blue-300 border-blue-400/30 focus:ring-1 focus:ring-blue-400 focus:outline-none rounded-md"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                      <p className="text-xs text-blue-300">Password must be at least 8 characters long and include a number and symbol</p>
                    </div>

                    {/* Confirm Password field */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-blue-300 font-medium text-sm">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        className="bg-white text-blue-300 border-blue-400/30 focus:ring-1 focus:ring-blue-400 focus:outline-none rounded-md"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Terms checkbox */}
                    <div className="flex items-start space-x-3 pt-2">
                      <Checkbox 
                        id="terms" 
                        checked={formData.agreeToTerms}
                        onCheckedChange={handleCheckboxChange}
                        className="border-blue-400/30 data-[state=checked]:bg-blue-400 data-[state=checked]:text-white mt-0.5"
                        disabled={isLoading}
                      />
                      <label htmlFor="terms" className="text-sm text-blue-300 leading-tight">
                        I agree to the <Link href="/terms" className="underline underline-offset-2 hover:text-blue-300 text-blue-400">Terms of Service</Link> and <Link href="/privacy" className="underline underline-offset-2 hover:text-blue-300 text-blue-400">Privacy Policy</Link>
                      </label>
                    </div>

                    {/* Submit button */}
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-400 hover:bg-blue-300 text-white font-medium py-2 rounded-md transition-all mt-4"
                      disabled={!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim() || !formData.agreeToTerms || isLoading}
                    >
                      {isLoading ? "Processing..." : "Sign up"}
                    </Button>
                  </form>
                  
                  {/* Footer */}
                  <div className="flex justify-center mt-6 pt-6 border-t border-blue-400/30">
                    <p className="text-sm text-blue-300">
                      Already have an account? <Link href="/login" className="font-medium underline underline-offset-4 hover:text-blue-300 text-blue-400">Sign in</Link>
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