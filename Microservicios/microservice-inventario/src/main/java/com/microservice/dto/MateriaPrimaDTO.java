package com.microservice.dto;

import lombok.*;
import java.time.LocalDate;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MateriaPrimaDTO {
    private Long id;
    private String nombre;
    private String tipo;
    private Double cantidad;
    private String proveedor;
    private String estado;
    private String unidad;
    private LocalDate fecha;
}