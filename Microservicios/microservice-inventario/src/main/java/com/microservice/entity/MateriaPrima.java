package com.microservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

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

    // Relación con Producto (n a n)
    @ManyToMany(mappedBy = "materiasPrimas")
    private List<Producto> productos;

    // Relación con InsumoProduccion (1 a n)
    @OneToMany(mappedBy = "materiaPrima", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InsumoProduccion> insumosProduccion;
}