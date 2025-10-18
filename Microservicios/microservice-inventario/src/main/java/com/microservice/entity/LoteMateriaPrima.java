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

    // Relación con la compra (nullable para mantener compatibilidad con lotes legacy)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compra_id")
    private CompraMateriaPrima compra;

    // Cantidad ORIGINAL comprada (nunca cambia, usado para PPP)
    @Column(nullable = false)
    private Double cantidad;

    // Cantidad DISPONIBLE actual (se reduce al consumir)
    @Column(name = "stock_actual", nullable = false)
    private Double stockActual;

    @Column(name = "costo_unitario", nullable = false)
    private Double costoUnitario;

    // Número de lote del proveedor (opcional)
    @Column(name = "numero_lote", length = 50)
    private String numeroLote;

    @Column(name = "fecha_compra", nullable = false)
    private LocalDate fechaCompra;

    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;

    // Al crear un lote, stock_actual se inicializa con cantidad
    @PrePersist
    protected void onCreate() {
        if (stockActual == null) {
            stockActual = cantidad;
        }
    }

    
}
