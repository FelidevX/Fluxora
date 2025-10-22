package com.microservice.entrega.dto;

import lombok.Data;

@Data
public class ClienteDTO {
    private Long id;
    private String nombre;
    private String direccion;
    private Double latitud;
    private Double longitud;
    private String email;
}
