import * as XLSX from "xlsx";
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

export class ExcelExportService {
  /**
   * Genera y descarga un archivo Excel con formato profesional
   * Todo en una sola hoja
   */
  static async exportar(config: ExportConfig): Promise<void> {
    const { tipo, datos, resumen, columnas, fechaInicio, fechaFin } = config;

    // Crear libro de trabajo
    const wb = XLSX.utils.book_new();

    // Crear una sola hoja con todo el contenido
    this.agregarHojaCompleta(
      wb,
      tipo,
      datos,
      resumen,
      columnas,
      fechaInicio,
      fechaFin
    );

    // Descargar archivo
    const nombreArchivo = this.generarNombreArchivo(tipo);
    XLSX.writeFile(wb, nombreArchivo);
  }

  /**
   * Crea una hoja completa con resumen y datos juntos
   */
  private static agregarHojaCompleta(
    wb: XLSX.WorkBook,
    tipo: TipoReporte,
    datos: any[],
    resumen: any,
    columnas: Column[],
    fechaInicio?: string,
    fechaFin?: string
  ): void {
    const allData: any[][] = [];

    // Encabezado principal
    allData.push([`REPORTE DE ${tipo.toUpperCase()}`]);
    allData.push([]);

    // Información general
    allData.push(["Fecha de generación:", new Date().toLocaleString("es-CL")]);
    if (fechaInicio && fechaFin) {
      allData.push(["Periodo:", `${fechaInicio} - ${fechaFin}`]);
    }
    allData.push(["Generado por:", "Sistema Fluxora"]);
    allData.push([]);

    // Resumen según tipo
    allData.push(["RESUMEN EJECUTIVO"]);
    allData.push([]);

    switch (tipo) {
      case "entregas":
        allData.push(["Métrica", "Valor"]);
        allData.push(["Total Entregas Realizadas", resumen.totalEntregas || 0]);
        allData.push([
          "Total Entregas Programadas",
          resumen.totalProgramadas || 0,
        ]);
        allData.push([
          "Kg Totales Entregados",
          (resumen.totalKilos || 0).toFixed(2),
        ]);
        allData.push([
          "Tasa de Completado (%)",
          (resumen.porcentajeCompletado || 0).toFixed(2),
        ]);
        allData.push([
          "Entregas Pendientes",
          (resumen.totalProgramadas || 0) - (resumen.totalEntregas || 0),
        ]);
        break;

      case "ventas":
        allData.push(["Métrica", "Valor"]);
        allData.push(["Ventas Totales", resumen.totalVentas || 0]);
        allData.push(["Kg Vendidos", (resumen.totalKilos || 0).toFixed(2)]);
        allData.push(["Clientes Únicos", resumen.totalClientes || 0]);
        allData.push(["Ticket Promedio", resumen.ticketPromedio || 0]);
        break;

      case "inventario":
        allData.push(["Métrica", "Valor"]);
        allData.push(["Total Productos", resumen.totalRegistros || 0]);
        allData.push([
          "Entradas (kg)",
          (resumen.totalEntradas || 0).toFixed(2),
        ]);
        allData.push(["Salidas (kg)", (resumen.totalSalidas || 0).toFixed(2)]);
        allData.push([
          "Stock Actual (kg)",
          (resumen.stockTotal || 0).toFixed(2),
        ]);
        break;

      case "clientes":
        allData.push(["Métrica", "Valor"]);
        allData.push(["Total Clientes", resumen.totalRegistros || 0]);
        allData.push(["Compras Totales", resumen.totalCompras || 0]);
        allData.push(["Kg Totales", (resumen.totalKilos || 0).toFixed(2)]);
        allData.push(["Valor Total", resumen.valorTotal || 0]);
        break;
    }

    // Separador
    allData.push([]);
    allData.push(["DETALLE DE DATOS"]);
    allData.push([]);

    // Encabezados de la tabla
    const headers = columnas.map((col) => col.label);
    allData.push(headers);

    // Datos formateados
    const datosFormateados = datos.map((row) =>
      columnas.map((col) => {
        const valor = row[col.key];

        // Para números, devolver el valor sin formato para que Excel lo trate como número
        if (typeof valor === "number") {
          return valor;
        }

        return valor || "-";
      })
    );

    // Agregar datos
    datosFormateados.forEach((row) => allData.push(row));

    // Crear hoja
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // Aplicar anchos de columna
    const maxCols = Math.max(...allData.map((row) => row.length));
    const colWidths = Array(maxCols).fill({ wch: 18 });
    ws["!cols"] = colWidths;

    // Agregar al libro
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
  }

