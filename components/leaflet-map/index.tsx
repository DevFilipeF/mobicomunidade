"use client"

import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"

// Componente para controlar o mapa
function MapControls({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap()

  useEffect(() => {
    if (zoom) {
      map.setView(center, zoom)
    } else {
      map.setView(center)
    }
  }, [center, zoom, map])

  return null
}

// Componente para renderizar a rota
function RouteDisplay({
  points,
  rideStage,
}: {
  points: [number, number][]
  rideStage: string
}) {
  // Determinar a cor e o estilo da rota com base no estágio da viagem
  let color = "#3b82f6" // Azul padrão
  let opacity = 0.8
  let weight = 5

  if (rideStage === "arriving" || rideStage === "found") {
    // Rota até o ponto de embarque
    color = "#8b5cf6" // Roxo
    opacity = 0.7
    weight = 4
  } else if (rideStage === "journey") {
    // Rota até o destino
    color = "#3b82f6" // Azul
    opacity = 0.8
    weight = 5
  } else if (rideStage === "complete") {
    // Rota completa
    color = "#10b981" // Verde
    opacity = 0.6
    weight = 4
  }

  return (
    <>
      {/* Sombra da rota para efeito de profundidade */}
      <Polyline
        positions={points}
        color="#000"
        weight={weight + 3}
        opacity={0.15}
        lineJoin="round"
        lineCap="round"
        className="route-shadow"
      />

      {/* Rota principal */}
      <Polyline
        positions={points}
        color={color}
        weight={weight}
        opacity={opacity}
        lineJoin="round"
        lineCap="round"
        className="route-main"
      />

      {/* Efeito de brilho na rota */}
      <Polyline
        positions={points}
        color="#fff"
        weight={2}
        opacity={0.4}
        lineJoin="round"
        lineCap="round"
        className="route-glow"
      />
    </>
  )
}

// Componente para animar o movimento da van
function AnimatedVanMarker({
  routePoints,
  vanIcon,
  rideStage,
  onPositionChange,
}: {
  routePoints: [number, number][]
  vanIcon: L.Icon | null
  rideStage: string
  onPositionChange: (position: [number, number]) => void
}) {
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null)
  const [currentPointIndex, setCurrentPointIndex] = useState(0)
  const [lastTimestamp, setLastTimestamp] = useState(0)
  const animationRef = useRef<number | null>(null)
  const map = useMap()
  const animationSpeed = useRef(0.5) // Velocidade da animação (pontos por frame)
  const lastCameraUpdate = useRef(0) // Controlar a frequência de atualização da câmera
  const cameraUpdateInterval = 1000 // Atualizar a câmera a cada 1 segundo

  // Função para calcular a rotação do ícone com base na direção do movimento
  const calculateRotation = (from: [number, number], to: [number, number]): number => {
    const dx = to[1] - from[1]
    const dy = to[0] - from[0]
    return (Math.atan2(dy, dx) * 180) / Math.PI
  }

  // Função para animar o movimento da van com interpolação suave
  const animateMovement = (timestamp: number) => {
    if (routePoints.length < 2 || currentPointIndex >= routePoints.length - 1) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    // Calcular delta de tempo para animação suave
    if (!lastTimestamp) {
      setLastTimestamp(timestamp)
      animationRef.current = requestAnimationFrame(animateMovement)
      return
    }

    const deltaTime = timestamp - lastTimestamp
    setLastTimestamp(timestamp)

    // Ajustar velocidade com base no estágio da viagem
    if (rideStage === "arriving") {
      animationSpeed.current = 0.004 // Mais lento quando está chegando
    } else if (rideStage === "journey") {
      animationSpeed.current = 0.006 // Mais rápido durante a viagem
    }

    // Obter pontos atual e próximo
    const startPoint = routePoints[currentPointIndex]
    const endPoint = routePoints[currentPointIndex + 1]

    // Calcular a distância entre os pontos
    const latDiff = endPoint[0] - startPoint[0]
    const lngDiff = endPoint[1] - startPoint[1]
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)

    // Calcular o progresso com base na velocidade e no tempo
    const step = animationSpeed.current * deltaTime * 0.01
    const progress = Math.min(step / distance, 1)

    // Calcular a nova posição interpolada
    const newLat = startPoint[0] + latDiff * progress
    const newLng = startPoint[1] + lngDiff * progress
    const newPosition: [number, number] = [newLat, newLng]

    // Calcular a rotação para o ícone da van
    const rotation = calculateRotation(startPoint, endPoint)

    // Atualizar a rotação do ícone (se possível)
    if (vanIcon) {
      const vanElement = document.querySelector(".van-icon-with-logo") as HTMLElement
      if (vanElement) {
        vanElement.style.transform = `rotate(${rotation}deg)`
      }
    }

    // Atualizar a posição atual
    setCurrentPosition(newPosition)
    onPositionChange(newPosition)

    // Centralizar o mapa na van durante a animação, mas com menos frequência para evitar tremores
    const now = Date.now()
    if (now - lastCameraUpdate.current > cameraUpdateInterval) {
      if (rideStage === "arriving" || rideStage === "journey") {
        // Usar flyTo em vez de setView para uma transição mais suave
        map.flyTo(newPosition, map.getZoom(), {
          duration: 1, // Duração da animação em segundos
          easeLinearity: 0.5, // Suavidade da animação
        })
      }
      lastCameraUpdate.current = now
    }

    // Se chegou ao final do segmento atual, avançar para o próximo ponto
    if (progress >= 1) {
      setCurrentPointIndex(currentPointIndex + 1)
    }

    // Continuar a animação
    animationRef.current = requestAnimationFrame(animateMovement)
  }

  // Iniciar a animação quando os pontos da rota mudarem ou o estágio da viagem mudar
  useEffect(() => {
    if (routePoints.length > 0 && (rideStage === "arriving" || rideStage === "journey")) {
      // Definir a posição inicial
      if (!currentPosition) {
        setCurrentPosition(routePoints[0])
        onPositionChange(routePoints[0])
      }

      // Iniciar a animação
      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(animateMovement)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [routePoints, rideStage])

  // Resetar a animação quando o estágio da viagem mudar
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (rideStage === "arriving" && !hasInitialized.current) {
      hasInitialized.current = true
      setCurrentPointIndex(0)
      setLastTimestamp(0)

      if (routePoints.length > 0) {
        setCurrentPosition(routePoints[0])
        onPositionChange(routePoints[0])

        const bounds = L.latLngBounds(routePoints)
        map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1 })
      }
    } else if (rideStage === "journey" && !hasInitialized.current && routePoints.length > 0) {
      hasInitialized.current = true
      const midPoint = Math.floor(routePoints.length / 2)
      setCurrentPointIndex(midPoint)
      setLastTimestamp(0)
      setCurrentPosition(routePoints[midPoint])
      onPositionChange(routePoints[midPoint])

      const bounds = L.latLngBounds(routePoints)
      map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1 })
    }
  }, [rideStage, routePoints, onPositionChange])

  
  // Não renderizar nada, apenas controlar a animação
  return null
}

