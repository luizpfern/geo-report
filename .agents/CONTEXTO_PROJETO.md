# EcoPulse — Contexto do Projeto

## Visão geral

EcoPulse é um MVP full-stack para registro e visualização de alertas urbanos geolocalizados (enchente, incêndio, terremoto, via bloqueada, queda de árvore).

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React (Vite) + Leaflet / OpenStreetMap |
| Backend | Node.js LTS + Express |
| Fila | RabbitMQ (`reports_queue`) |
| Banco | PostgreSQL (imagem PostGIS) |

## Fluxo principal

1. Usuário abre o mapa e obtém geolocalização do navegador.
2. Frontend lista alertas próximos via `GET /api/reports`.
3. Ao registrar alerta, frontend envia `POST /api/reports`.
4. API valida, gera UUID, publica na fila RabbitMQ e responde `202 Accepted`.
5. Worker consome a fila e faz `INSERT` no PostgreSQL.
6. Mapa recarrega e exibe o novo marcador.

## Estrutura do monorepo

```
ecopulse/
├── .agents/          # Documentação para agentes/devs
├── backend/          # API Express + Worker
├── frontend/         # React + Leaflet
├── docker-compose.yml
└── package.json      # Scripts centralizados
```
