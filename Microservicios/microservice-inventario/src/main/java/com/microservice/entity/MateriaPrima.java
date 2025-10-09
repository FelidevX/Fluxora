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
    private String unidad;
    // ahora MateriaPrima actua como catálogo; los lotes con cantidad y costo
    // se almacenan en LoteMateriaPrima

    // Nota: Relaciones removidas temporalmente para simplificar el modelo
    // Se pueden restaurar después si son necesarias para la lógica de negocio
}