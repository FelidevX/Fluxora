import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TipoReporte } from "@/types/reportes";

interface Column {
  key: string;
  label: string;
  format?: (value: any) => string;
}

interface ExportConfig {
  tipo: TipoReporte;
  datos: any[];
  resumen: any;
  columnas: Column[];
  fechaInicio?: string;
  fechaFin?: string;
}

export class PDFExportService {
  /**
   * Genera y descarga un archivo PDF con formato profesional
   */
  static async exportar(config: ExportConfig): Promise<void> {
    const { tipo, datos, resumen, columnas, fechaInicio, fechaFin } = config;

    // Crear documento PDF en formato carta
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "letter",
    });

    let yPos = 20;

    // Encabezado principal
    yPos = this.agregarEncabezado(doc, tipo, fechaInicio, fechaFin, yPos);

    // Resumen ejecutivo
    yPos = this.agregarResumen(doc, tipo, resumen, yPos);

    // Verificar si necesitamos nueva página
    if (yPos > 150) {
      doc.addPage();
      yPos = 20;
    }

    // Tabla de datos
    this.agregarTablaDatos(doc, datos, columnas, yPos);

    // Pie de página en todas las páginas
    this.agregarPieDePagina(doc);

    // Descargar archivo
    const nombreArchivo = this.generarNombreArchivo(tipo);
    doc.save(nombreArchivo);
  }

  /**
   * Agrega el encabezado del documento
   */
  private static agregarEncabezado(
    doc: jsPDF,
    tipo: TipoReporte,
    fechaInicio?: string,
    fechaFin?: string,
    yPos: number = 20
  ): number {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Título principal
    doc.setFillColor(37, 99, 235); // bg-blue-600
    doc.rect(0, 0, pageWidth, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(`REPORTE DE ${tipo.toUpperCase()}`, pageWidth / 2, 15, {
      align: "center",
    });

    // Subtítulo con periodo
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    if (fechaInicio && fechaFin) {
      doc.text(`Periodo: ${fechaInicio} - ${fechaFin}`, pageWidth / 2, 25, {
        align: "center",
      });
    }

    // Resetear color de texto
    doc.setTextColor(0, 0, 0);

    // Información del documento
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Fecha de generación: ${new Date().toLocaleString("es-CL")}`,
      15,
      45
    );
    doc.text("Sistema: Fluxora - Gestión de Panadería", pageWidth - 15, 45, {
      align: "right",
    });

    return 55;
  }

  /**
   * Agrega el resumen ejecutivo
   */
  private static agregarResumen(
    doc: jsPDF,
    tipo: TipoReporte,
    resumen: any,
    yPos: number
  ): number {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Título de la sección
    doc.setFillColor(243, 244, 246); // bg-gray-100
    doc.rect(15, yPos, pageWidth - 30, 10, "F");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 41, 55); // text-gray-800
    doc.text("RESUMEN EJECUTIVO", 20, yPos + 7);

    yPos += 15;

    // Preparar datos del resumen según tipo
    const resumenData = this.prepararDatosResumen(tipo, resumen);

    // Crear tabla de resumen
    autoTable(doc, {
      startY: yPos,
      head: [["Métrica", "Valor"]],
      body: resumenData,
      theme: "striped",
      headStyles: {
        fillColor: [59, 130, 246], // bg-blue-500
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: "bold" },
        1: { cellWidth: 0, halign: "right" },
      },
      margin: { left: 15, right: 15 },
    });

    return (doc as any).lastAutoTable.finalY + 15;
  }

  /**
   * Prepara los datos del resumen según el tipo de reporte
   */
  private static prepararDatosResumen(
    tipo: TipoReporte,
    resumen: any
  ): string[][] {
    switch (tipo) {
      case "entregas":
        return [
          [
            "Total Entregas Realizadas",
            (resumen.totalEntregas || 0).toString(),
          ],
          [
            "Total Entregas Programadas",
            (resumen.totalProgramadas || 0).toString(),
          ],
          [
            "Kg Totales Entregados",
            `${(resumen.totalKilos || 0).toFixed(2)} kg`,
          ],
          [
            "Tasa de Completado",
            `${(resumen.porcentajeCompletado || 0).toFixed(2)}%`,
          ],
          [
            "Entregas Pendientes",
            (
              (resumen.totalProgramadas || 0) - (resumen.totalEntregas || 0)
            ).toString(),
          ],
        ];

      case "ventas":
        return [
          [
            "Ventas Totales",
            `$${(resumen.totalVentas || 0).toLocaleString("es-CL")}`,
          ],
          ["Kg Vendidos", `${(resumen.totalKilos || 0).toFixed(2)} kg`],
          ["Clientes Únicos", (resumen.totalClientes || 0).toString()],
          [
            "Venta Promedio",
            `$${(resumen.ventaPromedio || 0).toLocaleString("es-CL")}`,
          ],
        ];

      case "inventario":
        return [
          ["Total Productos", (resumen.totalRegistros || 0).toString()],
          ["Entradas", `${(resumen.totalEntradas || 0).toFixed(2)} kg`],
          ["Salidas", `${(resumen.totalSalidas || 0).toFixed(2)} kg`],
          ["Stock Actual", `${(resumen.stockTotal || 0).toFixed(2)} kg`],
        ];

      case "clientes":
        return [
          ["Total Clientes", (resumen.totalRegistros || 0).toString()],
          ["Compras Totales", (resumen.totalCompras || 0).toString()],
          ["Kg Totales", `${(resumen.totalKilos || 0).toFixed(2)} kg`],
          [
            "Valor Total",
            `$${(resumen.valorTotal || 0).toLocaleString("es-CL")}`,
          ],
        ];

      default:
        return [];
    }
  }

  /**
   * Agrega la tabla de datos principal
   */
  private static agregarTablaDatos(
    doc: jsPDF,
    datos: any[],
    columnas: Column[],
    yPos: number
  ): void {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Título de la sección
    doc.setFillColor(243, 244, 246);
    doc.rect(15, yPos, pageWidth - 30, 10, "F");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DETALLE DE DATOS", 20, yPos + 7);

    yPos += 15;

    // Preparar encabezados
    const headers = columnas.map((col) => col.label);

    // Preparar datos formateados
    const body = datos.map((row) =>
      columnas.map((col) => {
        const valor = row[col.key];

        // Si la columna tiene formato personalizado, úsalo
        if (col.format && valor !== null && valor !== undefined) {
          return col.format(valor);
        }

        // Formato por defecto según tipo de dato
        if (typeof valor === "number") {
          return valor.toLocaleString("es-CL");
        }

        return valor || "-";
      })
    );

    // Crear tabla
    const pageHeight = doc.internal.pageSize.getHeight();

    autoTable(doc, {
      startY: yPos,
      head: [headers],
      body: body,
      theme: "grid",
      headStyles: {
        fillColor: [37, 99, 235], // bg-blue-600
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // bg-gray-50
      },
      margin: { left: 15, right: 15, bottom: 25 }, // Margen inferior para el pie de página
      didDrawPage: (data) => {
        // Agregar número de página en cada página
        const pageCount = (doc as any).internal.getNumberOfPages();
        const currentPage = (doc as any).internal.getCurrentPageInfo()
          .pageNumber;

        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128); // text-gray-500
        doc.text(
          `Página ${currentPage} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      },
    });
  }

  /**
   * Agrega el pie de página
   */
  private static agregarPieDePagina(doc: jsPDF): void {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Línea superior del pie
      doc.setDrawColor(229, 231, 235); // border-gray-200
      doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);

      // Texto del pie
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text(
        "Este documento fue generado automáticamente por el Sistema Fluxora",
        pageWidth / 2,
        pageHeight - 12,
        { align: "center" }
      );

      doc.text(
        `Generado el ${new Date().toLocaleString("es-CL")}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );
    }
  }

  /**
   * Genera el nombre del archivo con fecha y hora
   */
  private static generarNombreArchivo(tipo: TipoReporte): string {
    const fecha = new Date();
    const fechaStr = fecha.toISOString().split("T")[0];
    const horaStr = fecha.toTimeString().split(" ")[0].replace(/:/g, "-");
    return `reporte_${tipo}_${fechaStr}_${horaStr}.pdf`;
  }
}
