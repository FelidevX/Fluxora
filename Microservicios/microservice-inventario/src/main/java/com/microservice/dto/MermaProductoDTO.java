package com.microservice.dto;

import com.microservice.entity.MermaProducto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MermaProductoDTO {
    private Long productoId;
    private Long loteProductoId;
    private Double cantidadMermada;
    private String motivo;
    private MermaProducto.TipoMerma tipoMerma;
}
