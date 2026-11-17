-- Migración 4: Corrección de hallazgos de Advisors (Seguridad y Rendimiento)
-- Archivo: 20261111150004_fix_advisors_and_hardening.sql

-- 1. search_path inmutable para funciones utilitarias
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validar_rut_chileno(p_rut text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
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

-- 2. Índice de clave foránea en prestamo.encargado_id (Performance Advisor)
CREATE INDEX IF NOT EXISTS idx_prestamo_encargado_id ON public.prestamo(encargado_id);

-- 3. Optimización de RLS en encargado (InitPlan y política única)
DROP POLICY IF EXISTS "Encargado puede consultar su propio registro o registros de encargado" ON public.encargado;
DROP POLICY IF EXISTS "Encargado puede gestionar operadores" ON public.encargado;

CREATE POLICY "Encargado gestiona operadores"
ON public.encargado
FOR ALL
TO authenticated
USING (id = (SELECT auth.uid()) OR public.es_encargado())
WITH CHECK (public.es_encargado());

-- 4. Revocación de privilegios de ejecución a anon y PUBLIC (Security Advisor)
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Otorgar ejecución solo a authenticated en los RPCs de la aplicación
GRANT EXECUTE ON FUNCTION public.rpc_registrar_prestamo(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_renovar_prestamo(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_registrar_devolucion(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_pagar_multa(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.actualizar_estados_por_vencimiento() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_prestamos_por_rango(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_encargado() TO authenticated;
GRANT EXECUTE ON FUNCTION public.calcular_multa(bigint, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_dia_habil(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sumar_dias_habiles(date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dias_habiles_entre(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validar_rut_chileno(text) TO authenticated;

