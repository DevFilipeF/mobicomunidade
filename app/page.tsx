"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { MapView } from "@/components/map-view"
import { RideRequestModal } from "@/components/ride-request-modal"
import { RideTracking } from "@/components/ride-tracking"
import { PaymentModal } from "@/components/payment-modal"
import { AvailableVansModal } from "@/components/available-vans-modal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { saveTrip, savePayment, spendCredits } from "@/services/user-service"

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVansModalOpen, setIsVansModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [rideRequested, setRideRequested] = useState(false)
  const [rideDetails, setRideDetails] = useState<{
    origin: string
    destination: string
    originCoords: [number, number]
    destinationCoords: [number, number]
    passengers: number
    paymentMethod: string
    driver?: {
      name: string
      rating: number
    }
    plate?: string
  } | null>(null)
  const [mapError, setMapError] = useState(false)
  const [vanPosition, setVanPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [rideStage, setRideStage] = useState<"searching" | "found" | "arriving" | "pickup" | "journey" | "complete">(
    "searching",
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Coordenadas padrão para o Rio de Janeiro
  const [userLocation, setUserLocation] = useState<[number, number]>([-22.9068, -43.1729])

  // Obter a localização do usuário de forma segura
  useEffect(() => {
    // Já definimos uma localização padrão, então o app funcionará mesmo sem geolocalização
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const successCallback = (position: GeolocationPosition) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        }

        const errorCallback = (error: GeolocationPositionError) => {
          // Silenciosamente falhar e manter a localização padrão
          console.log("Usando localização padrão:", error.message)
        }

        navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        })
      } catch (error) {
        // Silenciosamente falhar e manter a localização padrão
        console.log("Erro ao acessar geolocalização:", error)
      }
    }
  }, [])

  // Simular movimento da van quando a viagem estiver em andamento
  useEffect(() => {
    if (!rideRequested || !rideDetails) return

    // Iniciar a simulação da van procurando
    setRideStage("searching")

    // Após 3 segundos, a van é encontrada e começa a se mover
    const timer1 = setTimeout(() => {
      setRideStage("found")

      // Após 2 segundos, a van começa a se aproximar
      setTimeout(() => {
        setRideStage("arriving")

        // Após 15 segundos, a van chega ao ponto de embarque
        setTimeout(() => {
          setRideStage("pickup")

          // Após 3 segundos no ponto de embarque, iniciar a viagem
          setTimeout(() => {
            setRideStage("journey")

            // Após 15 segundos, a viagem é concluída
            setTimeout(() => {
              setRideStage("complete")

              // Atualizar o status da viagem para "Concluída"
              const trips = JSON.parse(localStorage.getItem("mobiTrips") || "[]")
              if (trips.length > 0) {
                trips[0].status = "Concluída"
                localStorage.setItem("mobiTrips", JSON.stringify(trips))
              }
            }, 15000)
          }, 3000)
        }, 15000)
      }, 2000)
    }, 3000)

    return () => {
      clearTimeout(timer1)
    }
  }, [rideRequested, rideDetails])

  const handleRequestRide = () => {
    setIsModalOpen(true)
  }

  const handleConfirmRideDetails = (details: {
    origin: string
    destination: string
    originCoords: [number, number]
    destinationCoords: [number, number]
    passengers: number
    paymentMethod: string
  }) => {
    setRideDetails(details)
    setIsModalOpen(false)
    setIsVansModalOpen(true)
  }

  const handleSelectVan = (van: any) => {
    if (rideDetails) {
      setRideDetails({
        ...rideDetails,
        driver: {
          name: van.driver.name,
          rating: van.driver.rating,
        },
        plate: van.plate,
      })
    }
    setIsVansModalOpen(false)
    setIsPaymentModalOpen(true)
  }

  const handleConfirmPayment = () => {
    if (!rideDetails) return

    // Verificar se tem créditos suficientes se o método de pagamento for crédito social
    if (rideDetails.paymentMethod === "social") {
      const success = spendCredits(7) // Gastar 7 créditos
      if (!success) {
        setErrorMessage("Créditos insuficientes. Por favor, escolha outro método de pagamento.")
        setIsPaymentModalOpen(false)
        setTimeout(() => setErrorMessage(null), 5000)
        return
      }
    }

    setIsPaymentModalOpen(false)
    setRideRequested(true)

    // Salvar a viagem no histórico
    const now = new Date()
    const tripId = `trip_${Date.now()}`

    // Salvar a viagem no histórico
    saveTrip({
      id: tripId,
      date: now.toLocaleDateString("pt-BR"),
      time: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      origin: rideDetails.origin,
      destination: rideDetails.destination,
      amount: rideDetails.paymentMethod === "social" ? "7 créditos" : "R$ 8,50",
      paymentMethod:
        rideDetails.paymentMethod === "pix"
          ? "PIX"
          : rideDetails.paymentMethod === "card"
            ? "Cartão"
            : "Crédito Social",
      status: "Em andamento",
      driver: rideDetails.driver,
      duration: "~25 min",
    })

    // Salvar o pagamento no histórico
    savePayment({
      id: `payment_${Date.now()}`,
      date: now.toLocaleDateString("pt-BR"),
      time: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      amount: rideDetails.paymentMethod === "social" ? "7 créditos" : "R$ 8,50",
      paymentMethod:
        rideDetails.paymentMethod === "pix"
          ? "PIX"
          : rideDetails.paymentMethod === "card"
            ? "Cartão"
            : "Crédito Social",
      description: `Viagem: ${rideDetails.origin.substring(0, 15)}... → ${rideDetails.destination.substring(0, 15)}...`,
      status: "Concluído",
    })
  }

  const handleCancelRide = () => {
    setRideRequested(false)
    setRideDetails(null)
    setVanPosition(null)
    setRideStage("searching")
  }

  const handleCompleteRide = () => {
    setRideRequested(false)
    setRideDetails(null)
    setVanPosition(null)
    setRideStage("searching")
  }

  // Função para atualizar a posição da van a partir do mapa
  const handleVanPositionChange = (position: { lat: number; lng: number }) => {
    setVanPosition(position)
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 relative">
          {mapError && (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>
                Não foi possível carregar o mapa. Verifique sua conexão e tente novamente.
              </AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert variant="destructive" className="absolute top-4 left-4 right-4 z-[1001]">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <MapView
            onRequestRide={handleRequestRide}
            origin={rideDetails?.origin}
            destination={rideDetails?.destination}
            originCoords={rideDetails?.originCoords}
            destinationCoords={rideDetails?.destinationCoords}
            showRoute={!!rideDetails}
            vanPosition={vanPosition}
            rideStage={rideStage}
            onVanPositionChange={handleVanPositionChange}
          />

          {rideRequested && rideDetails && (
            <div className="absolute bottom-4 left-4 right-4 z-[1001] max-w-md mx-auto">
              <RideTracking
                rideDetails={rideDetails}
                onCancel={handleCancelRide}
                onComplete={handleCompleteRide}
                rideStage={rideStage}
              />
            </div>
          )}

          <RideRequestModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onConfirm={handleConfirmRideDetails}
            userLocation={userLocation}
          />

          <AvailableVansModal open={isVansModalOpen} onOpenChange={setIsVansModalOpen} onSelectVan={handleSelectVan} />

          <PaymentModal
            open={isPaymentModalOpen}
            onOpenChange={setIsPaymentModalOpen}
            onConfirm={handleConfirmPayment}
            amount={rideDetails?.paymentMethod === "social" ? "7 créditos" : "R$ 8,50"}
            paymentMethod={rideDetails?.paymentMethod || "pix"}
          />
        </main>
      </div>
    </ProtectedRoute>
  )
}
