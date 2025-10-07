package com.microservice.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "recetas_maestras")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecetaMaestra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String nombre;
    private String descripcion;
    private String categoria;
    
    @Column(name = "unidad_base")
    private String unidadBase;
    
    @Column(name = "cantidad_base")
    private Double cantidadBase;
    
    @Column(name = "precio_estimado")
    private Double precioEstimado;
    
    @Column(name = "precio_unidad")
    private Double precioUnidad;
    
    @Column(name = "tiempo_preparacion")
    private Integer tiempoPreparacion; // en minutos
    
    @Column(name = "fecha_creacion")
    private LocalDate fechaCreacion;
    
    private Boolean activa;
    
    @OneToMany(mappedBy = "recetaMaestra", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<RecetaIngrediente> ingredientes;
}