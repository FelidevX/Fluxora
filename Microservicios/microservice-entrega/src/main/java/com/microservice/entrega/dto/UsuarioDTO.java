package com.microservice.entrega.dto;

import lombok.Data;

@Data
public class UsuarioDTO {
    private Long id;
    private String nombre;
    private String rol;
    private Double latitud;
    private Double longitud;
}
