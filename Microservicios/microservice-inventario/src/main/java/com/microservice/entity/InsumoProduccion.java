package com.microservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "insumos_produccion")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InsumoProduccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cantidad_usada")
    private Double cantidadUsada;

    private LocalDate fecha;

    @Column(name = "materia_prima_id")
    private Long materiaPrimaId;
}