  /**
   * Crea la hoja de resumen con formato profesional (DEPRECATED - usar agregarHojaCompleta)
   */
  private static agregarHojaResumen(
    wb: XLSX.WorkBook,
    tipo: TipoReporte,
    resumen: any,
    fechaInicio?: string,
    fechaFin?: string
  ): void {
    const data: any[][] = [];

    // Encabezado principal
    data.push([`REPORTE DE ${tipo.toUpperCase()}`]);
    data.push([]);

    // Información general
    data.push(["Fecha de generación:", new Date().toLocaleString("es-CL")]);
    if (fechaInicio && fechaFin) {
      data.push(["Periodo:", `${fechaInicio} - ${fechaFin}`]);
    }
    data.push(["Generado por:", "Sistema Fluxora"]);
    data.push([]);

    // Resumen según tipo
    data.push(["RESUMEN EJECUTIVO"]);
    data.push([]);

    switch (tipo) {
      case "entregas":
        data.push(["Métrica", "Valor"]);
        data.push(["Total Entregas Realizadas", resumen.totalEntregas || 0]);
        data.push([
          "Total Entregas Programadas",
          resumen.totalProgramadas || 0,
        ]);
        data.push([
          "Kg Totales Entregados",
          `${(resumen.totalKilos || 0).toFixed(2)} kg`,
        ]);
        data.push([
          "Tasa de Completado",
          `${(resumen.porcentajeCompletado || 0).toFixed(2)}%`,
        ]);
        data.push([
          "Entregas Pendientes",
          (resumen.totalProgramadas || 0) - (resumen.totalEntregas || 0),
        ]);
        break;

      case "ventas":
        data.push(["Métrica", "Valor"]);
        data.push([
          "Ventas Totales",
          `$${(resumen.totalVentas || 0).toLocaleString("es-CL")}`,
        ]);
        data.push([
          "Kg Vendidos",
          `${(resumen.totalKilos || 0).toFixed(2)} kg`,
        ]);
        data.push(["Clientes Únicos", resumen.totalClientes || 0]);
        data.push([
          "Ticket Promedio",
          `$${(resumen.ticketPromedio || 0).toLocaleString("es-CL")}`,
        ]);
        break;

      case "inventario":
        data.push(["Métrica", "Valor"]);
        data.push(["Total Productos", resumen.totalRegistros || 0]);
        data.push([
          "Entradas",
          `${(resumen.totalEntradas || 0).toFixed(2)} kg`,
        ]);
        data.push(["Salidas", `${(resumen.totalSalidas || 0).toFixed(2)} kg`]);
        data.push([
          "Stock Actual",
          `${(resumen.stockTotal || 0).toFixed(2)} kg`,
        ]);
        break;

      case "clientes":
        data.push(["Métrica", "Valor"]);
        data.push(["Total Clientes", resumen.totalRegistros || 0]);
        data.push(["Compras Totales", resumen.totalCompras || 0]);
        data.push(["Kg Totales", `${(resumen.totalKilos || 0).toFixed(2)} kg`]);
        data.push([
          "Valor Total",
          `$${(resumen.valorTotal || 0).toLocaleString("es-CL")}`,
        ]);
        break;
    }

    // Crear hoja
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Aplicar estilos mediante anchos de columna
    ws["!cols"] = [{ wch: 30 }, { wch: 25 }];

    // Agregar al libro
    XLSX.utils.book_append_sheet(wb, ws, "Resumen");
  }

  /**
   * Crea la hoja de datos con la tabla principal
   */
  private static agregarHojaDatos(
    wb: XLSX.WorkBook,
    tipo: TipoReporte,
    datos: any[],
    columnas: Column[]
  ): void {
    // Encabezado
    const headers = columnas.map((col) => col.label);

    // Datos formateados
    const datosFormateados = datos.map((row) =>
      columnas.map((col) => {
        const valor = row[col.key];

        // Para números, devolver el valor sin formato para que Excel lo trate como número
        if (typeof valor === "number") {
          return valor;
        }

        return valor || "-";
      })
    );

    // Combinar encabezado con datos
    const allData = [headers, ...datosFormateados];

    // Crear hoja
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // Aplicar anchos de columna dinámicos
    const colWidths = columnas.map((col) => {
      // Calcular ancho basado en el label
      const labelLength = col.label.length;
      return { wch: Math.max(labelLength + 2, 12) };
    });
    ws["!cols"] = colWidths;

    // Aplicar filtros automáticos
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    ws["!autofilter"] = { ref: XLSX.utils.encode_range(range) };

    // Agregar al libro
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
  }

  /**
   * Genera estadísticas adicionales para la hoja de análisis
   */
  private static agregarHojaAnalisis(
    wb: XLSX.WorkBook,
    tipo: TipoReporte,
    datos: any[]
  ): void {
    if (datos.length === 0) return;

    const data: any[][] = [];
    data.push(["ANÁLISIS ESTADÍSTICO"]);
    data.push([]);

    switch (tipo) {
      case "entregas":
        // Calcular estadísticas
        const totalKilos = datos.reduce(
          (sum, row) => sum + (row.kgTotal || 0),
          0
        );
        const promedioKilosPorDia = totalKilos / datos.length;
        const maxKilos = Math.max(...datos.map((row) => row.kgTotal || 0));
        const minKilos = Math.min(...datos.map((row) => row.kgTotal || 0));
        const promedioCompletado =
          datos.reduce((sum, row) => sum + (row.porcentajeCompletado || 0), 0) /
          datos.length;

        data.push(["Métrica", "Valor"]);
        data.push(["Total Kg Entregados", totalKilos.toFixed(2)]);
        data.push(["Promedio Kg por Día", promedioKilosPorDia.toFixed(2)]);
        data.push(["Día con Más Kg", maxKilos.toFixed(2)]);
        data.push(["Día con Menos Kg", minKilos.toFixed(2)]);
        data.push([
          "% Completado Promedio",
          promedioCompletado.toFixed(2) + "%",
        ]);
        break;
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, "Análisis");
  }

  /**
   * Genera el nombre del archivo con fecha y hora
   */
  private static generarNombreArchivo(tipo: TipoReporte): string {
    const fecha = new Date();
    const fechaStr = fecha.toISOString().split("T")[0];
    const horaStr = fecha.toTimeString().split(" ")[0].replace(/:/g, "-");
    return `reporte_${tipo}_${fechaStr}_${horaStr}.xlsx`;
  }

  /**
   * Exportar (alias para mantener compatibilidad)
   */
  static async exportarCompleto(config: ExportConfig): Promise<void> {
    // Ahora usa el mismo método que exportar - todo en una sola hoja
    return this.exportar(config);
  }
}
