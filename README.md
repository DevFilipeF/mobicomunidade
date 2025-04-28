# MobiComunidade

**MobiComunidade** é um protótipo de aplicativo web de transporte comunitário, inspirado no modelo Uber, mas voltado para conectar vizinhos e comunidades locais para viagens compartilhadas.

## 📱 Sobre o Projeto

O objetivo do MobiComunidade é oferecer uma solução de mobilidade simples, rápida e acessível dentro de comunidades, bairros e pequenas cidades.  
Este projeto foi desenvolvido como protótipo para estudos em React, JavaScript, integração de mapas e rotas utilizando Leaflet e OpenStreetMap.

## 🚀 Funcionalidades

- Visualização de mapa interativo
- Marcação de ponto de partida e destino
- Cálculo de rota seguindo ruas reais (não linha reta)
- Animação do veículo (van) se movendo na rota
- Ajuste automático do mapa para mostrar a rota inteira
- Simulação de estágios da corrida: **chegando** e **em viagem**

## 🛠️ Tecnologias Utilizadas

- **Next.js** 14
- **React** 19
- **TypeScript**
- **Leaflet** (renderização de mapas)
- **OpenStreetMap** (dados de mapas)
- **OSRM API** (cálculo de rotas reais por ruas)
- **TailwindCSS** (para estilos rápidos e responsivos)

## 🗂️ Estrutura de Pastas

```bash
components/
  leaflet-map/       # Componente de mapa interativo
  map-view.tsx       # Tela principal de visualização
app/
  page.tsx           # Página inicial do app
