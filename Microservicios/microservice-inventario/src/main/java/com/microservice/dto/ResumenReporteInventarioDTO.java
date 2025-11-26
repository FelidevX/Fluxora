package com.microservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResumenReporteInventarioDTO {
    private Integer totalRegistros;
    private Double totalEntradas;
    private Double totalSalidas;
    private Double stockTotal;
    private Double valorTotal;
}
