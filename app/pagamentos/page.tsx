"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CreditCard, Wallet, Clock, Plus } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { getPayments, getUserCredits, type Payment, type UserCredits } from "@/services/user-service"

export default function PagamentosPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [credits, setCredits] = useState<UserCredits>({ total: 0, expiration: "" })

  useEffect(() => {
    // Carregar pagamentos e créditos
    const userPayments = getPayments()
    const userCredits = getUserCredits()

    setPayments(userPayments)
    setCredits(userCredits)
  }, [])

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container py-6">
          <h1 className="text-2xl font-bold mb-6">Pagamentos</h1>

          <Tabs defaultValue="metodos" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="metodos">Métodos de Pagamento</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="metodos" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Meus Métodos de Pagamento</h2>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      PIX
                    </CardTitle>
                    <CardDescription>
                      <span className="text-green-600 font-medium">Ativo</span>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Chave: ***@email.com</p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="ml-auto">
                    Editar
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Cartão de Crédito
                    </CardTitle>
                    <CardDescription>
                      <span className="text-green-600 font-medium">Ativo</span>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">**** **** **** 5678</p>
                  <p className="text-sm text-muted-foreground">Validade: 12/27</p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="ml-auto">
                    Editar
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Crédito Social
                    </CardTitle>
                    <CardDescription>
                      <span className="text-green-600 font-medium">Ativo</span>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Saldo: {credits.total} créditos</p>
                  <p className="text-sm text-muted-foreground">Válido até: {credits.expiration}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="ml-auto">
                    Detalhes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="historico" className="space-y-4 mt-4">
              <h2 className="text-lg font-medium">Histórico de Pagamentos</h2>

              {payments.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Você ainda não realizou nenhum pagamento.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <Card key={payment.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">
                            {payment.date} - {payment.time}
                          </CardTitle>
                          <CardDescription>
                            <span className="font-medium">{payment.amount}</span>
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm">{payment.description}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {payment.paymentMethod === "PIX" ? (
                            <Wallet className="h-4 w-4" />
                          ) : payment.paymentMethod === "Cartão" ? (
                            <CreditCard className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                          <p className="text-sm text-muted-foreground">Pago com {payment.paymentMethod}</p>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="ghost" size="sm" className="ml-auto">
                          Recibo
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}
