# Sistema de Invitaciones de Graduación

Sistema web de gestión de invitaciones para graduación con React, Vite y Supabase.

## Características

- 🎓 Invitaciones personalizadas con URLs únicas
- ✅ Confirmación de asistencia con límite de acompañantes
- 👥 Gestión de acompañantes por invitado
- 📊 Panel administrativo con visualización en tiempo real
- 📥 Exportación de datos a Excel
- 🎨 Diseño elegante con colores azul, blanco, negro y dorado

## Requisitos Previos

- Node.js 18+ instalado
- Cuenta en [Supabase](https://supabase.com)
- npm o yarn

## Configuración Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

Sigue las instrucciones detalladas en [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) para:

1. Crear un proyecto en Supabase
2. Ejecutar el script SQL (`supabase-setup.sql`)
3. Obtener las credenciales del proyecto
4. Configurar las variables de entorno

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y completa con tus credenciales de Supabase:

```bash
cp .env.example .env
```

Edita `.env` con tus valores reales:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_publica_aqui
```

## Desarrollo

Inicia el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Estructura del Proyecto

```
graduation-invitation/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/          # Páginas de la aplicación
│   ├── services/       # Servicios (Supabase client)
│   └── utils/          # Utilidades y helpers
├── supabase-setup.sql  # Script SQL para configurar la base de datos
├── SUPABASE_SETUP.md   # Guía de configuración de Supabase
└── .env.example        # Plantilla de variables de entorno
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta el linter

## Tecnologías

- **React 19** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **Supabase** - Backend as a Service (PostgreSQL + API)
- **React Router** - Enrutamiento
- **ESLint** - Linting

## Estado del Proyecto

1. ✅ Configuración del proyecto y base de datos
2. ✅ Página de invitación personalizada
3. ✅ Panel administrativo con visualización en tiempo real
4. ✅ Exportación de datos a Excel
5. ✅ Importación de invitados desde Excel
6. 🔄 Despliegue en producción (en progreso)

## Licencia

MIT
