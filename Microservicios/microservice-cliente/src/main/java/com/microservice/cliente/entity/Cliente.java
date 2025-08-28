package com.microservice.cliente.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombreNegocio;
    private String nombre;
    private String direccion;
    private String contacto;
    private String email;

    // Coordenadas geográficas
    @Column(name = "latitud")
    private Double latitud;

    @Column(name = "longitud")
    private Double longitud;

    // Método utilitario para OR-Tools
    public double[] getCoordenadas() {
        return new double[] { latitud != null ? latitud : 0.0, longitud != null ? longitud : 0.0 };
    }
}
