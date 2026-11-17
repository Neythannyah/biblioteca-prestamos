-- Migración 2: Lógica de negocio en PostgreSQL (funciones, triggers, vistas de reportes y RPCs)
-- Archivo: 20261111150002_business_logic_and_functions.sql

-- 1. Helper: es_encargado() verifica si auth.uid() corresponde a un operador autorizado
CREATE OR REPLACE FUNCTION public.es_encargado()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.encargado WHERE id = auth.uid()
    );
$$;

-- 2. es_dia_habil(p_fecha): lunes a viernes y no registrado en feriados
CREATE OR REPLACE FUNCTION public.es_dia_habil(p_fecha date)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    v_dow integer;
BEGIN
    IF p_fecha IS NULL THEN
        RETURN false;
    END IF;

    -- 1 = Lunes ... 5 = Viernes, 6 = Sábado, 7 = Domingo
    v_dow := EXTRACT(ISODOW FROM p_fecha);

    IF v_dow > 5 THEN
        RETURN false;
    END IF;

    IF EXISTS (SELECT 1 FROM public.feriado WHERE fecha = p_fecha) THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$;

-- 3. sumar_dias_habiles(p_fecha_inicio, p_dias_habiles)
CREATE OR REPLACE FUNCTION public.sumar_dias_habiles(p_fecha_inicio date, p_dias_habiles integer)
RETURNS date
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    v_actual date := p_fecha_inicio;
    v_sumados integer := 0;
BEGIN
    IF p_dias_habiles <= 0 THEN
        RETURN p_fecha_inicio;
    END IF;

    WHILE v_sumados < p_dias_habiles LOOP
        v_actual := v_actual + 1;
        IF public.es_dia_habil(v_actual) THEN
            v_sumados := v_sumados + 1;
        END IF;
    END LOOP;

    RETURN v_actual;
END;
$$;

-- 4. dias_habiles_entre(p_desde, p_hasta)
CREATE OR REPLACE FUNCTION public.dias_habiles_entre(p_desde date, p_hasta date)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    v_count integer := 0;
BEGIN
    IF p_hasta <= p_desde THEN
        RETURN 0;
    END IF;

    SELECT COUNT(*)::integer INTO v_count
    FROM generate_series(p_desde + 1, p_hasta, '1 day'::interval) AS d
    WHERE public.es_dia_habil(d::date);

    RETURN v_count;
END;
$$;

