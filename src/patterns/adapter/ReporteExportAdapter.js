import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Patrón Adapter: ReporteExportAdapter
 * Adapta conjuntos de datos JSON de reportes de negocio a diferentes formatos
 * de archivo físicos (PDF, Excel .xlsx, CSV) manteniendo desacoplada la lógica de presentación.
 */

export class ReporteExportAdapter {
  /**
   * Exporta datos en el formato solicitado
   * @param {Array<object>} datos - Array de filas a exportar
   * @param {'pdf'|'excel'|'csv'} formato
   * @param {object} opciones { titulo, columnas, nombreArchivo, subtitulo }
   */
  static exportar(datos, formato, opciones = {}) {
    const {
      titulo = 'Reporte del Sistema de Biblioteca',
      subtitulo = '',
      columnas = [],
      nombreArchivo = 'reporte_biblioteca'
    } = opciones

    if (!datos || datos.length === 0) {
      throw new Error('No hay datos disponibles para exportar.')
    }

    switch (formato.toLowerCase()) {
      case 'excel':
        return this.exportarExcel(datos, columnas, nombreArchivo, titulo)
      case 'csv':
        return this.exportarCSV(datos, columnas, nombreArchivo)
      case 'pdf':
        return this.exportarPDF(datos, columnas, nombreArchivo, titulo, subtitulo)
      default:
        throw new Error(`Formato no soportado: ${formato}`)
    }
  }

  /**
   * Prepara los datos aplanados según las columnas configuradas
   */
  static prepararFilas(datos, columnas) {
    if (!columnas || columnas.length === 0) {
      return datos
    }

    return datos.map(item => {
      const fila = {}
      columnas.forEach(col => {
        const val = typeof col.selector === 'function' ? col.selector(item) : item[col.key]
        fila[col.label || col.key] = val !== undefined && val !== null ? String(val) : ''
      })
      return fila
    })
  }

  /**
   * Exporta a formato Excel (.xlsx) usando la librería SheetJS (xlsx)
   */
  static exportarExcel(datos, columnas, nombreArchivo, titulo) {
    const filasPreparadas = this.prepararFilas(datos, columnas)
    const worksheet = XLSX.utils.json_to_sheet(filasPreparadas)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte')

    // Descargar archivo
    XLSX.writeFile(workbook, `${nombreArchivo}_${Date.now()}.xlsx`)
    return true
  }

  /**
   * Exporta a formato CSV delimitado por comas con BOM UTF-8 para compatibilidad Excel
   */
  static exportarCSV(datos, columnas, nombreArchivo) {
    const filasPreparadas = this.prepararFilas(datos, columnas)
    const worksheet = XLSX.utils.json_to_sheet(filasPreparadas)
    const csvContent = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' }) // Delimitador estándar para Chile/Excel

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${nombreArchivo}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return true
  }

  /**
   * Exporta a formato PDF profesional usando jsPDF y jspdf-autotable
   */
  static exportarPDF(datos, columnas, nombreArchivo, titulo, subtitulo) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    })

    // Paleta de colores oficial: Primary #6B4F3A -> RGB(107, 79, 58)
    const primaryRgb = [107, 79, 58]
    const secondaryRgb = [242, 235, 221] // Muted beige
    const textRgb = [59, 47, 39]

    // Encabezado
    doc.setFillColor(...primaryRgb)
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 50, 'F')

    doc.setTextColor(250, 246, 239)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('SISTEMA DE GESTIÓN DE BIBLIOTECA', 40, 32)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const fechaEmision = new Date().toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    doc.text(`Emisión: ${fechaEmision}`, doc.internal.pageSize.getWidth() - 170, 32)

    // Título del reporte
    doc.setTextColor(...textRgb)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(titulo, 40, 80)

    if (subtitulo) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(138, 123, 108) // Muted foreground
      doc.text(subtitulo, 40, 96)
    }

    // Cabeceras y filas de la tabla
    const headers = [columnas.map(c => c.label || c.key)]
    const body = datos.map(item => {
      return columnas.map(col => {
        const val = typeof col.selector === 'function' ? col.selector(item) : item[col.key]
        return val !== undefined && val !== null ? String(val) : ''
      })
    })

    const startY = subtitulo ? 110 : 95

    autoTable(doc, {
      head: headers,
      body: body,
      startY: startY,
      theme: 'grid',
      headStyles: {
        fillColor: primaryRgb,
        textColor: [250, 246, 239],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        textColor: textRgb
      },
      alternateRowStyles: {
        fillColor: secondaryRgb
      },
      styles: {
        cellPadding: 5,
        overflow: 'linebreak'
      },
      margin: { left: 40, right: 40, bottom: 40 }
    })

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(138, 123, 108)
      doc.text(
        `Página ${i} de ${pageCount} - Generado por el Sistema de Préstamo de Libros`,
        40,
        doc.internal.pageSize.getHeight() - 20
      )
    }

    doc.save(`${nombreArchivo}_${Date.now()}.pdf`)
    return true
  }
}

