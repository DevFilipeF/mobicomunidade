"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: string
  name: string
  email: string
  phone: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, phone: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Verificar se o usuário está logado ao carregar a página
  useEffect(() => {
    const storedUser = localStorage.getItem("mobiUser")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  // Função de login
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      // Simulação de uma chamada de API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Em uma aplicação real, isso seria validado no backend
      // Aqui estamos apenas simulando para demonstração
      const mockUsers = JSON.parse(localStorage.getItem("mobiUsers") || "[]")
      const foundUser = mockUsers.find((u: any) => u.email === email && u.password === password)

      if (!foundUser) {
        return false
      }

      // Remover a senha antes de armazenar no estado
      const { password: _, ...userWithoutPassword } = foundUser

      setUser(userWithoutPassword)
      localStorage.setItem("mobiUser", JSON.stringify(userWithoutPassword))
      return true
    } catch (error) {
      console.error("Erro ao fazer login:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Função de registro
  const register = async (name: string, email: string, phone: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      // Simulação de uma chamada de API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Em uma aplicação real, isso seria feito no backend
      const mockUsers = JSON.parse(localStorage.getItem("mobiUsers") || "[]")

      // Verificar se o email já está em uso
      if (mockUsers.some((u: any) => u.email === email)) {
        return false
      }

      // Criar novo usuário
      const newUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        phone,
        password, // Em uma aplicação real, a senha seria hasheada
      }

      // Adicionar à "base de dados" simulada
      mockUsers.push(newUser)
      localStorage.setItem("mobiUsers", JSON.stringify(mockUsers))

      // Fazer login automaticamente após o registro
      const { password: _, ...userWithoutPassword } = newUser
      setUser(userWithoutPassword)
      localStorage.setItem("mobiUser", JSON.stringify(userWithoutPassword))

      return true
    } catch (error) {
      console.error("Erro ao registrar:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Função de logout
  const logout = () => {
    setUser(null)
    localStorage.removeItem("mobiUser")
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}