-- 5. calcular_multa(p_prestamo_id, p_fecha_ref)
CREATE OR REPLACE FUNCTION public.calcular_multa(
    p_prestamo_id bigint,
    p_fecha_ref date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    dias_atraso integer,
    monto integer,
    tiene_atraso boolean
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    v_vencimiento date;
    v_devolucion date;
    v_fecha_comparacion date;
    v_tarifa integer;
    v_modo text;
    v_dias integer := 0;
BEGIN
    SELECT p.fecha_vencimiento, p.fecha_devolucion
    INTO v_vencimiento, v_devolucion
    FROM public.prestamo p
    WHERE p.id = p_prestamo_id;

    IF v_vencimiento IS NULL THEN
        RETURN QUERY SELECT 0, 0, false;
        RETURN;
    END IF;

    SELECT COALESCE((SELECT valor::integer FROM public.configuracion WHERE clave = 'tarifa_multa'), 1000)
    INTO v_tarifa;

    SELECT COALESCE((SELECT valor FROM public.configuracion WHERE clave = 'multa_modo'), 'habiles')
    INTO v_modo;

    v_fecha_comparacion := COALESCE(v_devolucion, p_fecha_ref);

    IF v_fecha_comparacion <= v_vencimiento THEN
        RETURN QUERY SELECT 0, 0, false;
        RETURN;
    END IF;

    IF v_modo = 'calendario' THEN
        v_dias := (v_fecha_comparacion - v_vencimiento);
    ELSE
        v_dias := public.dias_habiles_entre(v_vencimiento, v_fecha_comparacion);
    END IF;

    RETURN QUERY SELECT v_dias, (v_dias * v_tarifa), (v_dias > 0);
END;
$$;

-- 6. recalcular_estado_usuario(p_usuario_id)
CREATE OR REPLACE FUNCTION public.recalcular_estado_usuario(p_usuario_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prestamos_vencidos integer := 0;
    v_multas_pendientes integer := 0;
    v_deuda_total integer := 0;
    v_motivos text[] := ARRAY[]::text[];
    v_nuevo_estado text := 'Habilitado';
    v_motivo_final text := NULL;
BEGIN
    -- 1. Contar préstamos activos vencidos
    SELECT COUNT(*)::integer INTO v_prestamos_vencidos
    FROM public.prestamo
    WHERE usuario_id = p_usuario_id
      AND fecha_devolucion IS NULL
      AND fecha_vencimiento < CURRENT_DATE;

    -- 2. Contar multas pendientes y sumar deuda
    SELECT COUNT(*)::integer, COALESCE(SUM(m.monto), 0)::integer
    INTO v_multas_pendientes, v_deuda_total
    FROM public.multa m
    JOIN public.prestamo p ON m.prestamo_id = p.id
    WHERE p.usuario_id = p_usuario_id
      AND m.pagada = false;

    IF v_prestamos_vencidos > 0 THEN
        v_motivos := array_append(v_motivos, format('Tiene %s préstamo(s) activo(s) con fecha vencida', v_prestamos_vencidos));
    END IF;

    IF v_multas_pendientes > 0 THEN
        v_motivos := array_append(v_motivos, format('Tiene %s multa(s) pendiente(s) por un total de $%s', v_multas_pendientes, to_char(v_deuda_total, 'FM999G999G999')));
    END IF;

    IF array_length(v_motivos, 1) > 0 THEN
        v_nuevo_estado := 'Bloqueado';
        v_motivo_final := array_to_string(v_motivos, '; ');
    END IF;

    UPDATE public.usuario
    SET estado = v_nuevo_estado,
        motivo_bloqueo = v_motivo_final
    WHERE id = p_usuario_id;
END;
$$;

-- 7. Triggers automáticos para recalcular estado de usuario
CREATE OR REPLACE FUNCTION public.tr_prestamo_actualizar_estado_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM public.recalcular_estado_usuario(NEW.usuario_id);
    IF TG_OP = 'UPDATE' AND OLD.usuario_id <> NEW.usuario_id THEN
        PERFORM public.recalcular_estado_usuario(OLD.usuario_id);
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER tr_prestamo_sync_usuario
AFTER INSERT OR UPDATE ON public.prestamo
FOR EACH ROW EXECUTE FUNCTION public.tr_prestamo_actualizar_estado_usuario();

CREATE OR REPLACE FUNCTION public.tr_multa_actualizar_estado_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_usuario_id bigint;
BEGIN
    SELECT usuario_id INTO v_usuario_id
    FROM public.prestamo
    WHERE id = NEW.prestamo_id;

    IF v_usuario_id IS NOT NULL THEN
        PERFORM public.recalcular_estado_usuario(v_usuario_id);
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER tr_multa_sync_usuario
AFTER INSERT OR UPDATE ON public.multa
FOR EACH ROW EXECUTE FUNCTION public.tr_multa_actualizar_estado_usuario();

-- 8. actualizar_estados_por_vencimiento() -> Observer de base de datos
CREATE OR REPLACE FUNCTION public.actualizar_estados_por_vencimiento()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r RECORD;
    v_afectados integer := 0;
BEGIN
    FOR r IN
        SELECT DISTINCT usuario_id
        FROM public.prestamo
        WHERE fecha_devolucion IS NULL
          AND fecha_vencimiento < CURRENT_DATE
    LOOP
        PERFORM public.recalcular_estado_usuario(r.usuario_id);
        v_afectados := v_afectados + 1;
    END LOOP;

    RETURN v_afectados;
END;
$$;

-- 9. RPC: rpc_registrar_prestamo
CREATE OR REPLACE FUNCTION public.rpc_registrar_prestamo(
    p_usuario_id bigint,
    p_libro_id bigint
)
RETURNS public.prestamo
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_encargado_id uuid;
    v_usuario public.usuario%ROWTYPE;
    v_libro public.libro%ROWTYPE;
    v_dias integer;
    v_fecha_vencimiento date;
    v_prestamo public.prestamo%ROWTYPE;
BEGIN
    -- Validar sesión de Encargado
    v_encargado_id := auth.uid();
    IF v_encargado_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.encargado WHERE id = v_encargado_id) THEN
        RAISE EXCEPTION 'Acceso denegado: Operación permitida exclusivamente para el Encargado de Biblioteca.'
            USING ERRCODE = '42501';
    END IF;

    -- Validar y bloquear fila del usuario
    SELECT * INTO v_usuario FROM public.usuario WHERE id = p_usuario_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario con ID % no encontrado.', p_usuario_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Validar aptitud (Error 403 usuario bloqueado o moroso)
    IF v_usuario.estado = 'Bloqueado' THEN
        RAISE EXCEPTION 'Error 403 (Usuario Bloqueado): %', COALESCE(v_usuario.motivo_bloqueo, 'El usuario registra sanciones o morosidad activa.')
            USING ERRCODE = '28000';
    END IF;

    -- Validar libro disponible
    SELECT * INTO v_libro FROM public.libro WHERE id = p_libro_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Libro con ID % no encontrado.', p_libro_id
            USING ERRCODE = 'P0002';
    END IF;

    IF v_libro.estado <> 'Disponible' THEN
        RAISE EXCEPTION 'El libro "%" no está disponible para préstamo (Estado actual: %).', v_libro.titulo, v_libro.estado
            USING ERRCODE = '23505';
    END IF;

    -- Determinar días según tipo
    IF v_usuario.tipo = 'Docente' THEN
        SELECT COALESCE((SELECT valor::integer FROM public.configuracion WHERE clave = 'plazo_docente'), 10) INTO v_dias;
    ELSE
        SELECT COALESCE((SELECT valor::integer FROM public.configuracion WHERE clave = 'plazo_estudiante'), 5) INTO v_dias;
    END IF;

    v_fecha_vencimiento := public.sumar_dias_habiles(CURRENT_DATE, v_dias);

    -- Insertar préstamo
    INSERT INTO public.prestamo (
        usuario_id,
        libro_id,
        encargado_id,
        fecha_prestamo,
        fecha_vencimiento,
        renovado
    ) VALUES (
        p_usuario_id,
        p_libro_id,
        v_encargado_id,
        CURRENT_DATE,
        v_fecha_vencimiento,
        false
    ) RETURNING * INTO v_prestamo;

    -- Actualizar estado del libro
    UPDATE public.libro SET estado = 'Prestado' WHERE id = p_libro_id;

    RETURN v_prestamo;
END;
$$;

-- 10. RPC: rpc_renovar_prestamo
CREATE OR REPLACE FUNCTION public.rpc_renovar_prestamo(
    p_prestamo_id bigint
)
RETURNS public.prestamo
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_encargado_id uuid;
    v_prestamo public.prestamo%ROWTYPE;
    v_usuario public.usuario%ROWTYPE;
    v_dias integer;
    v_nueva_fecha date;
BEGIN
    -- Validar sesión de Encargado
    v_encargado_id := auth.uid();
    IF v_encargado_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.encargado WHERE id = v_encargado_id) THEN
        RAISE EXCEPTION 'Acceso denegado: Operación permitida exclusivamente para el Encargado de Biblioteca.'
            USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_prestamo FROM public.prestamo WHERE id = p_prestamo_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Préstamo con ID % no encontrado.', p_prestamo_id USING ERRCODE = 'P0002';
    END IF;

    IF v_prestamo.fecha_devolucion IS NOT NULL THEN
        RAISE EXCEPTION 'Rechazar renovación: El préstamo ya ha sido devuelto.' USING ERRCODE = '22000';
    END IF;

    IF v_prestamo.renovado THEN
        RAISE EXCEPTION 'Rechazar renovación: El préstamo ya ha utilizado su única renovación permitida.' USING ERRCODE = '22000';
    END IF;

    IF v_prestamo.fecha_vencimiento < CURRENT_DATE THEN
        RAISE EXCEPTION 'Rechazar renovación: No es posible renovar un préstamo que ya se encuentra vencido.' USING ERRCODE = '22000';
    END IF;

    SELECT * INTO v_usuario FROM public.usuario WHERE id = v_prestamo.usuario_id;
    IF v_usuario.estado = 'Bloqueado' THEN
        RAISE EXCEPTION 'Rechazar renovación: No se puede renovar préstamos a un usuario bloqueado.' USING ERRCODE = '28000';
    END IF;

    -- Calcular extensión por el mismo plazo original
    IF v_usuario.tipo = 'Docente' THEN
        SELECT COALESCE((SELECT valor::integer FROM public.configuracion WHERE clave = 'plazo_docente'), 10) INTO v_dias;
    ELSE
        SELECT COALESCE((SELECT valor::integer FROM public.configuracion WHERE clave = 'plazo_estudiante'), 5) INTO v_dias;
    END IF;

    v_nueva_fecha := public.sumar_dias_habiles(v_prestamo.fecha_vencimiento, v_dias);

    UPDATE public.prestamo
    SET fecha_vencimiento = v_nueva_fecha,
        renovado = true
    WHERE id = p_prestamo_id
    RETURNING * INTO v_prestamo;

    RETURN v_prestamo;
