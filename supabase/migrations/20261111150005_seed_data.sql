-- =============================================================================
-- MIGRACIÓN 5: DATOS DE PRUEBA (SEED DATA)
-- Fuente feriados: Ley N° 2.977 y leyes complementarias (BCN Chile / feriados.cl)
-- Encargado UUID: b22fd2b2-2918-4691-aeb3-72e8e71c81f3
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FERIADOS OFICIALES CHILE 2026 y 2027
-- Fuente normativa: Biblioteca del Congreso Nacional de Chile (BCN) / feriados.cl
-- -----------------------------------------------------------------------------
INSERT INTO public.feriado (fecha, nombre) VALUES
  -- 2026
  ('2026-01-01', 'Año Nuevo (Irrenunciable)'),
  ('2026-04-03', 'Viernes Santo'),
  ('2026-04-04', 'Sábado Santo'),
  ('2026-05-01', 'Día Nacional del Trabajo (Irrenunciable)'),
  ('2026-05-21', 'Día de las Glorias Navales'),
  ('2026-06-29', 'San Pedro y San Pablo'),
  ('2026-07-16', 'Día de la Virgen del Carmen'),
  ('2026-08-15', 'Asunción de la Virgen'),
  ('2026-09-18', 'Fiestas Patrias / Independencia Nacional (Irrenunciable)'),
  ('2026-09-19', 'Día de las Glorias del Ejército (Irrenunciable)'),
  ('2026-10-12', 'Encuentro de Dos Mundos'),
  ('2026-10-31', 'Día de las Iglesias Evangélicas y Protestantes'),
  ('2026-11-01', 'Día de Todos los Santos'),
  ('2026-12-08', 'Inmaculada Concepción'),
  ('2026-12-25', 'Navidad (Irrenunciable)'),
  -- 2027
  ('2027-01-01', 'Año Nuevo (Irrenunciable)'),
  ('2027-03-26', 'Viernes Santo'),
  ('2027-03-27', 'Sábado Santo'),
  ('2027-05-01', 'Día Nacional del Trabajo (Irrenunciable)'),
  ('2027-05-21', 'Día de las Glorias Navales'),
  ('2027-06-28', 'San Pedro y San Pablo'),
  ('2027-07-16', 'Día de la Virgen del Carmen'),
  ('2027-08-15', 'Asunción de la Virgen'),
  ('2027-09-18', 'Independencia Nacional (Irrenunciable)'),
  ('2027-09-19', 'Día de las Glorias del Ejército (Irrenunciable)'),
  ('2027-10-12', 'Encuentro de Dos Mundos'),
  ('2027-10-31', 'Día de las Iglesias Evangélicas y Protestantes'),
  ('2027-11-01', 'Día de Todos los Santos'),
  ('2027-12-08', 'Inmaculada Concepción'),
  ('2027-12-25', 'Navidad (Irrenunciable)')
