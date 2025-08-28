package com.microservice.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "recetas")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Receta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "producto_id")
    private Long productoId;
    
    @Column(name = "materia_prima_id")
    private Long materiaPrimaId;
    
    @Column(name = "cantidad_necesaria")
    private Double cantidadNecesaria;
    
    private String unidad;
}
