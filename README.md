# TECOPOS MVP - Banking Integration Platform

Plataforma de integración bancaria con arquitectura de microservicios comunicados via Apache Kafka.

## Arquitectura

```
                         ┌─────────────────┐
                         │   Apache Kafka   │
                         │   (KRaft mode)   │
                         └───┬─────────┬───┘
                             │         │
┌────────┐    HTTP    ┌──────┴───┐     │
│ Client ├───────────→│ Gateway  │     │
│        │←───────────┤  :3000   │     │
└────────┘            └──────┬───┘     │
                             │         │
              Kafka req/res  │         │  Kafka req/res
                             │         │
                     ┌───────┴──┐  ┌───┴────────┐
                     │   SSO    │  │  Banking    │
                     │ (auth)   │  │ (accounts)  │
                     └───────┬──┘  └───┬────────┘
                             │         │
                     ┌───────┴──┐  ┌───┴────────┐
                     │ Postgres │  │  Postgres   │
                     │  (SSO)   │  │ (Banking)   │
                     └──────────┘  └────────────┘
```

### Servicios (Docker Compose)

| Servicio | Rol | Protocolo |
|----------|-----|-----------|
| `gateway` | API Gateway, único punto de entrada HTTP | HTTP (puerto 3000) + Kafka producer |
| `sso` | Autenticación (register, login, profile) | Kafka consumer (sin HTTP) |
| `banking` | Cuentas bancarias y operaciones | Kafka consumer (sin HTTP) |
| `kafka` | Broker de mensajería (KRaft, sin Zookeeper) | PLAINTEXT:9092 |
| `postgres-sso` | Base de datos del servicio SSO | PostgreSQL 16 |
| `postgres-banking` | Base de datos del servicio Banking | PostgreSQL 16 |

## Tech Stack

| Tecnología | Uso |
|------------|-----|
| NestJS 11 | Framework (monorepo) |
| Apache Kafka | Transporte inter-servicios (`@nestjs/microservices` + `kafkajs`) |
| PostgreSQL 16 | Base de datos (una por microservicio) |
| TypeORM | ORM |
| JWT + bcrypt | Autenticación y hashing de contraseñas |
| @nestjs/throttler | Rate limiting (10 req/min por IP) |
| @nestjs/swagger | Documentación API (solo Gateway) |
| Docker Compose | Orquestación de contenedores |

## Despliegue local

### Prerrequisitos

- Docker & Docker Compose

### Un solo comando

```bash
docker compose up --build -d
```

Espera ~30 segundos a que Kafka, PostgreSQL y los 3 microservicios arranquen.

### URL local

- **API Base:** `http://localhost:3000/api/v1`
- **Swagger (docs interactivos):** `http://localhost:3000/api/v1/docs`

### Comandos útiles

```bash
# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs gateway -f
docker compose logs sso -f
docker compose logs banking -f

# Ver estado de los contenedores
docker compose ps

# Apagar todo
docker compose down

# Apagar y borrar volúmenes (reset completo)
docker compose down -v
```

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

### Autenticación

| Method | Path | Description | Auth | Body |
|--------|------|-------------|------|------|
| POST | `/auth/register` | Registrar usuario | No | `{ email, password, name }` |
| POST | `/auth/login` | Login, obtener JWT | No | `{ email, password }` |
| GET | `/auth/profile` | Obtener perfil del usuario | Bearer JWT | - |

### Cuentas y Operaciones

| Method | Path | Description | Auth | Body |
|--------|------|-------------|------|------|
| GET | `/accounts` | Listar todas las cuentas | Bearer JWT | - |
| GET | `/accounts/:id` | Obtener cuenta por ID | Bearer JWT | - |
| GET | `/accounts/:id/operations` | Listar operaciones de una cuenta | Bearer JWT | - |
| POST | `/accounts/:id/operations` | Crear operación | Bearer JWT | `{ type, amount, description? }` |

### Sistema

| Method | Path | Description | Auth | Body |
|--------|------|-------------|------|------|
| GET | `/health` | Estado del sistema, circuit breakers y DLQ | No | - |

### Ejemplos de uso (curl)