ON CONFLICT (fecha) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. LIBROS (15) - TEST DATA
-- -----------------------------------------------------------------------------
INSERT INTO public.libro (codigo, titulo, autor, editorial, anio, estado) VALUES
  ('LIB-001', 'Cien años de soledad', 'Gabriel García Márquez', 'Sudamericana', 1967, 'Disponible'),
  ('LIB-002', 'El principito', 'Antoine de Saint-Exupéry', 'Reynal & Hitchcock', 1943, 'Disponible'),
  ('LIB-003', 'Don Quijote de la Mancha', 'Miguel de Cervantes', 'Francisco de Robles', 1605, 'Disponible'),
  ('LIB-004', 'La casa de los espíritus', 'Isabel Allende', 'Plaza & Janés', 1982, 'Disponible'),
  ('LIB-005', 'Subsole', 'Baldomero Lillo', 'Imprenta Moderna', 1907, 'En reparacion'),
  ('LIB-006', 'Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'Prentice Hall', 2008, 'Disponible'),
  ('LIB-007', 'Design Patterns: Elements of Reusable Object-Oriented Software', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', 'Addison-Wesley', 1994, 'Disponible'),
  ('LIB-008', 'Refactoring: Improving the Design of Existing Code', 'Martin Fowler', 'Addison-Wesley', 1999, 'Disponible'),
  ('LIB-009', 'Ficciones', 'Jorge Luis Borges', 'Sur', 1944, 'Disponible'),
  ('LIB-010', 'Rayuela', 'Julio Cortázar', 'Sudamericana', 1963, 'Disponible'),
  ('LIB-011', 'Introduction to Algorithms (CLRS)', 'Thomas H. Cormen et al.', 'MIT Press', 2009, 'Disponible'),
  ('LIB-012', 'Desolación', 'Gabriela Mistral', 'Instituto de las Españas', 1922, 'Disponible'),
  ('LIB-013', 'Veinte poemas de amor y una canción desesperada', 'Pablo Neruda', 'Nascimento', 1924, 'En reparacion'),
  ('LIB-014', 'Crónica de una muerte anunciada', 'Gabriel García Márquez', 'Oveja Negra', 1981, 'Disponible'),
  ('LIB-015', 'Database System Concepts', 'Abraham Silberschatz', 'McGraw-Hill', 2019, 'Disponible')
ON CONFLICT (codigo) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. USUARIOS (12) - TEST DATA
-- Todos con RUTs válidos verificados con algoritmo Módulo 11 (validar_rut_chileno)
-- -----------------------------------------------------------------------------
INSERT INTO public.usuario (rut, nombre, correo, tipo, estado, motivo_bloqueo) VALUES
  ('11.111.111-1', 'Camila Sepúlveda Morales',      'c.sepulveda@universidad.cl',  'Estudiante', 'Habilitado', NULL),
  ('12.345.678-5', 'Matías Valenzuela Ríos',         'm.valenzuela@universidad.cl', 'Estudiante', 'Habilitado', NULL),
  ('15.432.198-5', 'Dra. Andrea Larraguibel Díaz',   'a.larraguibel@universidad.cl','Docente',    'Habilitado', NULL),
  ('16.789.012-1', 'Nicolás Fuenzalida Parra',       'n.fuenzalida@universidad.cl', 'Estudiante', 'Bloqueado',  'Préstamo con entrega vencida.'),
  ('17.654.321-3', 'Prof. Roberto Carrasco Vidal',   'r.carrasco@universidad.cl',   'Docente',    'Bloqueado',  'Préstamo con entrega vencida.'),
  ('18.123.456-3', 'Valentina Soto Araya',           'v.soto@universidad.cl',       'Estudiante', 'Habilitado', NULL),
  ('19.234.567-7', 'Benjamín Muñoz Bravo',           'b.munoz@universidad.cl',      'Estudiante', 'Habilitado', NULL),
  ('14.567.890-0', 'Prof. Felipe Espinoza Castro',   'f.espinoza@universidad.cl',   'Docente',    'Habilitado', NULL),
  ('20.345.678-6', 'Isidora Godoy Navarrete',        'i.godoy@universidad.cl',      'Estudiante', 'Habilitado', NULL),
  ('21.456.789-K', 'Lucas Herrera Palma',            'l.herrera@universidad.cl',    'Estudiante', 'Habilitado', NULL),
  ('13.876.543-1', 'Dra. Marcela Quintana Rojas',    'm.quintana@universidad.cl',   'Docente',    'Habilitado', NULL),
  ('22.567.890-1', 'Diego Salgado Núñez',            'd.salgado@universidad.cl',    'Estudiante', 'Habilitado', NULL)
ON CONFLICT (rut) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. PRÉSTAMOS (10) Y MULTAS (2) - TEST DATA
-- Encargado asignado: b22fd2b2-2918-4691-aeb3-72e8e71c81f3 (admin)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_enc UUID := 'b22fd2b2-2918-4691-aeb3-72e8e71c81f3';
  v_usr_camila   BIGINT; v_usr_matias   BIGINT; v_usr_andrea   BIGINT;
  v_usr_nicolas  BIGINT; v_usr_roberto  BIGINT; v_usr_vale     BIGINT;
  v_usr_diego    BIGINT; v_usr_felipe   BIGINT; v_usr_isidora  BIGINT;
  v_usr_lucas    BIGINT;
  v_lib_001 BIGINT; v_lib_002 BIGINT; v_lib_003 BIGINT; v_lib_004 BIGINT;
  v_lib_006 BIGINT; v_lib_007 BIGINT; v_lib_008 BIGINT; v_lib_009 BIGINT;
  v_lib_011 BIGINT; v_lib_014 BIGINT;
  v_prest_1 BIGINT; v_prest_7 BIGINT; v_prest_4 BIGINT;
BEGIN
  -- Obtener IDs de usuarios
  SELECT id INTO v_usr_camila  FROM public.usuario WHERE rut = '11.111.111-1';
  SELECT id INTO v_usr_matias  FROM public.usuario WHERE rut = '12.345.678-5';
  SELECT id INTO v_usr_andrea  FROM public.usuario WHERE rut = '15.432.198-5';
  SELECT id INTO v_usr_nicolas FROM public.usuario WHERE rut = '16.789.012-1';
  SELECT id INTO v_usr_roberto FROM public.usuario WHERE rut = '17.654.321-3';
  SELECT id INTO v_usr_vale    FROM public.usuario WHERE rut = '18.123.456-3';
  SELECT id INTO v_usr_diego   FROM public.usuario WHERE rut = '22.567.890-1';
  SELECT id INTO v_usr_felipe  FROM public.usuario WHERE rut = '14.567.890-0';
  SELECT id INTO v_usr_isidora FROM public.usuario WHERE rut = '20.345.678-6';
  SELECT id INTO v_usr_lucas   FROM public.usuario WHERE rut = '21.456.789-K';

  -- Obtener IDs de libros
  SELECT id INTO v_lib_001 FROM public.libro WHERE codigo = 'LIB-001';
  SELECT id INTO v_lib_002 FROM public.libro WHERE codigo = 'LIB-002';
  SELECT id INTO v_lib_003 FROM public.libro WHERE codigo = 'LIB-003';
  SELECT id INTO v_lib_004 FROM public.libro WHERE codigo = 'LIB-004';
  SELECT id INTO v_lib_006 FROM public.libro WHERE codigo = 'LIB-006';
  SELECT id INTO v_lib_007 FROM public.libro WHERE codigo = 'LIB-007';
  SELECT id INTO v_lib_008 FROM public.libro WHERE codigo = 'LIB-008';
  SELECT id INTO v_lib_009 FROM public.libro WHERE codigo = 'LIB-009';
  SELECT id INTO v_lib_011 FROM public.libro WHERE codigo = 'LIB-011';
  SELECT id INTO v_lib_014 FROM public.libro WHERE codigo = 'LIB-014';

  -- PRÉSTAMO 1: Activo VENCIDO - Nicolás Fuenzalida (Estudiante)
  INSERT INTO public.prestamo (usuario_id, libro_id, encargado_id, fecha_prestamo, fecha_vencimiento, fecha_devolucion, renovado)
  VALUES (v_usr_nicolas, v_lib_001, v_enc, '2026-10-15', '2026-10-22', NULL, false)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_prest_1;
  UPDATE public.libro SET estado = 'Prestado' WHERE id = v_lib_001;

  -- PRÉSTAMO 2: Activo al día - Camila Sepúlveda
  INSERT INTO public.prestamo (usuario_id, libro_id, encargado_id, fecha_prestamo, fecha_vencimiento, fecha_devolucion, renovado)
  VALUES (v_usr_camila, v_lib_004, v_enc, '2026-11-08', '2026-11-16', NULL, false)
  ON CONFLICT DO NOTHING;
  UPDATE public.libro SET estado = 'Prestado' WHERE id = v_lib_004;

  -- PRÉSTAMO 3: Activo docente renovado - Dra. Andrea Larraguibel
  INSERT INTO public.prestamo (usuario_id, libro_id, encargado_id, fecha_prestamo, fecha_vencimiento, fecha_devolucion, renovado)
  VALUES (v_usr_andrea, v_lib_006, v_enc, '2026-11-03', '2026-11-17', NULL, true)
  ON CONFLICT DO NOTHING;
  UPDATE public.libro SET estado = 'Prestado' WHERE id = v_lib_006;

  -- PRÉSTAMO 4: Activo VENCIDO - Prof. Roberto Carrasco (Docente)
  INSERT INTO public.prestamo (usuario_id, libro_id, encargado_id, fecha_prestamo, fecha_vencimiento, fecha_devolucion, renovado)
  VALUES (v_usr_roberto, v_lib_008, v_enc, '2026-10-01', '2026-10-16', NULL, false)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_prest_4;
  UPDATE public.libro SET estado = 'Prestado' WHERE id = v_lib_008;

  -- PRÉSTAMO 5: Activo al día - Diego Salgado
  INSERT INTO public.prestamo (usuario_id, libro_id, encargado_id, fecha_prestamo, fecha_vencimiento, fecha_devolucion, renovado)
  VALUES (v_usr_diego, v_lib_011, v_enc, '2026-11-09', '2026-11-18', NULL, false)
  ON CONFLICT DO NOTHING;
  UPDATE public.libro SET estado = 'Prestado' WHERE id = v_lib_011;

  -- PRÉSTAMO 6: Devuelto a tiempo - Matías Valenzuela
  INSERT INTO public.prestamo (usuario_id, libro_id, encargado_id, fecha_prestamo, fecha_vencimiento, fecha_devolucion, renovado)
  VALUES (v_usr_matias, v_lib_002, v_enc, '2026-09-01', '2026-09-08', '2026-09-07', false)
  ON CONFLICT DO NOTHING;

  -- PRÉSTAMO 7: Devuelto con atraso - Valentina Soto (generó multa pagada)
  INSERT INTO public.prestamo (usuario_id, libro_id, encargado_id, fecha_prestamo, fecha_vencimiento, fecha_devolucion, renovado)
  VALUES (v_usr_vale, v_lib_003, v_enc, '2026-09-10', '2026-09-17', '2026-09-22', false)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_prest_7;

  -- PRÉSTAMO 8: Devuelto a tiempo - Prof. Felipe Espinoza
  INSERT INTO public.prestamo (usuario_id, libro_id, encargado_id, fecha_prestamo, fecha_vencimiento, fecha_devolucion, renovado)
  VALUES (v_usr_felipe, v_lib_007, v_enc, '2026-08-03', '2026-08-17', '2026-08-14', false)
  ON CONFLICT DO NOTHING;

  -- PRÉSTAMO 9: Devuelto a tiempo - Isidora Godoy
  INSERT INTO public.prestamo (usuario_id, libro_id, encargado_id, fecha_prestamo, fecha_vencimiento, fecha_devolucion, renovado)
  VALUES (v_usr_isidora, v_lib_009, v_enc, '2026-07-06', '2026-07-13', '2026-07-10', false)
  ON CONFLICT DO NOTHING;

  -- PRÉSTAMO 10: Devuelto a tiempo - Lucas Herrera
  INSERT INTO public.prestamo (usuario_id, libro_id, encargado_id, fecha_prestamo, fecha_vencimiento, fecha_devolucion, renovado)
  VALUES (v_usr_lucas, v_lib_014, v_enc, '2026-06-01', '2026-06-08', '2026-06-08', false)
  ON CONFLICT DO NOTHING;

  -- Si v_prest_1 o v_prest_7 fueron creados anteriormente, resolver sus IDs:
  IF v_prest_1 IS NULL THEN
    SELECT id INTO v_prest_1 FROM public.prestamo WHERE usuario_id = v_usr_nicolas AND libro_id = v_lib_001;
  END IF;
  IF v_prest_7 IS NULL THEN
    SELECT id INTO v_prest_7 FROM public.prestamo WHERE usuario_id = v_usr_vale AND libro_id = v_lib_003;
  END IF;

  -- MULTA 1 PENDIENTE: Nicolás Fuenzalida (préstamo 1 activo vencido, 4 días de atraso)
  IF v_prest_1 IS NOT NULL THEN
    INSERT INTO public.multa (prestamo_id, dias_atraso, monto, pagada, fecha_pago)
    VALUES (v_prest_1, 4, 4000, false, NULL)
    ON CONFLICT (prestamo_id) DO NOTHING;
  END IF;

  -- MULTA 2 PAGADA: Valentina Soto (préstamo 7, devuelto con atraso)
  IF v_prest_7 IS NOT NULL THEN
    INSERT INTO public.multa (prestamo_id, dias_atraso, monto, pagada, fecha_pago)
    VALUES (v_prest_7, 2, 2000, true, '2026-09-23')
    ON CONFLICT (prestamo_id) DO NOTHING;
  END IF;

END;
$$;
