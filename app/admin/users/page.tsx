"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { initializeDatabase, checkUsersTable, getUsersTableStructure } from "@/app/actions/db-init"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Loader2, Database, CheckCircle, AlertCircle, UserIcon, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUp, type User } from "@/app/actions/auth"
import { neon } from "@neondatabase/serverless"

export default function AdminUsersPage() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [tableStatus, setTableStatus] = useState<{ exists: boolean; message: string } | null>(null)
  const [tableStructure, setTableStructure] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Fonction pour vérifier la table users
  const checkTable = async () => {
    try {
      const status = await checkUsersTable()
      setTableStatus(status)

      if (status.exists) {
        const structure = await getUsersTableStructure()
        if (structure.success) {
          setTableStructure(structure.columns)
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de la table:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de vérifier la table users",
      })
    }
  }

  // Fonction pour initialiser la base de données
  const handleInitializeDatabase = async () => {
    setIsInitializing(true)

    try {
      const result = await initializeDatabase()

      if (result.success) {
        toast({
          title: "Succès",
          description: result.message,
        })

        // Vérifier à nouveau la table
        await checkTable()
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.message,
        })
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la base de données:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'initialiser la base de données",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  // Ajouter cette fonction après la fonction handleInitializeDatabase
  const handleResetDatabase = async () => {
    setIsInitializing(true)

    try {
      const sql = neon(process.env.DATABASE_URL!)

      // Supprimer la table users si elle existe
      await sql`DROP TABLE IF EXISTS users`

      // Recréer la table
      const result = await initializeDatabase()

      if (result.success) {
        toast({
          title: "Succès",
          description: "La table users a été réinitialisée avec succès",
        })

        // Vérifier à nouveau la table
        await checkTable()
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.message,
        })
      }
    } catch (error) {
      console.error("Erreur lors de la réinitialisation de la base de données:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de réinitialiser la base de données",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  // Fonction pour récupérer les utilisateurs
  const fetchUsers = async () => {
    setIsLoading(true)

    try {
      // Cette fonction serait implémentée dans un cas réel
      // Pour cette démo, nous utilisons un tableau vide
      setUsers([])
      setIsLoading(false)
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de récupérer les utilisateurs",
      })
      setIsLoading(false)
    }
  }

  // Vérifier la table au chargement de la page
  useEffect(() => {
    checkTable()
    fetchUsers()
  }, [])

  // Gérer les changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewUser((prev) => ({ ...prev, [name]: value }))

    // Effacer l'erreur lorsque l'utilisateur tape
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  // Valider le formulaire
  const validateForm = () => {
    let isValid = true
    const newErrors = { ...errors }

    // Validation du nom complet
    if (!newUser.fullName) {
      newErrors.fullName = "Le nom complet est requis"
      isValid = false
    }

    // Validation de l'email
    if (!newUser.email) {
      newErrors.email = "L'email est requis"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(newUser.email)) {
      newErrors.email = "L'email est invalide"
      isValid = false
    }

    // Validation du mot de passe
    if (!newUser.password) {
      newErrors.password = "Le mot de passe est requis"
      isValid = false
    } else if (newUser.password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères"
      isValid = false
    }

    // Validation de la confirmation du mot de passe
    if (!newUser.confirmPassword) {
      newErrors.confirmPassword = "Veuillez confirmer votre mot de passe"
      isValid = false
    } else if (newUser.password !== newUser.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const result = await signUp(newUser.email, newUser.password, newUser.fullName)

      if (result.success) {
        toast({
          title: "Succès",
          description: "Utilisateur créé avec succès",
        })

        // Fermer le dialogue et réinitialiser le formulaire
        setIsDialogOpen(false)
        setNewUser({
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
        })

        // Rafraîchir la liste des utilisateurs
        fetchUsers()
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.message,
        })
      }
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer l'utilisateur",
      })
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Toaster />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestion des utilisateurs</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Initialisez la base de données et gérez les utilisateurs
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={checkTable} variant="outline" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Vérifier la table
          </Button>

          <Button
            onClick={handleInitializeDatabase}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isInitializing}
          >
            {isInitializing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Initialisation...
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Initialiser la base de données
              </>
            )}
          </Button>

          {/* Ajouter ce bouton dans la section des boutons (après le bouton "Initialiser la base de données") */}
          <Button
            onClick={handleResetDatabase}
            variant="destructive"
            className="flex items-center gap-2"
            disabled={isInitializing}
          >
            {isInitializing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Réinitialisation...
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Réinitialiser la table
              </>
            )}
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
                <DialogDescription>Créez un nouvel utilisateur avec un profil complet.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={newUser.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={newUser.email}
                    onChange={handleChange}
                    placeholder="john.doe@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={newUser.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Créer l'utilisateur</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statut de la table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Statut de la base de données
          </CardTitle>
          <CardDescription>Vérifiez l'état de la table users et initialisez-la si nécessaire.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {tableStatus ? (
                tableStatus.exists ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">La table users existe</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">
                      La table users n'existe pas. Cliquez sur "Initialiser la base de données" pour la créer.
                    </span>
                  </>
                )
              ) : (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Vérification de la table...</span>
                </>
              )}
            </div>

            {tableStatus && tableStatus.exists && tableStructure && (
              <div>
                <h3 className="text-sm font-medium mb-2">Structure de la table users:</h3>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                          Colonne
                        </th>
                        <th className="text-left py-2 px-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                          Type
                        </th>
                        <th className="text-left py-2 px-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                          Nullable
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableStructure.map((column, index) => (
                        <tr key={index} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-2 px-4 text-sm">{column.column_name}</td>
                          <td className="py-2 px-4 text-sm">{column.data_type}</td>
                          <td className="py-2 px-4 text-sm">{column.is_nullable === "YES" ? "Oui" : "Non"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Utilisateurs
          </CardTitle>
          <CardDescription>Liste des utilisateurs enregistrés dans la base de données.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              Aucun utilisateur trouvé. Cliquez sur "Ajouter un utilisateur" pour en créer un.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Nom</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Rôle</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Statut</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-3 px-4 text-sm">{user.id.substring(0, 8)}...</td>
                      <td className="py-3 px-4 font-medium">{user.full_name || "Non renseigné"}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.status === "active"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                              : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Éditer
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            Désactiver
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