END;
$$;

-- 11. RPC: rpc_registrar_devolucion
CREATE OR REPLACE FUNCTION public.rpc_registrar_devolucion(
    p_prestamo_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_encargado_id uuid;
    v_prestamo public.prestamo%ROWTYPE;
    v_liq RECORD;
    v_multa public.multa%ROWTYPE;
BEGIN
    -- Validar sesión de Encargado
    v_encargado_id := auth.uid();
    IF v_encargado_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.encargado WHERE id = v_encargado_id) THEN
        RAISE EXCEPTION 'Acceso denegado: Operación permitida exclusivamente para el Encargado de Biblioteca.'
            USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_prestamo FROM public.prestamo WHERE id = p_prestamo_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Préstamo con ID % no encontrado.', p_prestamo_id USING ERRCODE = 'P0002';
    END IF;

    IF v_prestamo.fecha_devolucion IS NOT NULL THEN
        RAISE EXCEPTION 'Este préstamo ya fue devuelto previamente el %.', v_prestamo.fecha_devolucion USING ERRCODE = '22000';
    END IF;

    -- Liquidar morosidad
    SELECT * INTO v_liq FROM public.calcular_multa(p_prestamo_id, CURRENT_DATE);

    -- Registrar devolución en el préstamo
    UPDATE public.prestamo
    SET fecha_devolucion = CURRENT_DATE
    WHERE id = p_prestamo_id
    RETURNING * INTO v_prestamo;

    -- Marcar libro como Disponible
    UPDATE public.libro
    SET estado = 'Disponible'
    WHERE id = v_prestamo.libro_id;

    -- Si hubo atraso, crear multa y bloquear usuario
    IF v_liq.tiene_atraso AND v_liq.monto > 0 THEN
        INSERT INTO public.multa (
            prestamo_id,
            dias_atraso,
            monto,
            pagada,
            fecha_pago
        ) VALUES (
            p_prestamo_id,
            v_liq.dias_atraso,
            v_liq.monto,
            false,
            NULL
        ) RETURNING * INTO v_multa;
    END IF;

    -- Sincronizar estado del usuario
    PERFORM public.recalcular_estado_usuario(v_prestamo.usuario_id);

    RETURN jsonb_build_object(
        'prestamo_id', v_prestamo.id,
        'fecha_devolucion', v_prestamo.fecha_devolucion,
        'dias_atraso', v_liq.dias_atraso,
        'monto_multa', v_liq.monto,
        'tiene_multa', v_liq.tiene_atraso,
        'multa_id', v_multa.id
    );
