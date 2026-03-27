# 🚀 Entrada Universitaria - API (Backend)

Este es el servidor principal para la gestión de la **Entrada Universitaria de la UMSA**, desarrollado con **NestJS** y **TypeORM**. La base de datos es **PostgreSQL**.

## 🛠️ Tecnologías y Requisitos

- **Node.js**: v18 o superior.
- **NestJS**: v11+.
- **Database**: PostgreSQL (pgAdmin 4 recomendado).
- **ORM**: TypeORM.

## ⚙️ Configuración del Entorno

1.  Asegúrate de tener instaladas las dependencias:
    ```bash
    npm install
    ```
2.  Crea un archivo `.env` en este directorio (`backend/`) basándote en el archivo `.env.example`. Asegúrate de que las credenciales de PostgreSQL coincidan con tu servidor local.
    ```env
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=postgres
    DB_PASSWORD=tu_password  # <-- Cambia esto
    DB_NAME=efu_db
    ```
3.  Crea la base de datos `efu_db` en pgAdmin o vía SQL si no existe.

## 🏃‍♂️ Ejecución

Inicia el servidor en modo desarrollo con recarga automática:
```bash
npm run start:dev
```

El servidor estará disponible en: `http://localhost:3000/api/v1`.

## 📜 Documentación de la API (Swagger)

Una vez que el servidor esté en ejecución, puedes acceder a la documentación interactiva en:
👉 [http://localhost:3000/api](http://localhost:3000/api)

Allí podrás probar todos los endpoints disponibles.

## 🌱 Semilla de Datos (Seeding)

Para cargar los datos iniciales necesarios (Roles, Categorías, Facultades, etc.), ejecuta el siguiente comando:
```bash
npm run seed
```

Esto poblará la base de datos con la información base para que el sistema funcione correctamente desde el inicio.

### 👥 Usuarios de Prueba
El script de semilla crea automáticamente los siguientes usuarios para pruebas (todos con la contraseña `password123`):

| Rol | CI (Usuario) | Password |
| :--- | :--- | :--- |
| **Superusuario** | `1000000` | `password123` |
| **Admin** | `2000000` | `password123` |
| **Controlador HCU** | `3000000` | `password123` |
| **Delegado** | `4000000` | `password123` |
| **Jurado** | `5000000` | `password123` |

## 📂 Organización de Archivos (`src/`)

- `auth/`: Lógica de autenticación y generación de JWT.
- `entities/`: Modelos de base de datos definidos con TypeORM.
- `fraternidades/`: Gestión de las fraternidades participantes.
- `main.ts`: Punto de entrada del servidor.
- `app.module.ts`: Módulo raíz y configuración de la base de datos.
