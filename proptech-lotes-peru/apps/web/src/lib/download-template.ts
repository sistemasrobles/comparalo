/**
 * download-template.ts
 * Genera y descarga una plantilla Excel para cargar proyectos en ComparaLo.
 * Hojas incluidas:
 *   1. INSTRUCCIONES  – guía rápida de llenado
 *   2. PROYECTO       – datos principales del proyecto
 *   3. LOTES          – inventario de lotes/terrenos
 *   4. IMÁGENES       – URLs de imágenes del proyecto
 *   5. DOC_LEGALES    – documentos legales del proyecto
 *   6. CATÁLOGOS      – valores válidos para los campos tipo lista
 */

import * as XLSX from 'xlsx';

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */

function makeSheet(headers: string[], rows: (string | number | null)[][] = []): XLSX.WorkSheet {
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Estilo de encabezado (ancho mínimo por columna)
  const colWidths = headers.map((h) => ({ wch: Math.max(h.length + 4, 18) }));
  ws['!cols'] = colWidths;

  return ws;
}

/* ─────────────────────────────────────────
   Hoja 1 – INSTRUCCIONES
───────────────────────────────────────── */

function sheetInstrucciones(): XLSX.WorkSheet {
  const rows = [
    ['📋 INSTRUCCIONES DE USO – PLANTILLA DE CARGA DE PROYECTOS'],
    [''],
    ['Bienvenido/a a la plantilla de carga de proyectos de ComparaLo.pe'],
    ['Siga los pasos indicados para completar correctamente cada hoja.'],
    [''],
    ['PASOS:'],
    ['  1. Complete la hoja "PROYECTO" con los datos generales del proyecto.'],
    ['  2. Complete la hoja "LOTES" con cada lote/terreno disponible.'],
    ['  3. Complete la hoja "IMÁGENES" con las URLs de las fotos del proyecto.'],
    ['  4. Complete la hoja "DOC_LEGALES" con los documentos legales.'],
    ['  5. Revise la hoja "CATÁLOGOS" para conocer los valores permitidos en campos de lista.'],
    ['  6. Envíe el archivo completado al equipo de administración para su carga.'],
    [''],
    ['NOTAS IMPORTANTES:'],
    ['  • Los campos marcados con (*) son OBLIGATORIOS.'],
    ['  • No modifique los nombres de las hojas ni los encabezados.'],
    ['  • Para campos de tipo "Sí/No" use exactamente: SI o NO.'],
    ['  • Para campos de lista, use exactamente los valores indicados en la hoja CATÁLOGOS.'],
    ['  • Los precios deben ingresarse en SOLES (S/.) sin puntos ni comas.'],
    ['  • Las coordenadas deben ser decimales. Ej: lat=-12.0464, lng=-77.0428'],
    ['  • Las URLs de imágenes deben comenzar con http:// o https://'],
    [''],
    ['¿DUDAS? Contacte al equipo: soporte@comparalo.pe'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 80 }];
  return ws;
}

/* ─────────────────────────────────────────
   Hoja 2 – PROYECTO
───────────────────────────────────────── */

