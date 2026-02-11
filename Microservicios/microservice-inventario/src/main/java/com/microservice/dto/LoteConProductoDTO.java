package com.microservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoteConProductoDTO {
    private Long idLote;
    private Long idProducto;
    private String nombreProducto;
    private String tipoProducto;
    private Integer stockActual;
    private Integer cantidadProducida;
}
