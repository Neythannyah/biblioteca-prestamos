-- Migración 1: Creación de tablas base del Sistema de Biblioteca
-- Archivo: 20261111150001_create_schema_and_tables.sql

-- Función para actualizar columnas updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Función pura para validación de RUT chileno (Módulo 11)
CREATE OR REPLACE FUNCTION public.validar_rut_chileno(p_rut text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_rut_limpio text;
    v_cuerpo text;
    v_dv text;
    v_suma integer := 0;
    v_multiplicador integer := 2;
    v_i integer;
    v_resto integer;
    v_dv_esperado text;
BEGIN
    IF p_rut IS NULL THEN
        RETURN false;
    END IF;

    v_rut_limpio := upper(regexp_replace(p_rut, '[^0-9kK]', '', 'g'));

    IF length(v_rut_limpio) < 8 OR length(v_rut_limpio) > 9 THEN
        RETURN false;
    END IF;

    v_cuerpo := substr(v_rut_limpio, 1, length(v_rut_limpio) - 1);
    v_dv := substr(v_rut_limpio, length(v_rut_limpio), 1);

    IF v_cuerpo !~ '^[0-9]+$' THEN
        RETURN false;
    END IF;

    FOR v_i IN REVERSE length(v_cuerpo)..1 LOOP
        v_suma := v_suma + (substr(v_cuerpo, v_i, 1)::integer * v_multiplicador);
        v_multiplicador := CASE WHEN v_multiplicador = 7 THEN 2 ELSE v_multiplicador + 1 END;
    END LOOP;

    v_resto := 11 - (v_suma % 11);

    IF v_resto = 11 THEN
        v_dv_esperado := '0';
    ELSIF v_resto = 10 THEN
        v_dv_esperado := 'K';
    ELSE
        v_dv_esperado := v_resto::text;
    END IF;

    RETURN v_dv = v_dv_esperado;
END;
$$;

-- 1. Tabla encargado
CREATE TABLE IF NOT EXISTS public.encargado (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_usuario text UNIQUE NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.encargado IS 'Operador único del sistema de biblioteca vinculado a auth.users';

-- 2. Tabla usuario (Lectores: estudiantes y docentes)
CREATE TABLE IF NOT EXISTS public.usuario (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rut text UNIQUE NOT NULL,
    nombre text NOT NULL,
    correo text NOT NULL CHECK (correo ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    tipo text NOT NULL CHECK (tipo IN ('Estudiante', 'Docente')),
    estado text NOT NULL DEFAULT 'Habilitado' CHECK (estado IN ('Habilitado', 'Bloqueado')),
    motivo_bloqueo text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_usuario_rut_valido CHECK (public.validar_rut_chileno(rut))
);

COMMENT ON TABLE public.usuario IS 'Lectores de la biblioteca (estudiantes o docentes) sin acceso directo al sistema';

-- 3. Tabla libro
CREATE TABLE IF NOT EXISTS public.libro (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo text UNIQUE NOT NULL,
    titulo text NOT NULL,
    autor text NOT NULL,
    editorial text NOT NULL,
    anio int NOT NULL CHECK (anio BETWEEN 1000 AND (EXTRACT(year FROM now())::int + 1)),
    estado text NOT NULL DEFAULT 'Disponible' CHECK (estado IN ('Disponible', 'Prestado', 'En reparacion')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.libro IS 'Catálogo de ejemplares bibliográficos';

-- 4. Tabla prestamo
CREATE TABLE IF NOT EXISTS public.prestamo (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id bigint NOT NULL REFERENCES public.usuario(id) ON DELETE RESTRICT,
    libro_id bigint NOT NULL REFERENCES public.libro(id) ON DELETE RESTRICT,
    encargado_id uuid NOT NULL REFERENCES public.encargado(id) ON DELETE RESTRICT,
    fecha_prestamo date NOT NULL,
    fecha_vencimiento date NOT NULL,
    fecha_devolucion date NULL,
    renovado boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.prestamo IS 'Registro histórico y activo de préstamos bibliotecarios';

-- Índices de prestamo
CREATE UNIQUE INDEX IF NOT EXISTS idx_prestamo_libro_activo ON public.prestamo(libro_id) WHERE fecha_devolucion IS NULL;
CREATE INDEX IF NOT EXISTS idx_prestamo_usuario_id ON public.prestamo(usuario_id);
CREATE INDEX IF NOT EXISTS idx_prestamo_libro_id ON public.prestamo(libro_id);
CREATE INDEX IF NOT EXISTS idx_prestamo_fecha_vencimiento ON public.prestamo(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_prestamo_fecha_prestamo ON public.prestamo(fecha_prestamo);

-- 5. Tabla multa
CREATE TABLE IF NOT EXISTS public.multa (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    prestamo_id bigint NOT NULL UNIQUE REFERENCES public.prestamo(id) ON DELETE RESTRICT,
    dias_atraso int NOT NULL CHECK (dias_atraso >= 0),
    monto int NOT NULL CHECK (monto >= 0),
    pagada boolean NOT NULL DEFAULT false,
    fecha_pago date NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.multa IS 'Multas aplicadas por devolución tardía de préstamos';

-- 6. Tabla feriado
CREATE TABLE IF NOT EXISTS public.feriado (
    fecha date PRIMARY KEY,
    nombre text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.feriado IS 'Feriados oficiales reconocidos para el cómputo de días hábiles';

-- 7. Tabla configuracion
CREATE TABLE IF NOT EXISTS public.configuracion (
    clave text PRIMARY KEY,
    valor text NOT NULL,
    descripcion text NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.configuracion IS 'Parámetros del sistema: tarifa de multa, plazos y modo de cómputo';

-- Triggers de actualización automática de updated_at
CREATE OR REPLACE TRIGGER tr_encargado_updated_at BEFORE UPDATE ON public.encargado FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER tr_usuario_updated_at BEFORE UPDATE ON public.usuario FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER tr_libro_updated_at BEFORE UPDATE ON public.libro FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER tr_prestamo_updated_at BEFORE UPDATE ON public.prestamo FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER tr_multa_updated_at BEFORE UPDATE ON public.multa FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER tr_configuracion_updated_at BEFORE UPDATE ON public.configuracion FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Valores iniciales de configuración
INSERT INTO public.configuracion (clave, valor, descripcion) VALUES
    ('tarifa_multa', '1000', 'Monto en CLP por día de atraso'),
    ('plazo_estudiante', '5', 'Días hábiles de préstamo para estudiantes'),
    ('plazo_docente', '10', 'Días hábiles de préstamo para docentes'),
    ('multa_modo', 'habiles', 'Modo de conteo de retraso: habiles o calendario')
ON CONFLICT (clave) DO NOTHING;

