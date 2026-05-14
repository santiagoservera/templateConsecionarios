# DealerOS

Sistema de gestión para agencias de vehículos (autos y motos).

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Vue 3 + Vite + Tailwind CSS + Pinia + Vue Router |
| Backend | Node.js + Express + Prisma ORM |
| Base de datos | SQL Server |
| Autenticación | JWT + Refresh Tokens |

## Estructura

```
dealeros/
├── client/    → Frontend Vue 3
└── server/    → API Node.js + Express + Prisma
```

## Inicio rápido

### Requisitos
- Node.js >= 18
- SQL Server (local o remoto)

### Backend

```bash
cd server

# 1. Copiar variables de entorno y completar con tus datos
cp .env.example .env

# 2. Instalar dependencias
npm install

# 3. Generar cliente Prisma
npm run db:generate

# 4. Ejecutar migraciones (requiere SHADOW_DATABASE_URL en .env)
npm run db:migrate

# 5. Cargar datos de prueba
npm run db:seed

# 6. Levantar servidor en modo desarrollo
npm run dev
```

> **SQL Server y migraciones**: Prisma migrate dev requiere una base de datos
> "shadow" separada. Crear `DealerOS_shadow` en el mismo servidor y configurar
> `SHADOW_DATABASE_URL` en `.env`.

### Frontend

```bash
cd client
npm install
npm run dev
```

## Credenciales de prueba (seed)

| Rol | Email | Contraseña |
|---|---|---|
| ADMIN | admin@dealeros.com | Admin1234! |
| VENDEDOR | carlos@dealeros.com | Vendedor1! |
| VENDEDOR | laura@dealeros.com | Vendedor2! |

## Variables de entorno (server/.env)

```env
DATABASE_URL="sqlserver://localhost:1433;database=DealerOS;user=sa;password=...;trustServerCertificate=true"
SHADOW_DATABASE_URL="sqlserver://localhost:1433;database=DealerOS_shadow;user=sa;password=...;trustServerCertificate=true"
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."
PORT=3000
```
