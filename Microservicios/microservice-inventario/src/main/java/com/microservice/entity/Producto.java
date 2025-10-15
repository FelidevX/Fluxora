package com.microservice.entity;

import jakarta.persistence.*;
import lombok.*;

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

    @Column(nullable = false)
    private String nombre;

    @Column(name = "precio_venta")
    private Double precioVenta;

    @Column(name = "tipo_producto")
    @Enumerated(EnumType.STRING)
    private TipoProducto tipoProducto; // CORRIENTE, ESPECIAL (solo para panadería)

    private String categoria; // panaderia, pasteleria, etc.

    private String estado; // activo, descontinuado, etc.
    
    // Relación OPCIONAL con RecetaMaestra
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receta_maestra_id")
    private RecetaMaestra recetaMaestra;

    public enum TipoProducto {
        CORRIENTE,
        ESPECIAL,
        NO_APLICA // Para productos que no son panadería
    }
}
