package com.microservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "merma_producto")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MermaProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "producto_id", nullable = false)
    private Long productoId;

    @Column(name = "lote_producto_id")
    private Long loteProductoId;

    @Column(name = "cantidad_mermada", nullable = false)
    private Double cantidadMermada;

    @Column(name = "motivo", nullable = false, length = 500)
    private String motivo;

    @Column(name = "tipo_merma", nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoMerma tipoMerma;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "producto_nombre")
    private String productoNombre;

    @PrePersist
    protected void onCreate() {
        if (fechaRegistro == null) {
            fechaRegistro = LocalDateTime.now();
        }
    }

    public enum TipoMerma {
        MANUAL,
        AUTOMATICA
    }
}
