package com.microservice.dto;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoteMateriaPrimaDTO {
    private Long id;
    private Long materiaPrimaId;
    private String materiaPrimaNombre; // Nombre de la materia prima (JOIN)
    private Long compraId; // ID de la compra asociada (nullable)
    private Double cantidad; // Cantidad original comprada (fija)
    private Double stockActual; // Cantidad disponible actual
    private Double costoUnitario;
    private String numeroLote; // Número de lote del proveedor
    private LocalDate fechaCompra;
    private LocalDate fechaVencimiento;
}

