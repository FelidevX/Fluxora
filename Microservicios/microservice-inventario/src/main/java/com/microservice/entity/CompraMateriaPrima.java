package com.microservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "compras_materia_prima")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompraMateriaPrima {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "num_doc", nullable = false, length = 50)
    private String numDoc;

    @Column(name = "tipo_doc", nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoDocumento tipoDoc;

    @Column(nullable = false)
    private String proveedor;

    @Column(name = "fecha_compra", nullable = false)
    private LocalDate fechaCompra;

    @Column(name = "fecha_pago")
    private LocalDate fechaPago;

    @Column(name = "estado_pago", nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private EstadoPago estadoPago = EstadoPago.PENDIENTE;

    @Column(name = "created_at", updatable = false)
    private LocalDate createdAt;

    // Relación con los lotes de esta compra
    @OneToMany(mappedBy = "compra", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<LoteMateriaPrima> lotes;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDate.now();
        }
    }

    // Método calculado para obtener el monto total de la compra
    @Transient
    public Double getMontoTotal() {
        if (lotes == null || lotes.isEmpty()) {
            return 0.0;
        }
        return lotes.stream()
                .mapToDouble(lote -> lote.getCantidad() * lote.getCostoUnitario())
                .sum();
    }

    // Método para obtener el total de lotes
    @Transient
    public Integer getTotalLotes() {
        return lotes != null ? lotes.size() : 0;
    }

    public enum TipoDocumento {
    BOLETA,
    FACTURA
    }

    public enum EstadoPago {
    PENDIENTE,
    PAGADO
    }
}
