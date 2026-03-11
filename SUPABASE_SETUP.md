# Configuración de Supabase

Este documento explica cómo configurar Supabase para el sistema de invitaciones de graduación.

## Pasos para configurar Supabase

### 1. Crear un proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión o crea una cuenta
3. Haz clic en "New Project"
4. Completa los detalles del proyecto:
   - **Name**: graduation-invitation (o el nombre que prefieras)
   - **Database Password**: Elige una contraseña segura (guárdala en un lugar seguro)
   - **Region**: Selecciona la región más cercana a tus usuarios
5. Haz clic en "Create new project" y espera a que se complete la configuración

### 2. Ejecutar el script SQL

1. En tu proyecto de Supabase, ve a la sección **SQL Editor** en el menú lateral
2. Haz clic en "New query"
3. Copia todo el contenido del archivo `supabase-setup.sql`
4. Pégalo en el editor SQL
5. Haz clic en "Run" para ejecutar el script
6. Verifica que las tablas `guests` y `companions` se hayan creado correctamente en la sección **Table Editor**

### 3. Obtener las credenciales del proyecto

1. Ve a **Project Settings** (ícono de engranaje en el menú lateral)
2. Selecciona **API** en el menú de configuración
3. Copia los siguientes valores:
   - **Project URL**: Este es tu `VITE_SUPABASE_URL`
   - **anon public**: Esta es tu `VITE_SUPABASE_ANON_KEY`

### 4. Configurar variables de entorno

1. Abre el archivo `.env` en la raíz del proyecto
2. Reemplaza los valores de ejemplo con tus credenciales reales:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_publica_aqui
```

3. Guarda el archivo

### 5. Verificar la configuración

Una vez completados estos pasos, tu base de datos estará lista para usar. El sistema podrá:

- ✅ Almacenar información de invitados en la tabla `guests`
- ✅ Almacenar acompañantes en la tabla `companions`
- ✅ Permitir acceso público de lectura y escritura limitada mediante RLS
- ✅ Mantener la integridad referencial entre invitados y acompañantes

## Estructura de la base de datos

### Tabla `guests`
- `id` (UUID): Identificador único del invitado
- `name` (TEXT): Nombre completo del invitado
- `unique_id` (TEXT): ID único para acceder a la invitación (debe ser único)
- `companion_limit` (INTEGER): Número máximo de acompañantes permitidos
- `confirmed` (BOOLEAN): Estado de confirmación de asistencia
- `created_at` (TIMESTAMP): Fecha de creación del registro

### Tabla `companions`
- `id` (UUID): Identificador único del acompañante
- `guest_id` (UUID): Referencia al invitado (FK a `guests.id`)
- `name` (TEXT): Nombre completo del acompañante
- `created_at` (TIMESTAMP): Fecha de creación del registro

## Políticas de seguridad (RLS)

El sistema utiliza Row Level Security (RLS) para controlar el acceso:

- **Lectura pública**: Cualquiera puede leer datos de invitados y acompañantes
- **Escritura limitada**: Los usuarios pueden actualizar confirmaciones e insertar acompañantes
- **Protección**: Las políticas RLS protegen contra modificaciones no autorizadas

## Próximos pasos

Después de completar esta configuración:

1. Ejecuta `npm run dev` para iniciar el servidor de desarrollo
2. El sistema estará listo para conectarse a Supabase
3. Podrás agregar invitados a la base de datos y probar el flujo completo
