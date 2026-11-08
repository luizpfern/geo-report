# EcoPulse — Guia de Execução

## Pré-requisitos

- Node.js LTS
- Docker + Docker Compose
- npm

## 1. Configurar variáveis de ambiente

Na raiz:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Preencha os valores em `.env` (Docker) e `backend/.env` (API).  
**Nunca commite** `.env` / `backend/.env`.

Opcional frontend:

```bash
cp frontend/.env.example frontend/.env
```

## 2. Subir infraestrutura

```bash
docker compose up -d
```

- Postgres: porta definida em `POSTGRES_PORT`
- RabbitMQ AMQP / UI: `RABBITMQ_AMQP_PORT` / `RABBITMQ_UI_PORT`

## 3. Instalar dependências

```bash
npm run setup
```

## 4. Rodar API + Worker

```bash
npm run dev:backend
```

Health: `http://localhost:<PORT>/health`

## 5. Rodar Frontend

```bash
npm run dev:frontend
```

App: Vite (porta padrão `5173`). Proxy `/api` → backend.

## Endpoints

- `POST /api/reports`
- `GET /api/reports?lat=&lon=&radiusKm=100`
- `GET /api/report-types`
