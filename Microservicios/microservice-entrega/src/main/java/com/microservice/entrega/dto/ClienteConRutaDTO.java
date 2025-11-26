package com.microservice.entrega.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ClienteConRutaDTO {
    private Long id;
    private String nombre;
    private String direccion;
    private Double latitud;
    private Double longitud;
    private String email;
    private Double precioCorriente;
    private Double precioEspecial;
    private Long rutaId;
    private String rutaNombre;
}
