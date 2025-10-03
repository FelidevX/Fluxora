package com.microservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "productos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    // Nuevas columnas
    private Double cantidad;
    private Double precio;
    private String categoria;
    private String descripcion;

    // Columnas existentes (mantener para compatibilidad)
    private String tipo;
    @Column(name = "stock_actual")
    private Double stockActual;

    private String estado;
    private LocalDate fecha;
    private LocalDate fechaVencimiento;
}
