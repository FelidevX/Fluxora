package com.microservice.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "receta_ingredientes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecetaIngrediente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receta_maestra_id")
    @JsonBackReference
    private RecetaMaestra recetaMaestra;
    
    @Column(name = "materia_prima_id")
    private Long materiaPrimaId;
    
    @Column(name = "materia_prima_nombre")
    private String materiaPrimaNombre;
    
    @Column(name = "cantidad_necesaria")
    private Double cantidadNecesaria;
    
    private String unidad;
    
    @Column(name = "es_opcional")
    private Boolean esOpcional;
    
    private String notas;
}