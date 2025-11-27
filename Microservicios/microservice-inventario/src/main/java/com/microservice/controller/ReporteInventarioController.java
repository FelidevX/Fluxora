package com.microservice.controller;

import com.microservice.dto.RespuestaReporteInventarioDTO;
import com.microservice.service.ReporteInventarioService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("")
public class ReporteInventarioController {

    private static final Logger logger = LoggerFactory.getLogger(ReporteInventarioController.class);

    @Autowired
    private ReporteInventarioService reporteInventarioService;

    @GetMapping("/reporte-inventario")
    public ResponseEntity<RespuestaReporteInventarioDTO> generarReporteInventario(
            @RequestParam String fechaInicio,
            @RequestParam String fechaFin,
            @RequestParam(required = false) Long idProducto,
            @RequestParam(required = false, defaultValue = "movimientos") String tipoReporte,
            @RequestParam(required = false, defaultValue = "false") Boolean incluirAnalisis) {
        try {
            logger.info("Generando reporte de inventario - Tipo: {}, Inicio: {}, Fin: {}, Producto: {}, Análisis: {}", 
                tipoReporte, fechaInicio, fechaFin, idProducto, incluirAnalisis);
            
            RespuestaReporteInventarioDTO reporte = reporteInventarioService.generarReporteInventario(
                    fechaInicio, fechaFin, idProducto, tipoReporte, incluirAnalisis);
            
            logger.info("Reporte generado exitosamente con {} registros", reporte.getDatos().size());
            return ResponseEntity.ok(reporte);
        } catch (Exception e) {
            logger.error("Error al generar reporte de inventario", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
