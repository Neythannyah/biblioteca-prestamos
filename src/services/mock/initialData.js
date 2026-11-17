import { FERIADOS_OFICIALES_CHILE } from '../../domain/calendario.js'

export const SEED_LIBROS = [
  { id: 'lib_1', codigo: 'LIB-001', titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez', editorial: 'Sudamericana', anio: 1967, estado: 'Prestado' },
  { id: 'lib_2', codigo: 'LIB-002', titulo: 'El principito', autor: 'Antoine de Saint-Exupéry', editorial: 'Reynal & Hitchcock', anio: 1943, estado: 'Disponible' },
  { id: 'lib_3', codigo: 'LIB-003', titulo: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes', editorial: 'Francisco de Robles', anio: 1605, estado: 'Disponible' },
  { id: 'lib_4', codigo: 'LIB-004', titulo: 'La casa de los espíritus', autor: 'Isabel Allende', editorial: 'Plaza & Janés', anio: 1982, estado: 'Prestado' },
  { id: 'lib_5', codigo: 'LIB-005', titulo: 'Subsole', autor: 'Baldomero Lillo', editorial: 'Imprenta Moderna', anio: 1907, estado: 'En reparación' },
  { id: 'lib_6', codigo: 'LIB-006', titulo: 'Clean Code: A Handbook of Agile Software Craftsmanship', autor: 'Robert C. Martin', editorial: 'Prentice Hall', anio: 2008, estado: 'Prestado' },
  { id: 'lib_7', codigo: 'LIB-007', titulo: 'Design Patterns: Elements of Reusable Object-Oriented Software', autor: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', editorial: 'Addison-Wesley', anio: 1994, estado: 'Disponible' },
  { id: 'lib_8', codigo: 'LIB-008', titulo: 'Refactoring: Improving the Design of Existing Code', autor: 'Martin Fowler', editorial: 'Addison-Wesley', anio: 1999, estado: 'Prestado' },
  { id: 'lib_9', codigo: 'LIB-009', titulo: 'Ficciones', autor: 'Jorge Luis Borges', editorial: 'Sur', anio: 1944, estado: 'Disponible' },
  { id: 'lib_10', codigo: 'LIB-010', titulo: 'Rayuela', autor: 'Julio Cortázar', editorial: 'Sudamericana', anio: 1963, estado: 'Disponible' },
  { id: 'lib_11', codigo: 'LIB-011', titulo: 'Introduction to Algorithms (CLRS)', autor: 'Thomas H. Cormen et al.', editorial: 'MIT Press', anio: 2009, estado: 'Prestado' },
  { id: 'lib_12', codigo: 'LIB-012', titulo: 'Desolación', autor: 'Gabriela Mistral', editorial: 'Instituto de las Españas', anio: 1922, estado: 'Disponible' },
  { id: 'lib_13', codigo: 'LIB-013', titulo: 'Veinte poemas de amor y una canción desesperada', autor: 'Pablo Neruda', editorial: 'Nascimento', anio: 1924, estado: 'En reparación' },
  { id: 'lib_14', codigo: 'LIB-014', titulo: 'Crónica de una muerte anunciada', autor: 'Gabriel García Márquez', editorial: 'Oveja Negra', anio: 1981, estado: 'Disponible' },
  { id: 'lib_15', codigo: 'LIB-015', titulo: 'Database System Concepts', autor: 'Abraham Silberschatz', editorial: 'McGraw-Hill', anio: 2019, estado: 'Disponible' }
]

export const SEED_USUARIOS = [
  { id: 'usr_1', rut: '11.111.111-1', nombre: 'Camila Sepúlveda Morales', correo: 'c.sepulveda@universidad.cl', tipo: 'Estudiante', estado: 'Habilitado', motivo_bloqueo: null },
  { id: 'usr_2', rut: '12.345.678-5', nombre: 'Matías Valenzuela Ríos', correo: 'm.valenzuela@universidad.cl', tipo: 'Estudiante', estado: 'Habilitado', motivo_bloqueo: null },
  { id: 'usr_3', rut: '15.432.198-3', nombre: 'Dra. Andrea Larraguibel Díaz', correo: 'a.larraguibel@universidad.cl', tipo: 'Docente', estado: 'Habilitado', motivo_bloqueo: null },
  { id: 'usr_4', rut: '16.789.012-K', nombre: 'Nicolás Fuenzalida Parra', correo: 'n.fuenzalida@universidad.cl', tipo: 'Estudiante', estado: 'Bloqueado', motivo_bloqueo: 'Tiene 1 multa(s) pendiente(s) por un total de $4.000; Préstamo con entrega vencida.' },
  { id: 'usr_5', rut: '17.654.321-7', nombre: 'Prof. Roberto Carrasco Vidal', correo: 'r.carrasco@universidad.cl', tipo: 'Docente', estado: 'Habilitado', motivo_bloqueo: null },
  { id: 'usr_6', rut: '18.123.456-0', nombre: 'Valentina Soto Araya', correo: 'v.soto@universidad.cl', tipo: 'Estudiante', estado: 'Habilitado', motivo_bloqueo: null },
  { id: 'usr_7', rut: '19.234.567-9', nombre: 'Benjamín Muñoz Bravo', correo: 'b.munoz@universidad.cl', tipo: 'Estudiante', estado: 'Habilitado', motivo_bloqueo: null },
  { id: 'usr_8', rut: '14.567.890-2', nombre: 'Prof. Felipe Espinoza Castro', correo: 'f.espinoza@universidad.cl', tipo: 'Docente', estado: 'Habilitado', motivo_bloqueo: null },
  { id: 'usr_9', rut: '20.345.678-4', nombre: 'Isidora Godoy Navarrete', correo: 'i.godoy@universidad.cl', tipo: 'Estudiante', estado: 'Habilitado', motivo_bloqueo: null },
  { id: 'usr_10', rut: '21.456.789-1', nombre: 'Lucas Herrera Palma', correo: 'l.herrera@universidad.cl', tipo: 'Estudiante', estado: 'Habilitado', motivo_bloqueo: null },
  { id: 'usr_11', rut: '13.876.543-8', nombre: 'Dra. Marcela Quintana Rojas', correo: 'm.quintana@universidad.cl', tipo: 'Docente', estado: 'Habilitado', motivo_bloqueo: null },
  { id: 'usr_12', rut: '22.567.890-6', nombre: 'Diego Salgado Núñez', correo: 'd.salgado@universidad.cl', tipo: 'Estudiante', estado: 'Habilitado', motivo_bloqueo: null }
]

export const SEED_PRESTAMOS = [
  // 1. Activo vencido (Nicolás Fuenzalida - Estudiante)
  {
    id: 'prest_1',
    codigo: 'PR-2026-001',
    libro_id: 'lib_1',
    libro_codigo: 'LIB-001',
    libro_titulo: 'Cien años de soledad',
    usuario_id: 'usr_4',
    usuario_nombre: 'Nicolás Fuenzalida Parra',
    usuario_rut: '16.789.012-K',
    usuario_tipo: 'Estudiante',
    fecha_prestamo: '2026-10-15',
    fecha_vencimiento: '2026-10-22',
    fecha_devolucion: null,
    renovado: false,
    estado: 'Activo'
  },
  // 2. Activo en curso al día (Camila Sepúlveda)
  {
    id: 'prest_2',
    codigo: 'PR-2026-002',
    libro_id: 'lib_4',
    libro_codigo: 'LIB-004',
    libro_titulo: 'La casa de los espíritus',
    usuario_id: 'usr_1',
    usuario_nombre: 'Camila Sepúlveda Morales',
    usuario_rut: '11.111.111-1',
    usuario_tipo: 'Estudiante',
    fecha_prestamo: '2026-11-08',
    fecha_vencimiento: '2026-11-16',
    fecha_devolucion: null,
    renovado: false,
    estado: 'Activo'
  },
  // 3. Activo docente en curso (Dra. Andrea Larraguibel)
  {
    id: 'prest_3',
    codigo: 'PR-2026-003',
    libro_id: 'lib_6',
    libro_codigo: 'LIB-006',
    libro_titulo: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    usuario_id: 'usr_3',
    usuario_nombre: 'Dra. Andrea Larraguibel Díaz',
    usuario_rut: '15.432.198-3',
    usuario_tipo: 'Docente',
    fecha_prestamo: '2026-11-03',
    fecha_vencimiento: '2026-11-17',
    fecha_devolucion: null,
    renovado: true,
    estado: 'Activo'
  },
  // 4. Activo vencido (Prof. Roberto Carrasco)
  {
    id: 'prest_4',
    codigo: 'PR-2026-004',
    libro_id: 'lib_8',
    libro_codigo: 'LIB-008',
    libro_titulo: 'Refactoring: Improving the Design of Existing Code',
    usuario_id: 'usr_5',
    usuario_nombre: 'Prof. Roberto Carrasco Vidal',
    usuario_rut: '17.654.321-7',
    usuario_tipo: 'Docente',
    fecha_prestamo: '2026-10-01',
    fecha_vencimiento: '2026-10-16',
    fecha_devolucion: null,
    renovado: false,
    estado: 'Activo'
  },
  // 5. Activo en curso (Diego Salgado)
  {
    id: 'prest_5',
    codigo: 'PR-2026-005',
    libro_id: 'lib_11',
    libro_codigo: 'LIB-011',
    libro_titulo: 'Introduction to Algorithms (CLRS)',
    usuario_id: 'usr_12',
    usuario_nombre: 'Diego Salgado Núñez',
    usuario_rut: '22.567.890-6',
    usuario_tipo: 'Estudiante',
    fecha_prestamo: '2026-11-09',
    fecha_vencimiento: '2026-11-16',
    fecha_devolucion: null,
    renovado: false,
    estado: 'Activo'
  },
  // 6. Devuelto a tiempo
  {
    id: 'prest_6',
    codigo: 'PR-2026-006',
    libro_id: 'lib_2',
    libro_codigo: 'LIB-002',
    libro_titulo: 'El principito',
    usuario_id: 'usr_2',
    usuario_nombre: 'Matías Valenzuela Ríos',
    usuario_rut: '12.345.678-5',
    usuario_tipo: 'Estudiante',
    fecha_prestamo: '2026-09-01',
    fecha_vencimiento: '2026-09-08',
    fecha_devolucion: '2026-09-07',
    renovado: false,
    estado: 'Devuelto'
  },
  // 7. Devuelto con atraso (generó multa pagada)
  {
    id: 'prest_7',
    codigo: 'PR-2026-007',
    libro_id: 'lib_3',
    libro_codigo: 'LIB-003',
    libro_titulo: 'Don Quijote de la Mancha',
    usuario_id: 'usr_6',
    usuario_nombre: 'Valentina Soto Araya',
    usuario_rut: '18.123.456-0',
    usuario_tipo: 'Estudiante',
    fecha_prestamo: '2026-09-10',
    fecha_vencimiento: '2026-09-17',
    fecha_devolucion: '2026-09-22',
    renovado: false,
    estado: 'Devuelto'
  },
  // 8. Devuelto a tiempo
  {
    id: 'prest_8',
    codigo: 'PR-2026-008',
    libro_id: 'lib_7',
    libro_codigo: 'LIB-007',
    libro_titulo: 'Design Patterns',
    usuario_id: 'usr_8',
    usuario_nombre: 'Prof. Felipe Espinoza Castro',
    usuario_rut: '14.567.890-2',
    usuario_tipo: 'Docente',
    fecha_prestamo: '2026-08-03',
    fecha_vencimiento: '2026-08-17',
    fecha_devolucion: '2026-08-14',
    renovado: false,
    estado: 'Devuelto'
  },
  // 9. Devuelto a tiempo
  {
    id: 'prest_9',
    codigo: 'PR-2026-009',
    libro_id: 'lib_9',
    libro_codigo: 'LIB-009',
    libro_titulo: 'Ficciones',
    usuario_id: 'usr_9',
    usuario_nombre: 'Isidora Godoy Navarrete',
    usuario_rut: '20.345.678-4',
    usuario_tipo: 'Estudiante',
    fecha_prestamo: '2026-07-06',
    fecha_vencimiento: '2026-07-13',
    fecha_devolucion: '2026-07-10',
    renovado: false,
    estado: 'Devuelto'
  },
  // 10. Devuelto a tiempo
  {
    id: 'prest_10',
    codigo: 'PR-2026-010',
    libro_id: 'lib_14',
    libro_codigo: 'LIB-014',
    libro_titulo: 'Crónica de una muerte anunciada',
    usuario_id: 'usr_10',
    usuario_nombre: 'Lucas Herrera Palma',
    usuario_rut: '21.456.789-1',
    usuario_tipo: 'Estudiante',
    fecha_prestamo: '2026-06-01',
    fecha_vencimiento: '2026-06-08',
    fecha_devolucion: '2026-06-08',
    renovado: false,
    estado: 'Devuelto'
  }
]

export const SEED_MULTAS = [
  // 1. Multa pendiente (Nicolás Fuenzalida, por devolución tardía previa)
  {
    id: 'multa_1',
    codigo: 'MLT-2026-001',
    prestamo_id: 'prest_1',
    usuario_id: 'usr_4',
    usuario_nombre: 'Nicolás Fuenzalida Parra',
    usuario_rut: '16.789.012-K',
    libro_id: 'lib_1',
    libro_titulo: 'Cien años de soledad',
    dias_atraso: 4,
    monto: 4000,
    estado: 'Pendiente',
    fecha_generacion: '2026-10-28',
    fecha_pago: null,
    comprobante_pago: null
  },
  // 2. Multa pagada (Valentina Soto, por préstamo 7)
  {
    id: 'multa_2',
    codigo: 'MLT-2026-002',
    prestamo_id: 'prest_7',
    usuario_id: 'usr_6',
    usuario_nombre: 'Valentina Soto Araya',
    usuario_rut: '18.123.456-0',
    libro_id: 'lib_3',
    libro_titulo: 'Don Quijote de la Mancha',
    dias_atraso: 2,
    monto: 2000,
    estado: 'Pagada',
    fecha_generacion: '2026-09-22',
    fecha_pago: '2026-09-23',
    comprobante_pago: 'REC-2026-001'
  }
]

export const SEED_CONFIG = {
  tarifaDiaria: 1000,
  plazoEstudiante: 5,
  plazoDocente: 10,
  modoConteo: 'habiles' // 'habiles' | 'calendario'
}