interface LeafletMapProps {
  userLocation: [number, number]
  destination?: [number, number]
  showRoute?: boolean
  vanPosition?: [number, number] | null
  onRequestRide?: () => void
  rideStage?: string
  onVanPositionChange?: (position: [number, number]) => void
}

export function LeafletMap({
  userLocation,
  destination,
  showRoute = false,
  vanPosition = null,
  onRequestRide,
  rideStage = "",
  onVanPositionChange,
}: LeafletMapProps) {
  const [isMapReady, setIsMapReady] = useState(false)
  const mapRef = useRef<L.Map | null>(null)
  const [vanIcon, setVanIcon] = useState<L.Icon | null>(null)
  const [routePoints, setRoutePoints] = useState<[number, number][]>([])
  const [pickupRoutePoints, setPickupRoutePoints] = useState<[number, number][]>([])
  const [journeyRoutePoints, setJourneyRoutePoints] = useState<[number, number][]>([])
  const [currentVanPosition, setCurrentVanPosition] = useState<[number, number] | null>(null)
  const [showMarkers, setShowMarkers] = useState(true)
  const [mapStyle, setMapStyle] = useState("osm")
  const [mapZoom, setMapZoom] = useState<number | undefined>(15)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [routeCalculated, setRouteCalculated] = useState({
    pickup: false,
    journey: false,
  })

  // Corrigir o problema dos ícones do Leaflet no Next.js
  useEffect(() => {
    // Apenas execute no lado do cliente
    if (typeof window !== "undefined") {
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      })

      // Criar ícone personalizado para a van com logo
      setVanIcon(
        new L.Icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/2554/2554936.png",
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20],
          className: "van-icon-with-logo" + (rideStage === "journey" ? " van-moving" : ""),
        }),
      )
    }
  }, [rideStage])

  // Gerar uma posição inicial aleatória para a van
  const generateRandomVanStartPosition = (userLoc: [number, number]): [number, number] => {
    // Gerar uma posição aleatória dentro de um raio de 1-3km do usuário
    const radius = 0.01 + Math.random() * 0.02 // 0.01 graus ≈ 1km
    const angle = Math.random() * Math.PI * 2 // Ângulo aleatório em radianos

    // Calcular deslocamento usando coordenadas polares
    const latOffset = radius * Math.sin(angle)
    const lngOffset = radius * Math.cos(angle)

    // Aplicar deslocamento à posição do usuário
    return [userLoc[0] + latOffset, userLoc[1] + lngOffset]
  }

  // Obter rota quando o destino mudar
  useEffect(() => {
    if (showRoute && destination) {
      const fetchRoute = async () => {
        // Verificar se já calculamos a rota para evitar recálculos desnecessários
        if (!routeCalculated.pickup) {
          setIsLoadingRoute(true)
          try {
            // Gerar uma posição inicial aleatória para a van
            const randomVanStart = generateRandomVanStartPosition(userLocation)

            // Usar diretamente rotas simuladas para evitar problemas de API
            // Isso garante que a aplicação funcione mesmo sem acesso à internet
            const pickupRoute = generateRoutePoints(randomVanStart, userLocation, 15)
            const journeyRoute = generateRoutePoints(userLocation, destination, 20)

            // Rota até o ponto de embarque
            setPickupRoutePoints(pickupRoute)

            // Rota até o destino
            setJourneyRoutePoints(journeyRoute)

            // Rota completa (combinada)
            setRoutePoints([...pickupRoute, ...journeyRoute])

            // Definir a posição inicial da van
            if (!currentVanPosition && pickupRoute.length > 0) {
              setCurrentVanPosition(pickupRoute[0])
              if (onVanPositionChange) {
                onVanPositionChange(pickupRoute[0])
              }
            }

            // Ajustar o zoom para mostrar a rota de pickup inicialmente
            if (mapRef.current) {
              const bounds = L.latLngBounds([randomVanStart, userLocation])
              mapRef.current.fitBounds(bounds, {
                padding: [50, 50],
                animate: true,
                duration: 1, // Duração da animação em segundos
              })
            }

            // Marcar a rota como calculada
            setRouteCalculated((prev) => ({ ...prev, pickup: true }))
          } catch (error) {
            console.error("Erro ao calcular rotas:", error)
            // Em caso de erro, usar rotas simuladas
            generateSimulatedRoutes(userLocation, destination)
          } finally {
            setIsLoadingRoute(false)
          }
        }
      }

      fetchRoute()
    } else {
      setRoutePoints([])
      setPickupRoutePoints([])
      setJourneyRoutePoints([])
      setRouteCalculated({ pickup: false, journey: false })
    }
  }, [showRoute, destination, userLocation, onVanPositionChange, routeCalculated.pickup])

  // Função para gerar rotas simuladas
  const generateSimulatedRoutes = (start: [number, number], end: [number, number]) => {
    // Gerar uma posição inicial aleatória para a van
    const randomVanStart = generateRandomVanStartPosition(start)

    // Gerar uma rota simulada para a van chegar até o usuário
    const pickupPoints = generateRoutePoints(randomVanStart, start, 15)
    setPickupRoutePoints(pickupPoints)

    // Gerar uma rota simulada do usuário até o destino
    const journeyPoints = generateRoutePoints(start, end, 20)
    setJourneyRoutePoints(journeyPoints)

    // Combinar as rotas
    const allPoints = [...pickupPoints, ...journeyPoints]
    setRoutePoints(allPoints)

    // Definir a posição inicial da van
    if (!currentVanPosition && pickupPoints.length > 0) {
      setCurrentVanPosition(pickupPoints[0])
      if (onVanPositionChange) {
        onVanPositionChange(pickupPoints[0])
      }
    }

    // Marcar a rota como calculada
    setRouteCalculated({ pickup: true, journey: true })

    // Ajustar o zoom para mostrar a rota de pickup inicialmente
    if (mapRef.current) {
      const bounds = L.latLngBounds([randomVanStart, start])
      mapRef.current.fitBounds(bounds, {
        padding: [50, 50],
        animate: true,
        duration: 1,
      })
    }
  }

  // Função para gerar pontos de rota com desvios aleatórios (para fallback)
  const generateRoutePoints = (start: [number, number], end: [number, number], steps: number): [number, number][] => {
    const points: [number, number][] = []
    const latDiff = end[0] - start[0]
    const lngDiff = end[1] - start[1]

    // Adicionar ponto inicial
    points.push(start)

    // Adicionar pontos intermediários com pequenos desvios
    for (let i = 1; i < steps; i++) {
      const progress = i / steps
      const randomDeviation = 0.0005 * Math.sin(progress * Math.PI * 4) // Desvio senoidal
      const randomNoise = (Math.random() - 0.5) * 0.0003 // Ruído aleatório

      const lat = start[0] + latDiff * progress + randomDeviation + randomNoise
      const lng = start[1] + lngDiff * progress + randomDeviation + randomNoise

      points.push([lat, lng])
    }

    // Adicionar ponto final
    points.push(end)

    return points
  }

  // Ajustar o mapa quando a van chegar ou a viagem mudar de estágio
  useEffect(() => {
    if (mapRef.current && destination) {
      if (rideStage === "pickup") {
        // Quando a van chegar, ajustar o mapa para mostrar a localização do usuário
        mapRef.current.flyTo(userLocation, 16, {
          animate: true,
          duration: 1.5, // Duração da animação em segundos
        })
      } else if (rideStage === "journey") {
        // Quando a viagem começar, ajustar o mapa para mostrar a rota completa
        const bounds = L.latLngBounds([userLocation, destination])
        mapRef.current.fitBounds(bounds, {
          padding: [50, 50],
          animate: true,
          duration: 1.5, // Duração da animação em segundos
        })

        // Calcular a rota de jornada se ainda não foi calculada
        if (!routeCalculated.journey) {
          setIsLoadingRoute(true)
          setTimeout(() => {
            setRouteCalculated((prev) => ({ ...prev, journey: true }))
            setIsLoadingRoute(false)
          }, 1000)
        }
      } else if (rideStage === "complete") {
        // Quando a viagem terminar, ajustar o mapa para mostrar o destino
        mapRef.current.flyTo(destination, 16, {
          animate: true,
          duration: 1.5, // Duração da animação em segundos
        })

        // Esconder os marcadores após um breve atraso
        setTimeout(() => {
          setShowMarkers(false)
        }, 3000)
      }
    }
  }, [rideStage, userLocation, destination, routeCalculated.journey])

  // Atualizar a posição da van quando ela mudar
  const handleVanPositionChange = (position: [number, number]) => {
    setCurrentVanPosition(position)
    if (onVanPositionChange) {
      onVanPositionChange(position)
    }
  }

  // Alternar entre estilos de mapa
  const toggleMapStyle = () => {
    if (mapStyle === "osm") {
      setMapStyle("osm-dark")
    } else if (mapStyle === "osm-dark") {
      setMapStyle("osm-humanitarian")
    } else if (mapStyle === "osm-humanitarian") {
      setMapStyle("osm-topo")
    } else {
      setMapStyle("osm")
    }
  }

  // Função para obter a URL do tile com base no estilo selecionado
  const getTileUrl = () => {
    switch (mapStyle) {
      case "osm-dark":
        return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      case "osm-humanitarian":
        return "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
      case "osm-topo":
        return "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
      default:
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    }
  }

  // Função para obter a atribuição do tile com base no estilo selecionado
  const getTileAttribution = () => {
    switch (mapStyle) {
      case "osm-dark":
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      case "osm-humanitarian":
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
      case "osm-topo":
        return 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  }

  if (typeof window === "undefined") {
    return null // Não renderizar nada no servidor
  }

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={userLocation}
        zoom={15}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        whenReady={() => setIsMapReady(true)}
        ref={mapRef}
        zoomControl={false}
        className="map-container"
        // Desativar animações de zoom para evitar tremores
        zoomAnimation={false}
      >
        {/* Mapa usando OpenStreetMap (gratuito) */}
        <TileLayer attribution={getTileAttribution()} url={getTileUrl()} />

        {/* Adicionar controles de zoom em uma posição melhor */}
        <ZoomControl position="bottomright" />

        {/* Marcador da localização do usuário */}
        {showMarkers && (
          <Marker
            position={userLocation}
            icon={
              new L.Icon({
                iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                iconSize: [30, 30],
                iconAnchor: [15, 15],
                popupAnchor: [0, -15],
                className: "user-location-icon pulse-effect",
              })
            }
          >
            <Popup>Sua localização atual</Popup>
          </Marker>
        )}

        {/* Marcador do destino */}
        {showMarkers && destination && (
          <Marker
            position={destination}
            icon={
              new L.Icon({
                iconUrl: "https://cdn-icons-png.flaticon.com/512/484/484167.png",
                iconSize: [30, 30],
                iconAnchor: [15, 15],
                popupAnchor: [0, -15],
                className: "destination-icon",
              })
            }
          >
            <Popup>Seu destino</Popup>
          </Marker>
        )}

        {/* Rota da van até o usuário */}
        {showRoute && rideStage === "arriving" && pickupRoutePoints.length > 0 && (
          <RouteDisplay points={pickupRoutePoints} rideStage={rideStage} />
        )}

        {/* Rota do usuário até o destino */}
        {showRoute && (rideStage === "journey" || rideStage === "complete") && journeyRoutePoints.length > 0 && (
          <RouteDisplay points={journeyRoutePoints} rideStage={rideStage} />
        )}

        {/* Componente para animar o movimento da van */}
        {showRoute && (rideStage === "arriving" || rideStage === "journey") && (
          <AnimatedVanMarker
            routePoints={rideStage === "arriving" ? pickupRoutePoints : journeyRoutePoints}
            vanIcon={vanIcon}
            rideStage={rideStage}
            onPositionChange={handleVanPositionChange}
          />
        )}

        {/* Marcador da van */}
        {showMarkers && currentVanPosition && vanIcon && (rideStage === "arriving" || rideStage === "journey") && (
          <Marker position={currentVanPosition} icon={vanIcon}>
            <Popup className="custom-popup">
              <div className="p-2">
                <h3 className="font-medium text-sm">Sua van está a caminho</h3>
                <p className="text-xs text-muted-foreground">Chegando em breve</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Controles do mapa */}
        <MapControls center={userLocation} zoom={mapZoom} />
      </MapContainer>

      {/* Botão para alternar estilo do mapa */}
      <div className="absolute top-4 right-4 z-[900]">
        <Button onClick={toggleMapStyle} variant="secondary" size="sm" className="bg-white/90 hover:bg-white shadow-md">
          Mudar Estilo
        </Button>
      </div>

      {/* Indicador de carregamento da rota */}
      {isLoadingRoute && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[900] bg-white/80 p-3 rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm mt-2">Calculando rota...</p>
        </div>
      )}

      {/* Botão de solicitar van */}
      {!showRoute && !destination && onRequestRide && isMapReady && (
        <div className="absolute bottom-4 left-4 right-4 z-[10] max-w-md mx-auto">
          <Button onClick={onRequestRide} className="w-full py-6 text-lg shadow-lg hover:shadow-xl transition-all">
            Solicitar Van
          </Button>
        </div>
      )}
    </div>
  )
}

export default LeafletMap