END;
$$;

-- 12. RPC: rpc_pagar_multa
CREATE OR REPLACE FUNCTION public.rpc_pagar_multa(
    p_multa_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_encargado_id uuid;
    v_multa public.multa%ROWTYPE;
    v_usuario_id bigint;
BEGIN
    -- Validar sesión de Encargado
    v_encargado_id := auth.uid();
    IF v_encargado_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.encargado WHERE id = v_encargado_id) THEN
        RAISE EXCEPTION 'Acceso denegado: Operación permitida exclusivamente para el Encargado de Biblioteca.'
            USING ERRCODE = '42501';
    END IF;

    SELECT m.* INTO v_multa FROM public.multa m WHERE m.id = p_multa_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Multa con ID % no encontrada.', p_multa_id USING ERRCODE = 'P0002';
    END IF;

    IF v_multa.pagada THEN
        RAISE EXCEPTION 'La multa ya se encuentra pagada.' USING ERRCODE = '22000';
    END IF;

    -- Registrar pago total
    UPDATE public.multa
    SET pagada = true,
        fecha_pago = CURRENT_DATE
    WHERE id = p_multa_id
    RETURNING * INTO v_multa;

    -- Obtener usuario y recalcular estado
    SELECT usuario_id INTO v_usuario_id FROM public.prestamo WHERE id = v_multa.prestamo_id;
    IF v_usuario_id IS NOT NULL THEN
        PERFORM public.recalcular_estado_usuario(v_usuario_id);
    END IF;

    RETURN jsonb_build_object(
        'multa_id', v_multa.id,
        'monto_pagado', v_multa.monto,
        'fecha_pago', v_multa.fecha_pago,
        'pagada', true
    );
