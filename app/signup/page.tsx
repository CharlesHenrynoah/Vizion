"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  // Define colors based on the target image for easier management
  const pageBgColor = ""; // Removed background color from this container
  const cardBgColor = "bg-gray-950"; // Very dark gray, almost black
  const inputDarkBgColor = "bg-gray-800"; // Darker input bg
  const inputLightBgColor = "bg-yellow-100"; // Light yellow/beige bg for email/pass
  const primaryTextColor = "text-white";
  const mutedTextColor = "text-gray-400"; // Lighter gray for muted text
  const accentColor = "text-yellow-100"; // For input text on light bg
  const buttonBgColor = "bg-purple-600";
  const buttonHoverBgColor = "hover:bg-purple-700";

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
      
      // Redirect to success page or login
      router.push('/login?registered=true');
      
    } catch (err: any) {
      setError(err.message || "An error occurred during sign up");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Main container: Full height, flex centering, NO background color and NO SHADOW
    <div className={`flex items-center justify-center min-h-screen p-4 shadow-none overflow-hidden`}>
      {/* Content wrapper: Constrains width and centers horizontally - NO SHADOW */}
      <div className="w-full max-w-md shadow-none">
        {/* Header section: Updated to pill-like shape with rounded corners and border */}
        <div className="bg-gray-900 border border-gray-700 rounded-full py-4 px-6 mb-8 text-center">
          <h1 className={`text-3xl font-bold ${primaryTextColor}`}>Create an Account</h1>
          <p className={`${mutedTextColor} mt-1`}>Enter your information to get started</p>
        </div>

        {/* Card component: Styled with dark background - EXPLICITLY REMOVED ALL SHADOWS */}
        <Card className={`${cardBgColor} border-gray-800 rounded-lg overflow-hidden shadow-none`}>
          <CardContent className="pt-6 px-6">
            {/* Social login options */}
            <div className="space-y-4 mb-6">
              <Button 
                variant="outline" 
                className="w-full border-gray-700 hover:bg-gray-800 bg-transparent flex items-center justify-center gap-2 text-white" 
                type="button"
                onClick={() => window.location.href = '/api/auth/google'}
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" className="h-5 w-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign up with Google
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full border-gray-700 hover:bg-gray-800 bg-transparent flex items-center justify-center gap-2 text-white" 
                type="button"
                onClick={() => window.location.href = '/api/auth/github'}
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Sign up with GitHub
              </Button>
            </div>
            
            {/* Or separator */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className={`px-2 ${cardBgColor} ${mutedTextColor}`}>Or continue with</span>
              </div>
            </div>

            {/* Display error message if any */}
            {error && (
              <div className="bg-red-900/20 border border-red-800 text-red-100 px-4 py-2 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* First/Last Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className={`${primaryTextColor} text-sm`}>First name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    className={`${inputDarkBgColor} ${primaryTextColor} border-gray-700 rounded placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500`}
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className={`${primaryTextColor} text-sm`}>Last name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    className={`${inputDarkBgColor} ${primaryTextColor} border-gray-700 rounded placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500`}
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className={`${primaryTextColor} text-sm`}>Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  className={`${inputLightBgColor} text-gray-900 border-gray-300 rounded placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500`}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className={`${primaryTextColor} text-sm`}>Password</Label>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className={`${inputLightBgColor} text-gray-900 border-gray-300 rounded placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500`}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <p className={`text-xs ${mutedTextColor}`}>
                  Password must be at least 8 characters long and include a number and symbol
                </p>
              </div>

              {/* Password Confirmation field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className={`${primaryTextColor} text-sm`}>Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className={`${inputLightBgColor} text-gray-900 border-gray-300 rounded placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              {/* Terms agreement checkbox */}
              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={handleCheckboxChange}
                  className="border-gray-600 data-[state=checked]:bg-purple-600 data-[state=checked]:text-white mt-0.5"
                  disabled={isLoading}
                />
                <label
                  htmlFor="terms"
                  className={`text-sm ${mutedTextColor} leading-tight`}
                >
                  I agree to the{" "}
                  <Link href="/terms" className={`underline underline-offset-2 hover:${primaryTextColor} text-gray-300`}>
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className={`underline underline-offset-2 hover:${primaryTextColor} text-gray-300`}>
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit button */}
              <Button 
                type="submit" 
                className={`w-full ${buttonBgColor} ${primaryTextColor} ${buttonHoverBgColor} rounded mt-4`}
                disabled={isLoading}
              >
                {isLoading ? "Signing up..." : "Sign up"}
              </Button>
            </form>
          </CardContent>

          {/* Footer section */}
          <CardFooter className={`flex flex-col items-center gap-2 border-t border-gray-800 p-6 ${cardBgColor}`}>
            <p className={`text-sm ${mutedTextColor}`}>
              Already have an account?{" "}
              <Link href="/login" className={`font-medium underline underline-offset-4 hover:${primaryTextColor} text-gray-300`}>
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}