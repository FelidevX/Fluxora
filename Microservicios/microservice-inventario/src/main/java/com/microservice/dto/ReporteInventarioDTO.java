package com.microservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReporteInventarioDTO {
    private String fecha;
    private String producto;
    private String tipo; // "Producto" o "Materia Prima"
    private Double stockInicial;
    private Double entradas;  // Producción en el periodo
    private Double salidas;   // Mermas + Ventas en el periodo
    private Double stockFinal;
    private Double valorTotal;
    
    // Campos adicionales para análisis
    private Double rotacion;  // Porcentaje de stock que se movió
    private Integer diasSinMovimiento;
    private Double porcentajeMerma;  // % de merma sobre producción
    private String estadoStock;  // "Óptimo", "Bajo", "Crítico", "Exceso"
}
