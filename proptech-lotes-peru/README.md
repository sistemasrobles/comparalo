# 🏗️ ComparaLotes - Plataforma PropTech para Terrenos en Perú

> MVP+ de una plataforma tipo "Comparabien pero para lotes/terrenos" en Perú. Marketplace inteligente con simuladores, verificación legal, SEO programático y CRM de leads.

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Quick Start](#-quick-start)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Funcionalidades](#-funcionalidades)
- [API Endpoints](#-api-endpoints)
- [Admin Panel](#-admin-panel)
- [SEO Programático](#-seo-programático)
- [Variables de Entorno](#-variables-de-entorno)

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Query |
| **Backend** | NestJS 10, TypeScript, Passport JWT, Throttler |
| **Base de Datos** | PostgreSQL 16 + Prisma ORM |
| **Cache** | Redis 7 + ioredis |
| **Infraestructura** | Docker Compose, Multi-stage builds |
| **Testing** | Jest (unit tests) |

## 🏛️ Arquitectura

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js    │────▶│   NestJS     │────▶│  PostgreSQL   │
│   (SSR/CSR)  │     │   (REST API) │     │  (Prisma ORM) │
│   Port 3000  │     │   Port 4000  │     │   Port 5432   │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────▼───────┐
                     │    Redis     │
                     │   (Cache)    │
                     │   Port 6379  │
                     └──────────────┘
```

## 🚀 Quick Start

### Opción 1: Docker Compose (Recomendado)

```bash
# 1. Clonar y entrar al proyecto
cd proptech-lotes-peru

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar todo con Docker
docker-compose up -d

# 4. Ejecutar migraciones y seed
docker-compose exec api npx prisma migrate deploy
docker-compose exec api npx prisma db seed
```

**Accesos:**
- 🌐 Frontend: http://localhost:3000
- 🔌 API: http://localhost:4000
- 📊 Health check: http://localhost:4000/health

### Opción 2: Desarrollo Local

```bash
# 1. Instalar dependencias
cd proptech-lotes-peru

# Paquete DB
cd packages/db && npm install && cd ../..

# API
cd apps/api && npm install && cd ../..

# Web
cd apps/web && npm install && cd ../..

# 2. Configurar .env
cp .env.example .env
# Editar .env con tu configuración de PostgreSQL y Redis locales

# 3. Setup de base de datos
cd packages/db
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ../..

# 4. Iniciar API (Terminal 1)
cd apps/api && npm run start:dev

# 5. Iniciar Frontend (Terminal 2)
cd apps/web && npm run dev
```

### Opción 3: Setup rápido con script

```bash
cd proptech-lotes-peru
npm run setup     # Instala deps + genera Prisma + migra + seed
npm run dev       # Inicia API y Web en paralelo
```

## 📁 Estructura del Proyecto

```
proptech-lotes-peru/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── common/         # Guards, filters, interceptors, decorators
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # JWT login, refresh tokens
│   │   │   │   ├── projects/   # CRUD + búsqueda + filtros
│   │   │   │   ├── leads/      # CRM + routing (email/webhook/whatsapp)
│   │   │   │   ├── simulator/  # Calculadoras financieras
│   │   │   │   ├── compare/    # Comparación lado a lado
│   │   │   │   ├── cities/     # Ciudades y zonas
│   │   │   │   ├── reviews/    # Reseñas + moderación
│   │   │   │   ├── seo/        # Páginas SEO programáticas
│   │   │   │   ├── analytics/  # Eventos de tracking
│   │   │   │   ├── admin/      # Panel administrativo
│   │   │   │   └── health/     # Health check
│   │   │   └── main.ts
│   │   └── test/               # Unit tests (Jest)
│   │
│   └── web/                    # Next.js Frontend
│       └── src/
│           ├── app/
│           │   ├── page.tsx           # Home (hero, featured, zones)
│           │   ├── search/            # Búsqueda con filtros
│           │   ├── projects/[slug]/   # Detalle de proyecto
│           │   ├── compare/           # Comparador (2-4 proyectos)
│           │   ├── simulator/         # Simulador de cuotas + valorización
│           │   ├── terrenos/[city]/   # SEO programático por ciudad
│           │   └── admin/             # Panel admin (login, dashboard, CRUD)
│           ├── components/
│           │   ├── layout/            # Header, Footer
│           │   ├── ProjectCard.tsx    # Tarjeta de proyecto
│           │   ├── SafetyScore.tsx    # Barra de puntaje de seguridad
│           │   ├── LeadForm.tsx       # Formulario de contacto
│           │   └── Analytics.tsx      # Google Analytics
│           └── lib/
│               ├── api.ts             # Cliente API
│               └── utils.ts           # Utilidades
│
├── packages/
│   └── db/                     # Prisma schema + seed
│       ├── prisma/
│       │   └── schema.prisma   # 15 modelos, 10 enums
│       └── src/
│           ├── seed.ts         # Datos demo (12 proyectos, 30 leads)
│           └── index.ts
│
├── docker/
│   ├── api.Dockerfile
│   └── web.Dockerfile
│
├── docker-compose.yml
├── .env.example
└── package.json                # Scripts del monorepo
```

## ✅ Funcionalidades

### 🏪 Marketplace
- Búsqueda con 15+ filtros (ciudad, zona, precio, área, estado legal, etc.)
- Tarjetas de proyecto con imagen, precio, puntaje de seguridad
- Detalle de proyecto con galería, tabla de lotes, mapa
- Paginación y ordenamiento

### 📊 Comparador
- Compara hasta 4 proyectos lado a lado
- Tabla comparativa: precios, servicios, legal, financiamiento
- Selección con búsqueda instantánea

### 🧮 Simuladores
- **Capacidad de pago:** Ingreso, gastos, cuota inicial → cuota máxima, score financiero
- **Valorización:** Precio actual, área, zona, años → proyección conservadora/esperada/optimista

### 🔒 Seguridad Jurídica
- Puntaje de seguridad (0-100) por proyecto
- Estado legal verificado (Saneado / En proceso / Pendiente)
- Indicadores visuales con colores

### 👥 CRM de Leads
- Formulario de contacto integrado por proyecto
- Routing automático: Email, Webhook, WhatsApp
- Pipeline: NEW → CONTACTED → QUALIFIED → CONVERTED
- Exportación CSV

### 🛡️ Panel Admin
- Dashboard con métricas (proyectos, leads, reviews)
- Gestión de proyectos (toggle destacado, CRUD)
- Gestión de leads (cambio de estado, filtros)
- Moderación de reviews (aprobar/rechazar)

### 🔍 SEO Programático
- Páginas por ciudad: `/terrenos/lima`, `/terrenos/ica`
- Meta tags dinámicos optimizados
- Contenido SEO con datos en tiempo real
- FAQ schema-ready

## 🔌 API Endpoints

### Públicos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/projects` | Listar proyectos (con filtros) |
| GET | `/projects/featured` | Proyectos destacados |
| GET | `/projects/top-zones` | Zonas populares |
| GET | `/projects/stats` | Estadísticas generales |
| GET | `/projects/:slug` | Detalle de proyecto |
| GET | `/cities` | Listar ciudades |
| GET | `/cities/:slug` | Detalle de ciudad |
| POST | `/leads` | Crear lead (contacto) |
| POST | `/compare` | Comparar proyectos |
| POST | `/simulator/affordability` | Simulador de capacidad |
| POST | `/simulator/valorization` | Simulador de valorización |
| POST | `/reviews` | Enviar review |
| GET | `/reviews/project/:id` | Reviews de un proyecto |
| GET | `/seo/city/:slug` | Datos SEO por ciudad |
| GET | `/seo/paths` | Rutas SEO disponibles |
| POST | `/analytics/track` | Registrar evento |

### Autenticados (Admin)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh token |
| GET | `/admin/dashboard` | Métricas del dashboard |
| GET/POST/PUT/DELETE | `/admin/projects/*` | CRUD proyectos |
| PATCH | `/admin/projects/:id/featured` | Toggle destacado |
| GET | `/admin/cities/*` | CRUD ciudades |
| GET | `/leads` | Listar leads |
| GET | `/leads/metrics` | Métricas de leads |
| GET | `/leads/export` | Exportar CSV |
| PATCH | `/leads/:id/status` | Actualizar estado |
| GET | `/admin/reviews/pending` | Reviews pendientes |
| PATCH | `/reviews/:id/moderate` | Moderar review |

## 👨‍💼 Admin Panel

**Acceso:** http://localhost:3000/admin

**Credenciales demo:**
- Email: `admin@comparalotes.pe`
- Password: `admin123456`

## 📈 SEO Programático

Las páginas de SEO se generan automáticamente por ciudad:

- `/terrenos/lima` → "Terrenos en Lima"
- `/terrenos/ica` → "Terrenos en Ica"
- `/terrenos/arequipa` → "Terrenos en Arequipa"

Cada página incluye:
- Meta title y description optimizados
- Estadísticas de precios en tiempo real
- Grid de proyectos de la ciudad
- FAQ section (schema.org ready)
- Contenido SEO dinámico

## ⚙️ Variables de Entorno

```env
# Base de datos
DATABASE_URL=postgresql://user:pass@localhost:5432/comparalotes

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# API
API_PORT=4000
CORS_ORIGIN=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_MAPS_API_KEY=your-google-maps-key

# Admin
ADMIN_EMAIL=admin@comparalotes.pe
ADMIN_PASSWORD=admin123456
```

## 🧪 Tests

```bash
# Unit tests del API
cd apps/api
npm run test

# Tests incluidos:
# - Simulator Service (affordability, valorization, edge cases)
# - Lead Routing Service (WhatsApp links, email routing, skip logic)
```

## 📄 Licencia

MIT © 2024 ComparaLotes
