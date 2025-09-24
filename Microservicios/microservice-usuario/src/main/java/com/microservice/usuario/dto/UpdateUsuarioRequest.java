package com.microservice.usuario.dto;

import lombok.Data;

@Data
public class UpdateUsuarioRequest {
    private String nombre;
    private String email;
    private String password;
    private Long rolId;
}