END;
$$;

-- 13. Vistas para Reportes (RF8) con security_invoker = true
CREATE OR REPLACE VIEW public.v_libros_prestados
WITH (security_invoker = true)
AS
SELECT
    p.id AS prestamo_id,
    l.id AS libro_id,
    l.codigo AS libro_codigo,
    l.titulo AS libro_titulo,
    l.autor AS libro_autor,
    u.id AS usuario_id,
    u.rut AS usuario_rut,
    u.nombre AS usuario_nombre,
    u.tipo AS usuario_tipo,
    p.fecha_prestamo,
    p.fecha_vencimiento,
    p.renovado
FROM public.prestamo p
JOIN public.libro l ON p.libro_id = l.id
JOIN public.usuario u ON p.usuario_id = u.id
WHERE p.fecha_devolucion IS NULL;

COMMENT ON VIEW public.v_libros_prestados IS 'Reporte de libros actualmente prestados en circulación';

CREATE OR REPLACE VIEW public.v_libros_con_retraso
WITH (security_invoker = true)
AS
SELECT
    p.id AS prestamo_id,
    l.codigo AS libro_codigo,
    l.titulo AS libro_titulo,
    u.rut AS usuario_rut,
    u.nombre AS usuario_nombre,
    u.tipo AS usuario_tipo,
    p.fecha_prestamo,
    p.fecha_vencimiento,
    public.dias_habiles_entre(p.fecha_vencimiento, CURRENT_DATE) AS dias_retraso,
    (public.dias_habiles_entre(p.fecha_vencimiento, CURRENT_DATE) *
     COALESCE((SELECT valor::integer FROM public.configuracion WHERE clave = 'tarifa_multa'), 1000)) AS multa_acumulada_estimada
FROM public.prestamo p
JOIN public.libro l ON p.libro_id = l.id
JOIN public.usuario u ON p.usuario_id = u.id
WHERE p.fecha_devolucion IS NULL
  AND p.fecha_vencimiento < CURRENT_DATE;

COMMENT ON VIEW public.v_libros_con_retraso IS 'Reporte de libros con retraso activo y cálculo de multa acumulada en vivo';

CREATE OR REPLACE VIEW public.v_usuarios_sancionados
WITH (security_invoker = true)
AS
SELECT
    u.id AS usuario_id,
    u.rut,
    u.nombre,
    u.correo,
    u.tipo,
    u.estado,
    u.motivo_bloqueo,
    (
        SELECT COALESCE(SUM(m.monto), 0)
        FROM public.multa m
        JOIN public.prestamo p ON m.prestamo_id = p.id
        WHERE p.usuario_id = u.id AND m.pagada = false
    ) AS total_deuda_multas,
    (
        SELECT COUNT(*)
        FROM public.prestamo p
        WHERE p.usuario_id = u.id AND p.fecha_devolucion IS NULL AND p.fecha_vencimiento < CURRENT_DATE
    ) AS prestamos_vencidos_conteo
FROM public.usuario u
WHERE u.estado = 'Bloqueado';

COMMENT ON VIEW public.v_usuarios_sancionados IS 'Reporte de usuarios sancionados o suspendidos por morosidad';

CREATE OR REPLACE FUNCTION public.rpc_prestamos_por_rango(
    p_desde date,
    p_hasta date
)
RETURNS TABLE (
    prestamo_id bigint,
    codigo_libro text,
    titulo_libro text,
    rut_usuario text,
    nombre_usuario text,
    fecha_prestamo date,
    fecha_vencimiento date,
    fecha_devolucion date,
    renovado boolean,
    estado_prestamo text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT
        p.id,
        l.codigo,
        l.titulo,
        u.rut,
        u.nombre,
        p.fecha_prestamo,
        p.fecha_vencimiento,
        p.fecha_devolucion,
        p.renovado,
        CASE
            WHEN p.fecha_devolucion IS NOT NULL THEN 'Devuelto'
            WHEN p.fecha_vencimiento < CURRENT_DATE THEN 'Vencido'
            ELSE 'Activo'
        END AS estado_prestamo
    FROM public.prestamo p
    JOIN public.libro l ON p.libro_id = l.id
    JOIN public.usuario u ON p.usuario_id = u.id
    WHERE (p_desde IS NULL OR p.fecha_prestamo >= p_desde)
      AND (p_hasta IS NULL OR p.fecha_prestamo <= p_hasta)
    ORDER BY p.fecha_prestamo DESC;
$$;

