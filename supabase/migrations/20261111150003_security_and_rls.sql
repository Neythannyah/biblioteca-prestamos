-- Migración 3: Seguridad, RLS y Políticas de Acceso
-- Archivo: 20261111150003_security_and_rls.sql

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE public.encargado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.libro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestamo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feriado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- 2. Revocar todos los permisos a rol 'anon'
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- 3. Otorgar permisos a rol 'authenticated'
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 4. Políticas RLS para public.encargado
DROP POLICY IF EXISTS "Encargado puede consultar su propio registro o registros de encargado" ON public.encargado;
CREATE POLICY "Encargado puede consultar su propio registro o registros de encargado"
ON public.encargado
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.es_encargado());

DROP POLICY IF EXISTS "Encargado puede gestionar operadores" ON public.encargado;
CREATE POLICY "Encargado puede gestionar operadores"
ON public.encargado
FOR ALL
TO authenticated
USING (public.es_encargado())
WITH CHECK (public.es_encargado());

-- 5. Políticas RLS para public.usuario
DROP POLICY IF EXISTS "Encargado gestiona usuarios" ON public.usuario;
CREATE POLICY "Encargado gestiona usuarios"
ON public.usuario
FOR ALL
TO authenticated
USING (public.es_encargado())
WITH CHECK (public.es_encargado());

-- 6. Políticas RLS para public.libro
DROP POLICY IF EXISTS "Encargado gestiona libros" ON public.libro;
CREATE POLICY "Encargado gestiona libros"
ON public.libro
FOR ALL
TO authenticated
USING (public.es_encargado())
WITH CHECK (public.es_encargado());

-- 7. Políticas RLS para public.prestamo
DROP POLICY IF EXISTS "Encargado gestiona prestamos" ON public.prestamo;
CREATE POLICY "Encargado gestiona prestamos"
ON public.prestamo
FOR ALL
TO authenticated
USING (public.es_encargado())
WITH CHECK (public.es_encargado());

-- 8. Políticas RLS para public.multa
DROP POLICY IF EXISTS "Encargado gestiona multas" ON public.multa;
CREATE POLICY "Encargado gestiona multas"
ON public.multa
FOR ALL
TO authenticated
USING (public.es_encargado())
WITH CHECK (public.es_encargado());

-- 9. Políticas RLS para public.feriado
DROP POLICY IF EXISTS "Encargado gestiona feriados" ON public.feriado;
CREATE POLICY "Encargado gestiona feriados"
ON public.feriado
FOR ALL
TO authenticated
USING (public.es_encargado())
WITH CHECK (public.es_encargado());

-- 10. Políticas RLS para public.configuracion
DROP POLICY IF EXISTS "Encargado gestiona configuracion" ON public.configuracion;
CREATE POLICY "Encargado gestiona configuracion"
ON public.configuracion
FOR ALL
TO authenticated
USING (public.es_encargado())
WITH CHECK (public.es_encargado());

-- 11. Bloquear autoregistro público de usuarios en Auth (solo operador autorizado)
CREATE OR REPLACE FUNCTION public.bloquear_registro_publico()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.email <> 'admin@mail.cl' THEN
        RAISE EXCEPTION 'El autoregistro de usuarios se encuentra deshabilitado. Este sistema es de uso exclusivo del Encargado de Biblioteca.'
            USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_bloquear_registro_publico ON auth.users;
CREATE TRIGGER tr_bloquear_registro_publico
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.bloquear_registro_publico();

