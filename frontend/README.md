# 🎨 Entrada Universitaria - Dashboard (Frontend)

Este es el cliente del sistema de gestión de la **Entrada Universitaria UMSA**, desarrollado con **Vue 3**, **Vite** y **Vuetify 3**.

## 🛠️ Tecnologías

- **Vue 3**: Framework de JavaScript progresivo.
- **Vite**: Herramienta de construcción ultrarrápida.
- **Vuetify 3**: Framework de componentes UI basado en Material Design.
- **Pinia**: Gestión de estado centralizada.
- **Axios**: Cliente HTTP para conectar con la API del backend.
- **Typescript**: Tipado estático para mayor seguridad en el código.

## ⚙️ Instalación y Configuración

1.  Navega a esta carpeta:
    ```bash
    cd frontend
    ```
2.  Instala las dependencias necesarias:
    ```bash
    npm install
    ```
3.  Crea un archivo `.env` si es necesario configurar la URL del backend (por defecto configurado para `http://localhost:3000/api/v1`).

## 🏃‍♂️ Ejecución

Para iniciar el servidor de desarrollo:
```bash
npm run dev
```

El Dashboard estará disponible en: `http://localhost:5173` (o la URL que indique tu terminal).

## 🚀 Despliegue (Build)

Para generar la versión para producción lista para ser servida:
```bash
npm run build
```

Los archivos generados se encontrarán en la carpeta `/dist`.

## 📂 Estructura del Proyecto

- `src/assets/`: Imágenes, iconos y estilos globales.
- `src/components/`: Componentes Vue reutilizables.
- `src/views/`: Páginas principales del sistema.
- `src/store/`: Definiciones de Pinia para el estado global (p. ej. el usuario logueado).
- `src/router/`: Configuración de navegación.
- `src/services/`: Clientes de API orientados a servicios para conectar con el backend.
