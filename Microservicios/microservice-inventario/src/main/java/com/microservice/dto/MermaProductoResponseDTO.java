package com.microservice.dto;

import com.microservice.entity.MermaProducto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MermaProductoResponseDTO {
    private Long id;
    private Long productoId;
    private String productoNombre;
    private Long loteProductoId;
    private Double cantidadMermada;
    private String motivo;
    private MermaProducto.TipoMerma tipoMerma;
    private LocalDateTime fechaRegistro;
}
