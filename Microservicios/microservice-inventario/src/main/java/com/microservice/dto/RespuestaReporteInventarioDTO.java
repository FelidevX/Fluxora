package com.microservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RespuestaReporteInventarioDTO {
    private String tipo;
    private String periodo;
    private String fechaInicio;
    private String fechaFin;
    private List<ReporteInventarioDTO> datos;
    private ResumenReporteInventarioDTO resumen;
}
