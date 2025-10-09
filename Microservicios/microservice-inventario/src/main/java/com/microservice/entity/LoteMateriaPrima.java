package com.microservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "lotes_materia_prima")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoteMateriaPrima {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "materia_prima_id", nullable = false)
    private Long materiaPrimaId;

    @Column(nullable = false)
    private Double cantidad;

    @Column(name = "costo_unitario", nullable = false)
    private Double costoUnitario;

    @Column(name = "fecha_compra", nullable = false)
    private LocalDate fechaCompra;

    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;
}