```bash
# Registrar usuario
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "name": "John Doe"}'

# Login (obtener token)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
# Respuesta: { "access_token": "eyJhbGci..." }

# Ver perfil (con token)
curl http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer <token>"

# Listar cuentas
curl http://localhost:3000/api/v1/accounts \
  -H "Authorization: Bearer <token>"

# Crear operación (depósito)
curl -X POST http://localhost:3000/api/v1/accounts/<account-id>/operations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"type": "DEPOSIT", "amount": 100.00, "description": "Depósito inicial"}'
```

## Modelos de datos

### User (SSO)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary key |
| email | string | Único |
| password | string | Hash bcrypt |
| name | string | Nombre del usuario |
| createdAt | timestamp | Fecha de creación |
| updatedAt | timestamp | Última actualización |

### Account (Banking)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary key |
| accountNumber | string | Número de cuenta (único) |
| holderName | string | Nombre del titular |
| currency | string | Moneda (default: USD) |
| balance | decimal(12,2) | Saldo actual |
| createdAt | timestamp | Fecha de creación |
| updatedAt | timestamp | Última actualización |

### Operation (Banking)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary key |
| accountId | UUID | FK a Account |
| type | enum | `DEPOSIT`, `WITHDRAWAL`, `TRANSFER` |
| amount | decimal(12,2) | Monto de la operación |
| description | string | Descripción (opcional) |
| date | timestamp | Fecha de la operación |
| createdAt | timestamp | Fecha de creación |
| updatedAt | timestamp | Última actualización |

## Comunicación Kafka

El Gateway actúa como productor Kafka (request-response). SSO y Banking son consumidores puros.

### Topics (message patterns)

| Topic | Servicio | Equivalente REST |
|-------|----------|------------------|
| `sso.auth.register` | SSO | POST /auth/register |
| `sso.auth.login` | SSO | POST /auth/login |
| `sso.auth.profile` | SSO | GET /auth/profile |
| `banking.accounts.findAll` | Banking | GET /accounts |
| `banking.accounts.findOne` | Banking | GET /accounts/:id |
| `banking.operations.findByAccount` | Banking | GET /accounts/:id/operations |
| `banking.operations.create` | Banking | POST /accounts/:id/operations |

Cada topic tiene un reply topic automático (ej: `sso.auth.login.reply`) para el patrón request-response.

## Variables de entorno

Configuración via archivo `.env` (ver `.env.example`).

| Variable | Descripción | Requerida | Default |
|----------|-------------|-----------|---------|
| `JWT_SECRET` | Clave para firmar JWT (min 32 chars) | **Sí** | - |
| `KAFKA_BROKERS` | Dirección del broker Kafka | No | `localhost:9092` |
| `CORS_ORIGIN` | Origen CORS permitido | No | `*` |
| `DATABASE_HOST` | Host PostgreSQL | No | `localhost` |
| `DATABASE_PORT` | Puerto PostgreSQL | No | `5432` |
| `DATABASE_USERNAME` | Usuario PostgreSQL | No | `postgres` |
| `DATABASE_PASSWORD` | Contraseña PostgreSQL | No | `postgres` |
| `DATABASE_NAME` | Nombre de la base de datos | No | `sso` / `banking` |
| `SSO_DB_USER` | Usuario PostgreSQL SSO (Docker) | Sí (Docker) | - |
| `SSO_DB_PASSWORD` | Contraseña PostgreSQL SSO (Docker) | Sí (Docker) | - |
| `SSO_DB_NAME` | Nombre BD SSO (Docker) | Sí (Docker) | - |
| `BANKING_DB_USER` | Usuario PostgreSQL Banking (Docker) | Sí (Docker) | - |
| `BANKING_DB_PASSWORD` | Contraseña PostgreSQL Banking (Docker) | Sí (Docker) | - |
| `BANKING_DB_NAME` | Nombre BD Banking (Docker) | Sí (Docker) | - |
| `WEBHOOK_URL` | URL para notificaciones de operaciones | No | - (se omite si no está) |

## Resiliencia

### Circuit Breaker

El Gateway implementa un circuit breaker por cada microservicio (SSO y Banking):

