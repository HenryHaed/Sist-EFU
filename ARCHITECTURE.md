# Estructura del Proyecto Entrada Universitaria UMSA

Este documento describe la estructura de carpetas recomendada para el desarrollo escalable con NestJS y Vue 3.

## 📂 Backend (NestJS)
- `src/`
  - `modules/`: Módulos de la aplicación (auth, users, evaluaciones, fraternidades, etc.)
  - `entities/`: Entidades de TypeORM (ya existente).
  - `controllers/`: Controladores globales si aplica (generalmente dentro de cada módulo).
  - `services/`: Servicios globales si aplica (generalmente dentro de cada módulo).
  - `dto/`: Objetos de transferencia de datos.
  - `interfaces/`: Definiciones de interfaces TypeScript.
  - `common/`: Decoradores, interceptores, guards y pipes reutilizables.
    - `guards/`
    - `interceptors/`
    - `filters/`
  - `config/`: Configuración de base de datos, variables de entorno, etc.

## 📂 Frontend (Vue 3)
- `src/`
  - `assets/`: Imágenes, fuentes y estilos globales.
  - `components/`: Componentes Vue reutilizables (Botones, Modales, Cards).
    - `common/`
    - `layout/`
  - `views/`: Vistas principales (Páginas).
  - `store/`: Gestión de estado global (Pinia).
  - `router/`: Configuración de rutas.
  - `services/`: Llamadas a la API (Axios).
  - `styles/`: Variables y configuraciones de estilos (Vuetify/Tailwind).
  - `utils/`: Funciones de ayuda y constantes.
  - `interfaces/`: Tipos y modelos compartidos con el backend.
