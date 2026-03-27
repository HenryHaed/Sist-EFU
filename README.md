# 🎓 Sistema de Gestión - Entrada Universitaria UMSA

Este repositorio contiene el sistema integral para la gestión, calificación y seguimiento de la **Entrada Universitaria de la UMSA**.

## 🏗️ Arquitectura del Proyecto

El proyecto está dividido en dos partes principales:

- **[📁 Backend (NestJS)](./backend/README.md)**: Servidor de API, base de datos PostgreSQL, autenticación JWT y documentación interactiva con Swagger.
- **[📁 Frontend (Vue 3)](./frontend/README.md)**: Dashboard administrativo, panel de jurado y gestión de fraternidades, construido con Vuetify.

## 🚀 Inicio Rápido

Para ejecutar todo el proyecto localmente, sigue estos pasos:

### 1. Requisitos Previos
- **Node.js**: v18+
- **PostgreSQL**: Instalado y con una base de datos llamada `efu_db` activa.

### 2. Configuración del Backend
```bash
cd backend
npm install
# Configura tu .env basado en .env.example
npm run start:dev
```
*Visita `http://localhost:3000/api` para ver la documentación de la API.*

### 3. Configuración del Frontend
En otra terminal:
```bash
cd frontend
npm install
npm run dev
```
*Visita `http://localhost:5173` para el Dashboard.*

---

## 🛠️ Herramientas Utilizadas

- **Backend**: NestJS, TypeORM, Passport JWT, Swagger.
- **Frontend**: Vue 3, Vite, Pinia, Vuetify, Axios.
- **Base de Datos**: PostgreSQL.

## 📋 Características Principales

- **Gestión de Fraternidades**: CRUD completo para todas las fraternidades participantes.
- **Sistema de Calificación**: Módulo para que el jurado pueda calificar en tiempo real.
- **Autenticación Robusta**: Roles de usuario (Admin, Jurado, Delegado) con permisos específicos.
- **Documentación de API**: Todos los endpoints están documentados y pueden probarse vía Swagger.
- **Base de Datos Dinámica**: Script de semilla para configuración rápida de catálogos básicos.

---

> [!TIP]
> Si es la primera vez que ejecutas el proyecto, no olvides correr `npm run seed` en la carpeta `backend/` para cargar los datos iniciales necesarios.