| Estado | Comportamiento |
|--------|---------------|
| **CLOSED** | Funcionamiento normal, las peticiones se envían al microservicio |
| **OPEN** | Después de 5 fallos consecutivos, se rechazan peticiones inmediatamente (503) durante 30s |
| **HALF-OPEN** | Después del cooldown, se permite 1 petición de prueba. Si tiene éxito → CLOSED, si falla → OPEN |

### Dead Letter Queue (DLQ)

Los mensajes Kafka que fallan repetidamente se almacenan en una cola en memoria (máx. 1000 entradas) con:
- Pattern del mensaje
- Datos enviados
- Error que causó el fallo
- Timestamp
- Servicio destino

### Auto-restart

Todos los contenedores tienen `restart: always` en Docker Compose. Si un microservicio crashea, Docker lo reinicia automáticamente.

### Endpoint de salud

```bash
# Ver estado de circuit breakers y DLQ
curl http://localhost:3000/api/v1/health
```

Respuesta:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "circuitBreakers": {
    "sso": { "failures": 0, "lastFailure": 0, "state": "closed" },
    "banking": { "failures": 0, "lastFailure": 0, "state": "closed" }
  },
  "deadLetterQueue": {
    "count": 0,
    "recent": []
  }
}
```

## Seguridad

- **Rate limiting:** 10 peticiones por minuto por IP (`@nestjs/throttler`)
- **JWT Bearer token:** autenticación con validación fail-fast
- **Password hashing:** bcrypt con 10 salt rounds
- **Input validation:** validación de UUID en params, DTOs con `class-validator`
- **CORS:** habilitado en Gateway (configurable via `CORS_ORIGIN`)
- **Non-root containers:** imágenes Docker corren como usuario `node`
- **No hardcoded secrets:** todas las credenciales en variables de entorno
- **Kafka transport:** comunicación interna sin HTTP, via Kafka request-response
- **Bases de datos aisladas:** cada microservicio tiene su propia PostgreSQL

## Estructura del proyecto

```
project/
├── apps/
│   ├── gateway/                        # API Gateway (HTTP + Kafka producer)
│   │   ├── src/
│   │   │   ├── main.ts                 # Servidor HTTP :3000
│   │   │   ├── app.module.ts
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts   # Validación JWT en requests HTTP
│   │   │   └── proxy/
│   │   │       ├── proxy.module.ts     # ClientsModule Kafka (SSO + Banking)
│   │   │       ├── proxy.service.ts    # Envío Kafka + circuit breaker + DLQ
│   │   │       ├── health.controller.ts  # Estado del sistema y circuit breakers
│   │   │       ├── auth-proxy.controller.ts
│   │   │       ├── banking-proxy.controller.ts
│   │   │       └── dto/               # DTOs con validación
│   │   └── Dockerfile
│   │
│   ├── sso/                            # Microservicio SSO (Kafka consumer)
│   │   ├── src/
│   │   │   ├── main.ts                 # createMicroservice con Transport.KAFKA
│   │   │   ├── sso.module.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth-kafka.controller.ts  # @MessagePattern handlers
│   │   │   │   ├── auth.service.ts           # Lógica de negocio
│   │   │   │   └── auth.module.ts
│   │   │   └── users/
│   │   │       ├── users.service.ts
│   │   │       └── entity/user.entity.ts
│   │   └── Dockerfile
│   │
│   └── banking/                        # Microservicio Banking (Kafka consumer)
│       ├── src/
│       │   ├── main.ts                 # createMicroservice con Transport.KAFKA
│       │   ├── banking.module.ts
│       │   ├── banking-kafka.controller.ts   # @MessagePattern handlers
│       │   ├── accounts/
│       │   │   ├── accounts.service.ts
│       │   │   └── entity/account.entity.ts
│       │   ├── operations/
│       │   │   ├── operations.service.ts
│       │   │   ├── dto/create-operation.dto.ts
│       │   │   └── entity/operation.entity.ts
│       │   ├── webhooks/
│       │   │   └── webhook.service.ts  # Notificaciones HTTP externas
│       │   └── seed/
│       │       └── seed.service.ts     # Datos de prueba
│       └── Dockerfile
│
├── docker-compose.yml                  # 6 servicios: kafka, 2x postgres, gateway, sso, banking
├── .env.example
├── nest-cli.json
├── package.json
└── tsconfig.json
```
