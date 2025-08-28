package com.microservice.dto;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InsumoProduccionDTO {
    private Long id;
    private Double cantidadUsada;
    private LocalDate fecha;
    private Long materiaPrimaId;
}


