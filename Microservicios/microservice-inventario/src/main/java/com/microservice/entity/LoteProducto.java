package com.microservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "lotes_producto")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoteProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "producto_id", nullable = false)
    private Long productoId;

    @Column(name = "cantidad_producida", nullable = false)
    private Integer cantidadProducida;

    @Column(name = "stock_actual", nullable = false)
    private Integer stockActual;

    @Column(name = "costo_produccion_total", nullable = false)
    private Double costoProduccionTotal;

    @Column(name = "costo_unitario", nullable = false)
    private Double costoUnitario;

    @Column(name = "fecha_produccion", nullable = false)
    private LocalDate fechaProduccion;

    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;

    private String estado; // disponible, agotado, vencido

    // Método calculado para ganancia unitaria
    @Transient
    public Double getGananciaUnitaria(Double precioVenta) {
        if (precioVenta == null || costoUnitario == null) return 0.0;
        return precioVenta - costoUnitario;
    }

    // Método calculado para ganancia total del lote
    @Transient
    public Double getGananciaTotal(Double precioVenta) {
        if (precioVenta == null || stockActual == null || costoUnitario == null) return 0.0;
        return (precioVenta * stockActual) - (costoUnitario * stockActual);
    }
}
