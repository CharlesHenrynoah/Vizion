"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, User, Paintbrush, Key, Upload, Eye, EyeOff } from "lucide-react"

export function SettingsDialog() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("account")
  const [showPassword, setShowPassword] = useState(false)
  const [theme, setTheme] = useState("dark")

  // État pour les champs du formulaire
  const [fullName, setFullName] = useState("John Doe")
  const [email, setEmail] = useState("john.doe@example.com")
  const [avatarUrl, setAvatarUrl] = useState("/placeholder.svg?height=100&width=100")
  const [password, setPassword] = useState("••••••••")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-between p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 w-full"
          onClick={() => setOpen(true)}
        >
          <span>Settings</span>
          <Settings className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="p-0 overflow-hidden flex max-w-3xl h-[550px]">
        {/* Sidebar */}
        <div className="w-48 bg-slate-100 dark:bg-slate-800 flex flex-col">
          <div className="p-4">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white">Settings</h2>
          </div>
          <div className="flex-1 p-2">
            <button
              className={`flex items-center gap-3 p-2 rounded-md transition-colors w-full text-left ${activeTab === "account" ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
              onClick={() => setActiveTab("account")}
            >
              <User className="h-4 w-4" />
              <span className="text-sm">My Account</span>
            </button>
            <button
              className={`flex items-center gap-3 p-2 rounded-md transition-colors w-full text-left ${activeTab === "appearance" ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
              onClick={() => setActiveTab("appearance")}
            >
              <Paintbrush className="h-4 w-4" />
              <span className="text-sm">Appearance</span>
            </button>
            <button
              className={`flex items-center gap-3 p-2 rounded-md transition-colors w-full text-left ${activeTab === "tokens" ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
              onClick={() => setActiveTab("tokens")}
            >
              <Key className="h-4 w-4" />
              <span className="text-sm">Tokens</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-slate-900 overflow-y-auto">
          <div className="p-6 relative min-h-[550px]">
            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Account</h2>

                <div className="flex flex-col items-center gap-4 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarUrl} alt={fullName} />
                    <AvatarFallback>
                      {fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span>Upload Photo</span>
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-slate-900 dark:text-white">
                      Full Name
                    </Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-900 dark:text-white">
                      Email Address
                    </Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-900 dark:text-white">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button variant="link" className="h-auto p-0 text-sm">
                      Change password
                    </Button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Appearance</h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="theme" className="text-slate-900 dark:text-white">
                      Theme
                    </Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Tokens Tab */}
            {activeTab === "tokens" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tokens</h2>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 dark:text-slate-300">Per day</span>
                      <span className="text-slate-900 dark:text-white font-medium">0 / 150,000</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 dark:text-slate-300">Per month</span>
                      <span className="text-slate-900 dark:text-white font-medium">300,000 / 1,000,000</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 dark:text-slate-300">Tokens obtained through referrals</span>
                      <span className="text-slate-900 dark:text-white font-medium">0 / 0</span>
                    </div>
                  </div>

                  <Button className="w-full">Upgrade for more tokens</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

