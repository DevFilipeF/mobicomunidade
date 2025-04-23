// Serviço para geocodificação usando OpenStreetMap Nominatim
export interface GeocodingResult {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  boundingbox: string[]
  lat: string
  lon: string
  display_name: string
  class: string
  type: string
  importance: number
}

// Função para buscar endereços usando Nominatim
export async function searchAddress(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 3) {
    return []
  }

  try {
    // Adicionar um pequeno atraso para evitar muitas requisições durante a digitação
    await new Promise((resolve) => setTimeout(resolve, 300))

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          "Accept-Language": "pt-BR",
          "User-Agent": "MobiComunidade/1.0",
        },
      },
    )

    if (!response.ok) {
      throw new Error("Falha ao buscar endereços")
    }

    const data: GeocodingResult[] = await response.json()
    return data
  } catch (error) {
    console.error("Erro ao buscar endereços:", error)
    return []
  }
}

// Função para obter coordenadas a partir de um endereço
export async function getCoordinates(address: string): Promise<[number, number] | null> {
  try {
    const results = await searchAddress(address)
    if (results.length > 0) {
      const { lat, lon } = results[0]
      return [Number.parseFloat(lat), Number.parseFloat(lon)]
    }
    return null
  } catch (error) {
    console.error("Erro ao obter coordenadas:", error)
    return null
  }
}

// Função para obter endereço a partir de coordenadas (geocodificação reversa)
export async function getAddressFromCoordinates(lat: number, lon: number): Promise<string | null> {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
      headers: {
        "Accept-Language": "pt-BR",
        "User-Agent": "MobiComunidade/1.0",
      },
    })

    if (!response.ok) {
      throw new Error("Falha ao buscar endereço")
    }

    const data = await response.json()
    return data.display_name || null
  } catch (error) {
    console.error("Erro ao obter endereço:", error)
    return null
  }
}
