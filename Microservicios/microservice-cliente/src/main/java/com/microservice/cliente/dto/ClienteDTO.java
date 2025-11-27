package com.microservice.cliente.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClienteDTO {
    private Long id;
    private String nombreNegocio;
    private String nombre;
    private String contacto;
    private String direccion;
    private Double latitud;
    private Double longitud;
    private String email;
    private Double precioCorriente;
    private Double precioEspecial;
    private String nombreRuta; // Nombre de la ruta asignada al cliente
}
