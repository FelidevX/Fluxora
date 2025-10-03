package com.microservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "materias_primas")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MateriaPrima {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nombre;
    private Double cantidad;
    private String proveedor;
    private String estado;
    private String unidad;
    private LocalDate fecha;
    private LocalDate fechaVencimiento;

    // Nota: Relaciones removidas temporalmente para simplificar el modelo
    // Se pueden restaurar después si son necesarias para la lógica de negocio
}