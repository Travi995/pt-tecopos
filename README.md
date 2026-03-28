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

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | JWT signing key | `default-secret` |
| `SSO_URL` | SSO service URL | `http://localhost:3001` |
| `BANKING_URL` | Banking service URL | `http://localhost:3002` |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USERNAME` | DB username | `postgres` |
| `DATABASE_PASSWORD` | DB password | `postgres` |
| `DATABASE_NAME` | DB name | `sso_db` / `banking_db` |
| `WEBHOOK_URL` | Webhook notification URL | - |

## Security

- **Rate limiting:** 10 requests per minute per IP
- **JWT Bearer token** authentication
- **Password hashing** with bcrypt

## Project Structure

```
tecopos-mvp/
├── apps/
│   ├── gateway/     (port 3000)
│   ├── sso/         (port 3001)
│   └── banking/     (port 3002)
├── docker-compose.yml
└── nest-cli.json
```
