"use client"

import { useState, useEffect } from "react"
import { MapPin, Phone, MessageSquare, Clock, X, CheckCircle, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

interface RideTrackingProps {
  rideDetails: {
    origin: string
    destination: string
    passengers: number
    paymentMethod: string
    driver?: {
      name: string
      rating: number
    }
    plate?: string
  }
  onCancel: () => void
  onComplete: () => void
  rideStage?: "searching" | "found" | "arriving" | "pickup" | "journey" | "complete"
}

export function RideTracking({ rideDetails, onCancel, onComplete, rideStage = "searching" }: RideTrackingProps) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("Procurando van...")
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)
  const [cancelable, setCancelable] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Atualizar o estado com base no estágio da viagem
  useEffect(() => {
    switch (rideStage) {
      case "searching":
        setProgress(10)
        setStatus("Procurando van...")
        setEstimatedTime(null)
        setCancelable(true)
        setCompleted(false)
        break
      case "found":
        setProgress(30)
        setStatus("Van encontrada!")
        setEstimatedTime(8)
        setCancelable(true)
        setCompleted(false)
        break
      case "arriving":
        setProgress(50)
        setStatus("Van a caminho")
        setEstimatedTime(5)
        setCancelable(true)
        setCompleted(false)
        break
      case "pickup":
        setProgress(75)
        setStatus("Van chegou!")
        setEstimatedTime(0)
        setCancelable(false)
        setCompleted(false)
        break
      case "journey":
        setProgress(85)
        setStatus("Em viagem")
        setEstimatedTime(10)
        setCancelable(false)
        setCompleted(false)
        break
      case "complete":
        setProgress(100)
        setStatus("Chegou ao destino")
        setEstimatedTime(0)
        setCompleted(true)
        break
    }
  }, [rideStage])

  if (completed) {
    return (
      <Card className="w-full max-w-md mx-auto bg-primary/10 z-[900]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Viagem concluída!
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2 text-center">
          <div className="py-6 space-y-4">
            <p className="text-xl font-medium">Obrigado por usar o MobiComunidade!</p>
            <p className="text-muted-foreground">Esperamos que tenha tido uma ótima viagem.</p>
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 bg-muted p-3 rounded-md">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Duração da viagem</p>
                  <p>15 minutos</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onComplete} className="w-full">
            Concluir
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto z-[900] bg-white/95 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-1 pt-3">
        <CardTitle className="text-base flex justify-between items-center">
          <span>{status}</span>
          <div className="flex items-center gap-2">
            {cancelable && (
              <Button variant="ghost" size="icon" onClick={onCancel} className="h-7 w-7">
                <X className="h-4 w-4" />
                <span className="sr-only">Cancelar</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-7 w-7">
              {isExpanded ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              )}
              <span className="sr-only">Expandir</span>
            </Button>
          </div>
        </CardTitle>
        <Progress value={progress} className="h-2 mt-1" />
      </CardHeader>

      {isExpanded && (
        <>
          <CardContent className="pb-2 pt-2">
            <div className="space-y-3">
              {rideDetails.driver && rideStage !== "searching" && (
                <div className="flex items-center gap-3 border-b pb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg?height=40&width=40" alt={rideDetails.driver.name} />
                    <AvatarFallback>
                      {rideDetails.driver.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{rideDetails.driver.name}</p>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-500 mr-1" />
                      <span className="text-sm">{rideDetails.driver.rating}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Van {rideDetails.plate}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="rounded-full h-8 w-8">
                      <Phone className="h-4 w-4" />
                      <span className="sr-only">Ligar</span>
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full h-8 w-8">
                      <MessageSquare className="h-4 w-4" />
                      <span className="sr-only">Mensagem</span>
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-medium">De</p>
                    <p className="text-sm">{rideDetails.origin}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-destructive mt-0.5" />
                  <div>
                    <p className="text-xs font-medium">Para</p>
                    <p className="text-sm">{rideDetails.destination}</p>
                  </div>
                </div>
              </div>

              {estimatedTime !== null && (
                <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs font-medium">Tempo estimado</p>
                    <p className="text-sm">{estimatedTime} minutos</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-0 pb-3">
            <div className="w-full flex items-center justify-between text-xs">
              <div>
                <p className="font-medium">Passageiros: {rideDetails.passengers}</p>
              </div>
              <div>
                <p className="font-medium">
                  Pagamento:{" "}
                  {rideDetails.paymentMethod === "pix"
                    ? "PIX"
                    : rideDetails.paymentMethod === "card"
                      ? "Cartão"
                      : "Crédito Social"}
                </p>
              </div>
            </div>
          </CardFooter>
        </>
      )}

      {!isExpanded && estimatedTime !== null && (
        <CardContent className="py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-primary" />
              <p className="text-sm">{estimatedTime} min</p>
            </div>
            {rideDetails.driver && (
              <div className="flex items-center gap-1">
                <span className="text-sm">{rideDetails.driver.name}</span>
                <Avatar className="h-6 w-6">
                  <AvatarFallback>
                    {rideDetails.driver.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
