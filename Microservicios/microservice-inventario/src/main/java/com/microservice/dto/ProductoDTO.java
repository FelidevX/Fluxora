package com.microservice.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductoDTO {
    private Long id;
    private String nombre;
    private String tipo;
    private Double stockActual;
    private String estado;
    private LocalDate fecha;
    private List<Long> materiasPrimasIds; 
}
