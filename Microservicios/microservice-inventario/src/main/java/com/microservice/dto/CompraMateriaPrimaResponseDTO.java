package com.microservice.dto;

import com.microservice.entity.CompraMateriaPrima;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompraMateriaPrimaResponseDTO {
    private Long id;
    private String numDoc;
    private CompraMateriaPrima.TipoDocumento tipoDoc;
    private String proveedor;
    private LocalDate fechaCompra;
    private LocalDate fechaPago;
    private CompraMateriaPrima.EstadoPago estadoPago;
    private LocalDate createdAt;
    private Integer totalLotes;
    private Double montoTotal;
    private List<LoteMateriaPrimaDTO> lotes;
}