function sheetProyecto(): XLSX.WorkSheet {
  const headers = [
    // Identificación
    'nombre_proyecto (*)',
    'slug (*)',
    'nombre_inmobiliaria (*)',
    'nombre_ciudad (*)',
    'nombre_zona (*)',

    // Descripción
    'descripcion_corta',
    'descripcion_larga',

    // Precios
    'precio_min_soles (*)',
    'precio_max_soles (*)',
    'precio_m2_min',
    'precio_m2_max',
    'cuota_inicial_min',
    'cuota_mensual_estimada',
    'plazo_meses_estimado',

    // Tamaños de lote
    'area_min_m2',
    'area_max_m2',
    'total_lotes',

    // Ubicación
    'latitud',
    'longitud',
    'direccion_referencia',
    'tipo_acceso',
    'distancia_centro_ciudad_km',

    // Estado legal
    'estado_legal (*)',

    // Checklist legal (SI / NO)
    'legal_titulo_propiedad',
    'legal_independizacion',
    'legal_inscrito_sunarp',
    'legal_habilitacion_urbana',
    'legal_plano_aprobado',
    'legal_libre_cargas',

    // Servicios (SI / NO)
    'servicio_agua',
    'servicio_luz',
    'servicio_desague',
    'servicio_internet',
    'servicio_vigilancia',
    'servicio_areas_verdes',
    'servicio_vias_internas',
    'servicio_cerco_perimetrico',

    // Puntaje seguridad
    'puntaje_seguridad_0_100',

    // Valorización
    'valorizacion_estimada_pct',

    // Configuración
    'es_destacado',
    'esta_activo',
  ];

  const example = [
    // Ejemplo de fila de muestra
    'Residencial Las Palmas',            // nombre_proyecto
    'residencial-las-palmas',            // slug
    'Inmobiliaria Sol del Sur S.A.C.',   // nombre_inmobiliaria
    'Lima',                              // nombre_ciudad
    'Lurín',                             // nombre_zona
    'Lotes desde 90 m² con todos los servicios', // descripcion_corta
    'Proyecto residencial ubicado en la zona sur de Lima...', // descripcion_larga
    50000,                               // precio_min_soles
    150000,                              // precio_max_soles
    500,                                 // precio_m2_min
    1200,                                // precio_m2_max
    5000,                                // cuota_inicial_min
    800,                                 // cuota_mensual_estimada
    120,                                 // plazo_meses_estimado
    90,                                  // area_min_m2
    300,                                 // area_max_m2
    200,                                 // total_lotes
    -12.2751,                            // latitud
    -76.8741,                            // longitud
    'Av. Panamericana Sur Km 40',        // direccion_referencia
    'PISTA_ASFALTADA',                   // tipo_acceso
    40,                                  // distancia_centro_ciudad_km
    'INSCRITO_SUNARP',                   // estado_legal
    'SI',                                // legal_titulo_propiedad
    'SI',                                // legal_independizacion
    'SI',                                // legal_inscrito_sunarp
    'NO',                                // legal_habilitacion_urbana
    'SI',                                // legal_plano_aprobado
    'SI',                                // legal_libre_cargas
    'SI',                                // servicio_agua
    'SI',                                // servicio_luz
    'SI',                                // servicio_desague
    'NO',                                // servicio_internet
    'SI',                                // servicio_vigilancia
    'SI',                                // servicio_areas_verdes
    'SI',                                // servicio_vias_internas
    'SI',                                // servicio_cerco_perimetrico
    75,                                  // puntaje_seguridad_0_100
    8.5,                                 // valorizacion_estimada_pct
    'NO',                                // es_destacado
    'SI',                                // esta_activo
  ];

  return makeSheet(headers, [example]);
}

/* ─────────────────────────────────────────
   Hoja 3 – LOTES
───────────────────────────────────────── */

function sheetLotes(): XLSX.WorkSheet {
  const headers = [
    'slug_proyecto (*)',
    'codigo_lote (*)',
    'area_m2 (*)',
    'precio_soles (*)',
    'precio_m2',
    'estado (*)',
    'manzana',
    'fila',
  ];

  const examples = [
    ['residencial-las-palmas', 'A-01', 120, 62000, 516.67, 'DISPONIBLE', 'A', '01'],
    ['residencial-las-palmas', 'A-02', 150, 78000, 520.00, 'DISPONIBLE', 'A', '02'],
    ['residencial-las-palmas', 'B-01', 90,  48000, 533.33, 'RESERVADO',  'B', '01'],
    ['residencial-las-palmas', 'B-02', 200, 110000, 550.00, 'VENDIDO',   'B', '02'],
  ];

  return makeSheet(headers, examples);
}

/* ─────────────────────────────────────────
   Hoja 4 – IMÁGENES
───────────────────────────────────────── */

function sheetImagenes(): XLSX.WorkSheet {
  const headers = [
    'slug_proyecto (*)',
    'url_imagen (*)',
    'texto_alternativo',
    'orden',
    'es_imagen_principal',
  ];

  const examples = [
    ['residencial-las-palmas', 'https://ejemplo.com/img/portada.jpg',  'Vista principal del proyecto', 1, 'SI'],
    ['residencial-las-palmas', 'https://ejemplo.com/img/acceso.jpg',   'Acceso principal',             2, 'NO'],
    ['residencial-las-palmas', 'https://ejemplo.com/img/servicios.jpg','Servicios disponibles',        3, 'NO'],
  ];

  return makeSheet(headers, examples);
}

