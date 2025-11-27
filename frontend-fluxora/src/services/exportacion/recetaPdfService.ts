import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RecetaMaestra } from "@/types/produccion";

export class RecetaPDFService {
  /**
   * Genera un PDF profesional para una receta
   */
  static async exportarReceta(receta: RecetaMaestra): Promise<void> {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "letter",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Colores corporativos
    const primaryColor: [number, number, number] = [139, 92, 246]; // Purple-500
    const secondaryColor: [number, number, number] = [243, 232, 255]; // Purple-100
    const textDark: [number, number, number] = [31, 41, 55]; // Gray-800

    // ==================== ENCABEZADO ====================
    // Fondo del encabezado
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 50, "F");

    // Logo/Nombre de empresa
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text("FLUXORA", margin, 20);

    // Subtítulo
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Receta Maestra", margin, 28);

    // Categoría
    doc.setFontSize(9);
    doc.setFillColor(255, 255, 255, 0.2);
    doc.roundedRect(margin, 32, 35, 7, 2, 2, "F");
    doc.text(receta.categoria, margin + 17.5, 36.5, { align: "center" });

    // Título de la receta
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const nombreX = pageWidth - margin;
    doc.text(receta.nombre, nombreX, 22, { align: "right" });

    // Fecha de creación
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Creado: ${new Date(receta.fechaCreacion).toLocaleDateString("es-ES")}`,
      nombreX,
      29,
      { align: "right" }
    );

    // Estado
    const estadoX = nombreX - 2;
    const estadoText = receta.activa ? "ACTIVA" : "INACTIVA";
    const estadoColor: [number, number, number] = receta.activa
      ? [34, 197, 94]
      : [239, 68, 68];
    doc.setFillColor(...estadoColor);
    doc.roundedRect(estadoX - 25, 32, 27, 7, 2, 2, "F");
    doc.text(estadoText, estadoX - 11.5, 36.5, { align: "center" });

    // ==================== INFORMACIÓN BÁSICA ====================
    let yPos = 60;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("INFORMACIÓN GENERAL", margin, yPos);

    yPos += 3;

    // Línea separadora
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 8;

    // Tabla de información
    const infoData = [
      ["Cantidad Base:", `${receta.cantidadBase} ${receta.unidadBase}`],
      ["Tiempo de Preparación:", `${receta.tiempoPreparacion} minutos`],
      [
        "Precio Estimado (Costo):",
        `$${(receta.precioEstimado || 0).toLocaleString("es-CL")}`,
      ],
      [
        `Precio de Venta (${receta.unidadBase}):`,
        `$${receta.precioUnidad.toLocaleString("es-CL")}`,
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
          cellWidth: 55,
        },
        1: {
          textColor: textDark,
        },
      },
      margin: { left: margin, right: margin },
    });

    // ==================== INGREDIENTES ====================
    yPos = (doc as any).lastAutoTable.finalY + 15;

    doc.setTextColor(...primaryColor);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("INGREDIENTES", margin, yPos);

    yPos += 3;

    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 5;

    // Calcular totales
    const costoTotal = receta.ingredientes.reduce(
      (sum, ing) => sum + (ing.costoParcial || 0),
      0
    );

    // Tabla de ingredientes
    const tableData = receta.ingredientes.map((ing, index) => [
      (index + 1).toString(),
      ing.materiaPrimaNombre,
      `${ing.cantidadNecesaria} ${ing.unidad}`,
      ing.esOpcional ? "Sí" : "No",
      ing.ppp
        ? `$${ing.ppp.toLocaleString("es-CL", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}/${ing.unidad}`
        : "-",
      ing.costoParcial
        ? `$${ing.costoParcial.toLocaleString("es-CL", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`
        : "-",
      ing.notas || "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [
        [
          "#",
          "Ingrediente",
          "Cantidad",
          "Opcional",
          "PPP",
          "Costo Parcial",
          "Notas",
        ],
      ],
      body: tableData,
      foot: [
        [
          "",
          "",
          "",
          "",
          "COSTO TOTAL:",
          `$${costoTotal.toLocaleString("es-CL", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`,
          "",
        ],
      ],
      theme: "striped",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        halign: "center",
      },
      footStyles: {
        fillColor: secondaryColor,
        textColor: textDark,
        fontStyle: "bold",
        fontSize: 10,
        halign: "right",
      },
      bodyStyles: {
        fontSize: 9,
        textColor: textDark,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { halign: "left", cellWidth: 45 },
        2: { halign: "center", cellWidth: 22 },
        3: { halign: "center", cellWidth: 18 },
        4: { halign: "right", cellWidth: 25 },
        5: { halign: "right", cellWidth: 28 },
        6: { halign: "left", cellWidth: 30 },
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

    // ==================== INSTRUCCIONES / NOTAS ====================
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    if (finalY < pageHeight - 60) {
      doc.setTextColor(...primaryColor);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("INSTRUCCIONES DE PREPARACIÓN", margin, finalY);

      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(margin, finalY + 3, pageWidth - margin, finalY + 3);

      // Recuadro con la descripción
      const boxY = finalY + 8;
      const boxWidth = pageWidth - 2 * margin;
      const boxPadding = 5;

      doc.setFillColor(...secondaryColor);
      doc.setTextColor(...textDark);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Calcular altura necesaria para el texto
      const textLines = doc.splitTextToSize(
        receta.descripcion,
        boxWidth - 2 * boxPadding
      );
      const textHeight = textLines.length * 5 + 2 * boxPadding;

      // Dibujar recuadro
      doc.roundedRect(margin, boxY, boxWidth, textHeight, 2, 2, "F");

      // Dibujar texto
      doc.text(textLines, margin + boxPadding, boxY + boxPadding + 4);

      // Notas adicionales
      const notasY = boxY + textHeight + 8;

      if (notasY < pageHeight - 40) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);

        doc.text(
          `• Rendimiento: ${receta.cantidadBase} ${receta.unidadBase}`,
          margin + 5,
          notasY
        );
        doc.text(
          `• Tiempo estimado: ${receta.tiempoPreparacion} minutos`,
          margin + 5,
          notasY + 5
        );
        doc.text(
          "• Los ingredientes opcionales pueden omitirse según preferencia",
          margin + 5,
          notasY + 10
        );

        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.text(
          "Nota: Los precios PPP (Precio Promedio Ponderado) pueden variar según el stock actual.",
          margin + 5,
          notasY + 17
        );
      }
    }

    // Guardar PDF
    const fileName = `Receta_${receta.nombre.replace(/\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(fileName);
  }

  /**
   * Exportar múltiples recetas en un solo PDF (catálogo)
   */
  static async exportarCatalogoRecetas(
    recetas: RecetaMaestra[]
  ): Promise<void> {
    if (recetas.length === 0) {
      throw new Error("No hay recetas para exportar");
    }

    if (recetas.length === 1) {
      return this.exportarReceta(recetas[0]);
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "letter",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const primaryColor: [number, number, number] = [139, 92, 246];
    const textDark: [number, number, number] = [31, 41, 55];

    // Encabezado
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("CATÁLOGO DE RECETAS", pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total de recetas: ${recetas.length}`, pageWidth / 2, 23, {
      align: "center",
    });

    doc.text(
      `Generado: ${new Date().toLocaleDateString("es-ES")}`,
      pageWidth / 2,
      29,
      { align: "center" }
    );

    // Tabla de recetas
    const tableData = recetas.map((receta) => [
      receta.nombre,
      receta.categoria,
      receta.descripcion.substring(0, 50) + "...",
      `${receta.cantidadBase} ${receta.unidadBase}`,
      `${receta.tiempoPreparacion} min`,
      `$${(receta.precioEstimado || 0).toLocaleString("es-CL")}`,
      `$${receta.precioUnidad.toLocaleString("es-CL")}`,
      receta.ingredientes.length.toString(),
      receta.activa ? "✓ Activa" : "✗ Inactiva",
    ]);

    autoTable(doc, {
      startY: 45,
      head: [
        [
          "Receta",
          "Categoría",
          "Descripción",
          "Cantidad",
          "Tiempo",
          "Costo",
          "Precio",
          "Ingr.",
          "Estado",
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
        fontSize: 8,
        textColor: textDark,
      },
      columnStyles: {
        0: { halign: "left", cellWidth: 40 },
        1: { halign: "center", cellWidth: 22 },
        2: { halign: "left", cellWidth: 60 },
        3: { halign: "center", cellWidth: 20 },
        4: { halign: "center", cellWidth: 18 },
        5: { halign: "right", cellWidth: 22 },
        6: { halign: "right", cellWidth: 22 },
        7: { halign: "center", cellWidth: 15 },
        8: { halign: "center", cellWidth: 22 },
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

    // Resumen final
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const totalCosto = recetas.reduce(
      (sum, r) => sum + (r.precioEstimado || 0),
      0
    );
    const totalVenta = recetas.reduce((sum, r) => sum + r.precioUnidad, 0);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text(
      `COSTO TOTAL PROMEDIO: $${totalCosto.toLocaleString("es-CL")}`,
      pageWidth - margin,
      finalY,
      { align: "right" }
    );
    doc.text(
      `VALOR VENTA TOTAL: $${totalVenta.toLocaleString("es-CL")}`,
      pageWidth - margin,
      finalY + 6,
      { align: "right" }
    );

    doc.save(`Catalogo_Recetas_${new Date().toISOString().split("T")[0]}.pdf`);
  }
}
