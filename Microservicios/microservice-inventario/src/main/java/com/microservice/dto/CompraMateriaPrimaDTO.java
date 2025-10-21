package com.microservice.dto;

import com.microservice.entity.CompraMateriaPrima;
import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompraMateriaPrimaDTO {
    private String numDoc;
    private CompraMateriaPrima.TipoDocumento tipoDoc;
    private String proveedor;
    private String fechaCompra; // LocalDate como String para JSON
    private String fechaPago; // LocalDate como String para JSON (puede ser null)
    private List<LoteCompraDTO> lotes;
}
