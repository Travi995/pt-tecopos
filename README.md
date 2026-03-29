# TECOPOS MVP - Banking Integration Platform

## Architecture

```
[Client] → [Gateway :3000] ──[Kafka]──→ [SSO] (auth)
                            ──[Kafka]──→ [Banking] (accounts + operations)
```

Docker Compose: 6 services (`gateway`, `sso`, `banking`, `kafka`, `postgres-sso`, `postgres-banking`)

- **Gateway**: servidor HTTP (único punto de entrada) + productor Kafka
- **SSO**: microservicio puro Kafka (sin HTTP) - autenticación
- **Banking**: microservicio puro Kafka (sin HTTP) - cuentas y operaciones
- **Kafka**: broker Apache Kafka en modo KRaft (sin Zookeeper)

## Tech Stack

- **NestJS** (monorepo)
- **Apache Kafka** (transporte inter-servicios via `@nestjs/microservices` + `kafkajs`)
- **PostgreSQL 16**
- **TypeORM**
- **JWT + bcrypt**
- **@nestjs/throttler**
- **@nestjs/swagger**
- **Docker Compose**

## Getting Started

### Prerequisites

- Docker & Docker Compose

### Despliegue local (un solo comando)

```bash
docker compose up --build -d
```

Espera ~30 segundos a que todos los servicios arranquen.

**URL local:** [http://localhost:3000/api/v1/docs](http://localhost:3000/api/v1/docs)

Para ver los logs:

```bash
docker compose logs -f
```

Para apagar:

```bash
docker compose down
```

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/auth/register` | Register user | No |
| POST | `/api/v1/auth/login` | Login, get JWT | No |
| GET | `/api/v1/auth/profile` | Get profile | JWT |
| GET | `/api/v1/accounts` | List accounts | JWT |
| GET | `/api/v1/accounts/:id` | Get account | JWT |
| GET | `/api/v1/accounts/:id/operations` | List operations | JWT |
| POST | `/api/v1/accounts/:id/operations` | Create operation | JWT |

## Swagger Documentation

| Servicio | URL |
|----------|-----|
| Gateway | [http://localhost:3000/api/v1/docs](http://localhost:3000/api/v1/docs) |

> SSO y Banking son microservicios puros Kafka, no exponen HTTP ni Swagger.

## Environment Variables

Todas las variables se gestionan via `.env` (ver `.env.example`).

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | JWT signing key | **Yes** |
| `KAFKA_BROKERS` | Kafka broker address | No (default: `localhost:9092`) |
| `DATABASE_HOST` | PostgreSQL host | No (default: `localhost`) |
| `DATABASE_PORT` | PostgreSQL port | No (default: `5432`) |
| `SSO_DB_USER` | SSO PostgreSQL user | For Docker Compose |
| `SSO_DB_PASSWORD` | SSO PostgreSQL password | For Docker Compose |
| `SSO_DB_NAME` | SSO database name | For Docker Compose |
| `BANKING_DB_USER` | Banking PostgreSQL user | For Docker Compose |
| `BANKING_DB_PASSWORD` | Banking PostgreSQL password | For Docker Compose |
| `BANKING_DB_NAME` | Banking database name | For Docker Compose |
| `WEBHOOK_URL` | Webhook notification URL | No (skipped if not set) |

## Security

- **Rate limiting:** 10 requests per minute per IP (`@nestjs/throttler`)
- **JWT Bearer token** authentication with fail-fast validation
- **Password hashing** with bcrypt (salt rounds: 10)
- **Input validation:** UUID validation on path params, DTO validation on request bodies
- **CORS** enabled on gateway
- **Non-root containers:** Docker images run as `node` user
- **No hardcoded secrets:** All credentials externalized to environment variables
- **Kafka transport:** No HTTP entre microservicios, comunicación via Kafka request-response

## Project Structure

```
project/
├── apps/
│   ├── gateway/     (port 3000) - API Gateway HTTP + Kafka producer
│   ├── sso/         (Kafka consumer) - Authentication (JWT + bcrypt)
│   └── banking/     (Kafka consumer) - Accounts & operations + webhooks
├── docker-compose.yml
├── .env.example
└── nest-cli.json
```
