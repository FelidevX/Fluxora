package com.microservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

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
    private String tipo;

    @Column(name = "stock_actual")
    private Double stockActual;
    private String estado;
    private LocalDate fecha;

    // Relación con MateriaPrima (n a n)
    @ManyToMany
    @JoinTable(
        name = "producto_materia_prima",
        joinColumns = @JoinColumn(name = "producto_id"),
        inverseJoinColumns = @JoinColumn(name = "materia_prima_id")
    )
    private List<MateriaPrima> materiasPrimas;
}
