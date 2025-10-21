package com.microservice.entrega.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProgramacionEntrega {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long id_ruta;
    private Long id_cliente;
    private Long id_lote;
    private LocalDate fecha_programada;
    private String nombreProducto;
    private Integer cantidadProducto;
    private Double kg_corriente_programado;
    private Double kg_especial_programado;
    private Integer orden;
    private String estado;
    
    @CreationTimestamp
    private LocalDateTime fecha_creacion;
    
    @UpdateTimestamp
    private LocalDateTime fecha_actualizacion;
}