/* ─────────────────────────────────────────
   Hoja 5 – DOC_LEGALES
───────────────────────────────────────── */

function sheetDocLegales(): XLSX.WorkSheet {
  const headers = [
    'slug_proyecto (*)',
    'nombre_documento (*)',
    'tipo_documento (*)',
    'url_documento (*)',
  ];

  const examples = [
    ['residencial-las-palmas', 'Partida registral SUNARP', 'SUNARP',  'https://ejemplo.com/docs/sunarp.pdf'],
    ['residencial-las-palmas', 'Plano de lotización aprobado', 'PLANO', 'https://ejemplo.com/docs/plano.pdf'],
    ['residencial-las-palmas', 'Título de propiedad',         'TITULO', 'https://ejemplo.com/docs/titulo.pdf'],
  ];

  return makeSheet(headers, examples);
}

/* ─────────────────────────────────────────
   Hoja 6 – CATÁLOGOS
───────────────────────────────────────── */

function sheetCatalogos(): XLSX.WorkSheet {
  const rows: (string | null)[][] = [
    // Estado legal
    ['CAMPO: estado_legal', null, null],
    ['Valor', 'Descripción', null],
    ['TITULO_MATRIZ',       'Título matriz registrado', null],
    ['INDEPENDIZACION',     'En proceso de independización', null],
    ['INSCRITO_SUNARP',     'Inscrito en SUNARP', null],
    ['HABILITACION_URBANA', 'Con habilitación urbana aprobada', null],
    ['EN_TRAMITE',          'En trámite', null],
    ['SIN_DOCUMENTOS',      'Sin documentos aún', null],
    [null, null, null],

    // Tipo de acceso
    ['CAMPO: tipo_acceso', null, null],
    ['Valor', 'Descripción', null],
    ['PISTA_ASFALTADA', 'Pista completamente asfaltada', null],
    ['PISTA_AFIRMADA',  'Pista afirmada / trocha mejorada', null],
    ['TROCHA',          'Trocha sin asfaltar', null],
    ['MIXTO',           'Combinación de tipos de acceso', null],
    [null, null, null],

    // Estado del lote
    ['CAMPO: estado (lotes)', null, null],
    ['Valor', 'Descripción', null],
    ['DISPONIBLE', 'El lote está disponible para venta', null],
    ['RESERVADO',  'El lote está en proceso de reserva', null],
    ['VENDIDO',    'El lote ya fue vendido', null],
    [null, null, null],

    // Tipo de documento legal
    ['CAMPO: tipo_documento (doc_legales)', null, null],
    ['Valor', 'Descripción', null],
    ['SUNARP',  'Partida registral de SUNARP', null],
    ['TITULO',  'Título de propiedad', null],
    ['PLANO',   'Plano de lotización', null],
    ['MEMORIA', 'Memoria descriptiva', null],
    ['OTRO',    'Otro tipo de documento', null],
    [null, null, null],

    // Campos SI/NO
    ['CAMPOS SI / NO', null, null],
    ['Valor', 'Descripción', null],
    ['SI', 'Sí aplica / Sí disponible', null],
    ['NO', 'No aplica / No disponible', null],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 30 }, { wch: 40 }, { wch: 10 }];
  return ws;
}

/* ─────────────────────────────────────────
   Función principal de descarga
───────────────────────────────────────── */

export function downloadProjectTemplate(): void {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, sheetInstrucciones(), 'INSTRUCCIONES');
  XLSX.utils.book_append_sheet(wb, sheetProyecto(),      'PROYECTO');
  XLSX.utils.book_append_sheet(wb, sheetLotes(),         'LOTES');
  XLSX.utils.book_append_sheet(wb, sheetImagenes(),      'IMÁGENES');
  XLSX.utils.book_append_sheet(wb, sheetDocLegales(),    'DOC_LEGALES');
  XLSX.utils.book_append_sheet(wb, sheetCatalogos(),     'CATÁLOGOS');

  const fecha = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  XLSX.writeFile(wb, `comparalo_plantilla_proyectos_${fecha}.xlsx`);
}
