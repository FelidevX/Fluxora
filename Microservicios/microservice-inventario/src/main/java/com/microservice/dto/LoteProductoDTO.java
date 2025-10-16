package com.microservice.dto;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoteProductoDTO {
    private Long id;
    private Long productoId;
    private Integer cantidadProducida;
    private Integer stockActual;
    private Double costoProduccionTotal;
    private Double costoUnitario;
    private LocalDate fechaProduccion;
    private LocalDate fechaVencimiento;
    private String estado;
}
