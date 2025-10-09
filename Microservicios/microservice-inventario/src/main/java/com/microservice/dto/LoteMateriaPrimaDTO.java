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
    private Double cantidad;
    private Double costoUnitario;
    private LocalDate fechaCompra;
    private LocalDate fechaVencimiento;
}
