# TECOPOS MVP - Banking Integration Platform

## Architecture

```
[Client] → [Gateway :3000] → [SSO :3001] (auth)
                            → [Banking :3002] (accounts + operations)
```

Docker Compose: 5 services (`gateway`, `sso`, `banking`, `postgres-sso`, `postgres-banking`)

## Tech Stack

- **NestJS** (monorepo)
- **PostgreSQL 16**
- **TypeORM**
- **JWT + bcrypt**
- **@nestjs/throttler**
- **@nestjs/swagger**
- **Docker Compose**

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### Run with Docker (recommended)

```bash
docker compose up --build
```

### Run locally

1. Start PostgreSQL instances
2. Install dependencies and start each service:

```bash
npm install
npm run start:dev gateway
npm run start:dev sso
npm run start:dev banking
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

| Service | URL |
|---------|-----|
| Gateway | [http://localhost:3000/api/v1/docs](http://localhost:3000/api/v1/docs) |
| SSO | [http://localhost:3001/api/v1/docs](http://localhost:3001/api/v1/docs) |
| Banking | [http://localhost:3002/api/v1/docs](http://localhost:3002/api/v1/docs) |

## Environment Variables

All secrets are managed via `.env` file (see `.env.example`). The `.env` file is excluded from version control via `.gitignore`.

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | JWT signing key | **Yes** (app fails to start without it) |
| `SSO_URL` | SSO service URL | No (default: `http://localhost:3001`) |
| `BANKING_URL` | Banking service URL | No (default: `http://localhost:3002`) |
| `DATABASE_HOST` | PostgreSQL host | No (default: `localhost`) |
| `DATABASE_PORT` | PostgreSQL port | No (default: `5432`) |
| `DATABASE_USERNAME` | DB username | No (default: `postgres`) |
| `DATABASE_PASSWORD` | DB password | No (default: `postgres`) |
| `DATABASE_NAME` | DB name | No (default: `sso` / `banking`) |
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

## Deployment

> **URL:** _To be added after deployment_

## Project Structure

```
tecopos-mvp/
├── apps/
│   ├── gateway/     (port 3000) - API Gateway with rate limiting
│   ├── sso/         (port 3001) - Authentication (JWT + bcrypt)
│   └── banking/     (port 3002) - Accounts & operations + webhooks
├── docker-compose.yml
├── .env.example
└── nest-cli.json
```
