# Sistema Web de Préstamo de Libros para Biblioteca

Prototipo de Ingeniería de Software (Evaluación 2) desarrollado en **React 18 + JavaScript + Vite + Tailwind CSS**, con arquitectura en capas desacoplada y soporte dual para datos en memoria (**Mock**) o base de datos en la nube (**Supabase**).

---

## 1. Instalación y Ejecución Local

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar entorno de desarrollo local (Vite)
npm run dev

# 3. Ejecutar suite de pruebas unitarias y e2e (Vitest)
npm test

# 4. Generar build de producción estático
npm run build
```

---

## 2. Variables de Entorno (`.env`)

Copia el archivo `.env.example` o configura tu `.env`:

```ini
# Fuente de datos: 'mock' (en memoria/localStorage) o 'supabase' (Cloud DB)
VITE_DATA_SOURCE=supabase

# Configuración Supabase (Proyecto: Biblioteca Database)
VITE_SUPABASE_URL=https://rkscphlceqfncvuzejxu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Credenciales del Encargado de Biblioteca

El acceso está restringido exclusivamente al **Encargado de Biblioteca**:
- **Usuario:** `admin` (o `admin@mail.cl`)
- **Contraseña:** `Biblioteca2026!`

*(En modo `mock`, también admite usuario `encargado` con la misma contraseña).*

---

## 4. Patrones de Diseño Implementados

- **Singleton** (`src/patterns/singleton/supabaseClient.js`): Garantiza una única instancia del cliente de base de datos y de sesión en toda la aplicación.
- **Factory Method** (`src/patterns/factory/UsuarioFactory.js`): `UsuarioFactory.fabricar()` crea entidades `Estudiante` (plazo 5 días hábiles) y `Docente` (plazo 10 días hábiles).
- **Observer** (`src/patterns/observer/EstadoUsuarioService.js`): `SujetoPrestamo` notifica eventos; `EstadoUsuarioService` reevalúa atrasos, bloquea usuarios morosos y genera multas.
- **Adapter** (`src/patterns/adapter/ReporteExportAdapter.js`): Adapta los datasets JSON de los 4 reportes a PDF (con estilos corporativos), Excel (.xlsx) y CSV con codificación UTF-8 BOM.

---

## 5. Despliegue en Producción (Vercel o Netlify)

El proyecto incluye `vercel.json` y `netlify.toml` con las reglas de rewrite para aplicaciones SPA (Single Page Application).

### Pasos en Vercel:
1. Conecta tu repositorio Git en [vercel.com](https://vercel.com).
2. Framework Preset: **Vite**.
3. En **Environment Variables**, agrega:
   - `VITE_DATA_SOURCE` = `supabase`
   - `VITE_SUPABASE_URL` = `https://rkscphlceqfncvuzejxu.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = tu clave anon pública.
4. Presiona **Deploy**.

### Pasos en Netlify:
1. En [netlify.com](https://netlify.com), crea un nuevo sitio desde tu repositorio Git.
2. Build command: `npm run build`, Publish directory: `dist`.
3. En **Site configuration -> Environment variables**, agrega las mismas 3 variables.
4. En el dashboard de Supabase (**Authentication -> URL Configuration**), agrega la URL de tu despliegue (ej. `https://tu-app.vercel.app`) en **Redirect URLs**.
