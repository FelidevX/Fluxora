import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CompraMateriaPrimaResponse } from "@/types/inventario";

export class CompraPDFService {
  /**
   * Genera un PDF profesional para una compra de materia prima
   */
  static async exportarCompra(
    compra: CompraMateriaPrimaResponse
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "letter",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Colores corporativos
    const primaryColor: [number, number, number] = [37, 99, 235]; // Blue-600
    const secondaryColor: [number, number, number] = [243, 244, 246]; // Gray-100
    const textDark: [number, number, number] = [31, 41, 55]; // Gray-800

    // ==================== ENCABEZADO ====================
    // Fondo del encabezado
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 45, "F");

    // Logo/Nombre de empresa
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("FLUXORA", margin, 20);

    // Subtítulo
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Sistema de Gestión de Panadería", margin, 27);

    // Título del documento
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ORDEN DE COMPRA", pageWidth - margin, 20, { align: "right" });

    // Número de documento
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`${compra.tipoDoc} N° ${compra.numDoc}`, pageWidth - margin, 27, {
      align: "right",
    });

    // ==================== INFORMACIÓN DE LA COMPRA ====================
    let yPos = 55;

    // Tabla de información general
    const infoData = [
      ["Proveedor:", compra.proveedor],
      [
        "Fecha de Compra:",
        new Date(compra.fechaCompra).toLocaleDateString("es-ES"),
      ],
      [
        "Fecha de Pago:",
        compra.fechaPago
          ? new Date(compra.fechaPago).toLocaleDateString("es-ES")
          : "No definida",
      ],
      [
        "Estado de Pago:",
        compra.estadoPago === "PAGADO" ? "Pagado" : "Pendiente",
      ],
      ["Total de Lotes:", compra.totalLotes.toString()],
      [
        "Monto Total:",
        `$${compra.montoTotal.toLocaleString("es-CL", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`,
      ],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: infoData,
      theme: "plain",
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: {
          fontStyle: "bold",
          textColor: textDark,
          cellWidth: 40,
        },
        1: {
          textColor: textDark,
        },
      },
      margin: { left: margin, right: pageWidth / 2 + 5 },
    });

    // Cuadro resumen en el lado derecho
    const resumenY = yPos;
    const resumenX = pageWidth / 2 + 10;
    const resumenWidth = pageWidth - resumenX - margin;

    doc.setFillColor(...secondaryColor);
    doc.roundedRect(resumenX, resumenY, resumenWidth, 35, 3, 3, "F");

    doc.setFillColor(...primaryColor);
    doc.roundedRect(resumenX, resumenY, resumenWidth, 10, 3, 3, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMEN", resumenX + resumenWidth / 2, resumenY + 7, {
      align: "center",
    });

    doc.setTextColor(...textDark);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Total Items:", resumenX + 3, resumenY + 17);
    doc.setFont("helvetica", "bold");
    doc.text(
      compra.lotes.length.toString(),
      resumenX + resumenWidth - 3,
      resumenY + 17,
      { align: "right" }
    );

    doc.setFont("helvetica", "normal");
    doc.text("Monto Total:", resumenX + 3, resumenY + 24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(
      `$${compra.montoTotal.toLocaleString("es-CL")}`,
      resumenX + resumenWidth - 3,
      resumenY + 24,
      { align: "right" }
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Estado:", resumenX + 3, resumenY + 31);
    doc.setFont("helvetica", "bold");
    const estadoColor: [number, number, number] =
      compra.estadoPago === "PAGADO" ? [34, 197, 94] : [234, 179, 8];
    doc.setTextColor(...estadoColor);
    doc.text(compra.estadoPago, resumenX + resumenWidth - 3, resumenY + 31, {
      align: "right",
    });

    // ==================== DETALLE DE LOTES ====================
    yPos = (doc as any).lastAutoTable.finalY + 15;

    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DETALLE DE LOTES", margin, yPos);

    yPos += 5;

    // Preparar datos de la tabla
    const tableData = compra.lotes.map((lote, index) => [
      (index + 1).toString(),
      lote.materiaPrimaNombre || `ID: ${lote.materiaPrimaId}`,
      lote.numeroLote || "-",
      `${lote.cantidad} kg`,
      `${lote.stockActual || lote.cantidad} kg`,
      `$${lote.costoUnitario.toLocaleString("es-CL")}`,
      `$${(lote.cantidad * lote.costoUnitario).toLocaleString("es-CL")}`,
      lote.fechaVencimiento
        ? new Date(lote.fechaVencimiento).toLocaleDateString("es-ES")
        : "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [
        [
          "#",
          "Materia Prima",
          "N° Lote",
          "Cantidad",
          "Stock Actual",
          "Costo Unit.",
          "Subtotal",
          "Vencimiento",
        ],
      ],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 9,
        textColor: textDark,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { halign: "left", cellWidth: 40 },
        2: { halign: "center", cellWidth: 20 },
        3: { halign: "right", cellWidth: 20 },
        4: { halign: "right", cellWidth: 20 },
        5: { halign: "right", cellWidth: 22 },
        6: { halign: "right", cellWidth: 22 },
        7: { halign: "center", cellWidth: 25 },
      },
      alternateRowStyles: {
        fillColor: secondaryColor,
      },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        // Pie de página
        const pageCount = doc.getNumberOfPages();
        const currentPage = (doc as any).internal.getCurrentPageInfo()
          .pageNumber;

        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.setFont("helvetica", "normal");

        // Fecha de generación
        doc.text(
          `Generado: ${new Date().toLocaleString("es-ES")}`,
          margin,
          pageHeight - 10
        );

        // Número de página
        doc.text(
          `Página ${currentPage} de ${pageCount}`,
          pageWidth - margin,
          pageHeight - 10,
          { align: "right" }
        );
      },
    });

    // ==================== TOTALES FINALES ====================
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    if (finalY < pageHeight - 50) {
      const totalesX = pageWidth - margin - 60;

      // Línea separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(totalesX - 5, finalY, pageWidth - margin, finalY);

      // Subtotal
      doc.setFontSize(10);
      doc.setTextColor(...textDark);
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal:", totalesX, finalY + 8);
      doc.setFont("helvetica", "bold");
      doc.text(
        `$${compra.montoTotal.toLocaleString("es-CL")}`,
        pageWidth - margin,
        finalY + 8,
        { align: "right" }
      );

      // Total
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL:", totalesX, finalY + 16);
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.text(
        `$${compra.montoTotal.toLocaleString("es-CL")}`,
        pageWidth - margin,
        finalY + 16,
        { align: "right" }
      );
    }

    // ==================== NOTAS/OBSERVACIONES ====================
    if (finalY < pageHeight - 70) {
      const notasY = finalY + 30;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "italic");
      doc.text(
        "Nota: Este documento es un registro interno de la compra de materias primas.",
        margin,
        notasY
      );
      doc.text(
        "El stock actual puede variar si ya se ha utilizado parte del lote.",
        margin,
        notasY + 5
      );
    }

    // Guardar PDF
    const fileName = `Compra_${compra.tipoDoc}_${compra.numDoc}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(fileName);
  }

  /**
   * Exportar múltiples compras en un solo PDF
   */
  static async exportarVariasCompras(
    compras: CompraMateriaPrimaResponse[]
  ): Promise<void> {
    if (compras.length === 0) {
      throw new Error("No hay compras para exportar");
    }

    if (compras.length === 1) {
      return this.exportarCompra(compras[0]);
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "letter",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const primaryColor: [number, number, number] = [37, 99, 235];
    const textDark: [number, number, number] = [31, 41, 55];

    // Encabezado
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("REPORTE DE COMPRAS", pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total de compras: ${compras.length}`, pageWidth / 2, 23, {
      align: "center",
    });

    doc.text(
      `Generado: ${new Date().toLocaleDateString("es-ES")}`,
      pageWidth / 2,
      29,
      { align: "center" }
    );

    // Tabla de compras
    const tableData = compras.map((compra) => [
      `${compra.tipoDoc}\n${compra.numDoc}`,
      compra.proveedor,
      new Date(compra.fechaCompra).toLocaleDateString("es-ES"),
      compra.fechaPago
        ? new Date(compra.fechaPago).toLocaleDateString("es-ES")
        : "-",
      compra.estadoPago === "PAGADO" ? "✓ Pagado" : "⚠ Pendiente",
      compra.totalLotes.toString(),
      `$${compra.montoTotal.toLocaleString("es-CL")}`,
    ]);

    autoTable(doc, {
      startY: 45,
      head: [
        [
          "Documento",
          "Proveedor",
          "F. Compra",
          "F. Pago",
          "Estado",
          "Lotes",
          "Monto Total",
        ],
      ],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 9,
        textColor: textDark,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 30 },
        1: { halign: "left", cellWidth: 50 },
        2: { halign: "center", cellWidth: 25 },
        3: { halign: "center", cellWidth: 25 },
        4: { halign: "center", cellWidth: 30 },
        5: { halign: "center", cellWidth: 20 },
        6: { halign: "right", cellWidth: 30 },
      },
      margin: { left: margin, right: margin },
      didDrawPage: () => {
        const pageCount = doc.getNumberOfPages();
        const currentPage = (doc as any).internal.getCurrentPageInfo()
          .pageNumber;

        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Página ${currentPage} de ${pageCount}`,
          pageWidth - margin,
          pageHeight - 10,
          { align: "right" }
        );
      },
    });

    // Total general
    const totalGeneral = compras.reduce(
      (sum, compra) => sum + compra.montoTotal,
      0
    );
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text(
      `TOTAL GENERAL: $${totalGeneral.toLocaleString("es-CL")}`,
      pageWidth - margin,
      finalY,
      { align: "right" }
    );

    doc.save(`Reporte_Compras_${new Date().toISOString().split("T")[0]}.pdf`);
  }
}
