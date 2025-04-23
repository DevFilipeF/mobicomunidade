// Serviço para roteamento usando OSRM (Open Source Routing Machine)
export interface RouteResult {
  coordinates: [number, number][]
  distance: number
  duration: number
}

// Função para obter rota entre dois pontos
export async function getRoute(origin: [number, number], destination: [number, number]): Promise<RouteResult> {
  try {
    // Formato: lon,lat para OSRM
    const originStr = `${origin[1]},${origin[0]}`
    const destinationStr = `${destination[1]},${destination[0]}`

    // Criar um controller para abortar a requisição após um timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 segundos de timeout

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${originStr};${destinationStr}?overview=full&geometries=geojson`,
        {
          headers: {
            "User-Agent": "MobiComunidade/1.0",
          },
          signal: controller.signal,
        },
      )

      // Limpar o timeout
      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()

        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          const route = data.routes[0]
          const coordinates = route.geometry.coordinates.map(
            (coord: [number, number]) =>
              // Converter de [lon, lat] para [lat, lon] que é o formato usado pelo Leaflet
              [coord[1], coord[0]] as [number, number],
          )

          return {
            coordinates,
            distance: route.distance, // em metros
            duration: route.duration, // em segundos
          }
        }
      }

      // Se chegou aqui, algo deu errado com a resposta
      console.log("Resposta inválida do serviço de rotas, usando rota simulada")
      throw new Error("Resposta inválida")
    } catch (error) {
      // Limpar o timeout em caso de erro
      clearTimeout(timeoutId)

      // Se falhar a chamada à API, gerar uma rota simulada
      console.log("Erro ao acessar serviço de rotas, usando rota simulada:", error)
      return generateSimulatedRoute(origin, destination)
    }
  } catch (error) {
    console.error("Erro ao obter rota:", error)
    // Sempre retornar uma rota simulada em caso de erro
    return generateSimulatedRoute(origin, destination)
  }
}

// Função para gerar uma rota simulada entre dois pontos
function generateSimulatedRoute(start: [number, number], end: [number, number]): RouteResult {
  const points: [number, number][] = []
  const latDiff = end[0] - start[0]
  const lngDiff = end[1] - start[1]

  // Calcular distância aproximada em metros (fórmula de Haversine simplificada)
  const R = 6371e3 // raio da Terra em metros
  const φ1 = (start[0] * Math.PI) / 180
  const φ2 = (end[0] * Math.PI) / 180
  const Δφ = ((end[0] - start[0]) * Math.PI) / 180
  const Δλ = ((end[1] - start[1]) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  // Estimar duração (assumindo velocidade média de 30 km/h = 8.33 m/s)
  const duration = distance / 8.33

  // Número de pontos baseado na distância
  const numPoints = Math.max(10, Math.min(30, Math.floor(distance / 500)))

  // Adicionar ponto inicial
  points.push(start)

  // Adicionar pontos intermediários com pequenos desvios
  for (let i = 1; i < numPoints; i++) {
    const progress = i / numPoints
    // Desvio senoidal para simular curvas de rua
    const randomDeviation = 0.0005 * Math.sin(progress * Math.PI * 4)
    // Desvio adicional aleatório para simular imperfeições
    const randomNoise = (Math.random() - 0.5) * 0.0003

    const lat = start[0] + latDiff * progress + randomDeviation + randomNoise
    const lng = start[1] + lngDiff * progress + randomDeviation + randomNoise

    points.push([lat, lng])
  }

  // Adicionar ponto final
  points.push(end)

  return {
    coordinates: points,
    distance,
    duration,
  }
}
