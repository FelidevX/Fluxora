package com.microservice.service;

import com.microservice.dto.ReporteInventarioDTO;
import com.microservice.dto.ResumenReporteInventarioDTO;
import com.microservice.dto.RespuestaReporteInventarioDTO;
import com.microservice.entity.LoteProducto;
import com.microservice.entity.Producto;
import com.microservice.entity.MermaProducto;
import com.microservice.repository.LoteProductoRepository;
import com.microservice.repository.ProductoRepository;
import com.microservice.repository.MermaProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReporteInventarioService {

    @Autowired
    private LoteProductoRepository loteProductoRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private MermaProductoRepository mermaProductoRepository;

    public RespuestaReporteInventarioDTO generarReporteInventario(
            String fechaInicio, String fechaFin, Long idProducto, String tipoReporte, Boolean incluirAnalisis) {
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate inicio = LocalDate.parse(fechaInicio, formatter);
            LocalDate fin = LocalDate.parse(fechaFin, formatter);

            List<ReporteInventarioDTO> datos = new ArrayList<>();

            // Obtener todos los productos o uno específico
            List<Producto> productos;
            if (idProducto != null) {
                productos = productoRepository.findById(idProducto)
                        .map(List::of)
                        .orElse(new ArrayList<>());
            } else {
                productos = productoRepository.findAll();
            }

            double totalEntradas = 0;
            double totalSalidas = 0;
            double stockTotalActual = 0;

            // Generar reporte por cada producto
            for (Producto producto : productos) {
                // Obtener stock actual desde los lotes
                Integer stockActualInt = loteProductoRepository.sumStockActualByProductoId(producto.getId());
                double stockActual = stockActualInt != null ? stockActualInt.doubleValue() : 0.0;

                // Obtener lotes (entradas) del producto en el periodo
                List<LoteProducto> lotes = loteProductoRepository.findByProductoIdAndFechaProduccionBetween(
                        producto.getId(), inicio, fin);

                double entradasPeriodo = lotes.stream()
                        .mapToDouble(l -> l.getCantidadProducida() != null ? l.getCantidadProducida().doubleValue() : 0.0)
                        .sum();

                // Obtener mermas (salidas) del producto en el periodo
                List<MermaProducto> mermas = mermaProductoRepository.findByProductoIdAndFechaRegistroBetween(
                        producto.getId(), inicio.atStartOfDay(), fin.atTime(23, 59, 59));

                double salidasPeriodo = mermas.stream()
                        .mapToDouble(m -> m.getCantidadMermada() != null ? m.getCantidadMermada() : 0.0)
                        .sum();

                // Calcular stock inicial (stock actual - entradas + salidas del periodo)
                double stockInicial = stockActual - entradasPeriodo + salidasPeriodo;

                // Crear registro del reporte
                ReporteInventarioDTO reporte = new ReporteInventarioDTO();
                reporte.setFecha(fechaFin);
                reporte.setProducto(producto.getNombre());
                reporte.setTipo("Producto");
                reporte.setStockInicial(stockInicial >= 0 ? stockInicial : 0.0);
                reporte.setEntradas(entradasPeriodo);
                reporte.setSalidas(salidasPeriodo);
                reporte.setStockFinal(stockActual);
                reporte.setValorTotal(producto.getPrecioVenta() != null ? stockActual * producto.getPrecioVenta() : 0.0);

                // Incluir análisis adicional si se solicita
                if (incluirAnalisis != null && incluirAnalisis) {
                    // Calcular rotación (% del stock que se movió)
                    if (stockInicial > 0) {
                        double movimiento = entradasPeriodo + salidasPeriodo;
                        reporte.setRotacion((movimiento / stockInicial) * 100);
                    } else {
                        reporte.setRotacion(0.0);
                    }

                    // Calcular porcentaje de merma sobre producción
                    if (entradasPeriodo > 0) {
                        reporte.setPorcentajeMerma((salidasPeriodo / entradasPeriodo) * 100);
                    } else {
                        reporte.setPorcentajeMerma(0.0);
                    }

                    // Determinar estado del stock (basado en un umbral simple)
                    if (stockActual == 0) {
                        reporte.setEstadoStock("Crítico");
                    } else if (stockActual < 10) {
                        reporte.setEstadoStock("Bajo");
                    } else if (stockActual > 100) {
                        reporte.setEstadoStock("Exceso");
                    } else {
                        reporte.setEstadoStock("Óptimo");
                    }

                    // Días sin movimiento (simplificado - basado en si hubo movimiento en el periodo)
                    reporte.setDiasSinMovimiento((entradasPeriodo + salidasPeriodo) == 0 ? 
                        (int) java.time.temporal.ChronoUnit.DAYS.between(inicio, fin) : 0);
                }

                datos.add(reporte);

                totalEntradas += entradasPeriodo;
                totalSalidas += salidasPeriodo;
                stockTotalActual += stockActual;
            }

            // Filtrar según tipo de reporte
            if ("bajoStock".equals(tipoReporte)) {
                datos = datos.stream()
                    .filter(d -> d.getStockFinal() < 10)
                    .toList();
            } else if ("sinMovimiento".equals(tipoReporte)) {
                datos = datos.stream()
                    .filter(d -> d.getEntradas() == 0 && d.getSalidas() == 0)
                    .toList();
            } else if ("altaMerma".equals(tipoReporte)) {
                datos = datos.stream()
                    .filter(d -> d.getPorcentajeMerma() != null && d.getPorcentajeMerma() > 10)
                    .toList();
            }
            // "movimientos" muestra todo

            // Crear resumen
            ResumenReporteInventarioDTO resumen = new ResumenReporteInventarioDTO();
            resumen.setTotalRegistros(datos.size());
            resumen.setTotalEntradas(totalEntradas);
            resumen.setTotalSalidas(totalSalidas);
            resumen.setStockTotal(stockTotalActual);
            resumen.setValorTotal(datos.stream().mapToDouble(d -> d.getValorTotal() != null ? d.getValorTotal() : 0.0).sum());

            // Crear respuesta
            RespuestaReporteInventarioDTO respuesta = new RespuestaReporteInventarioDTO();
            respuesta.setTipo("inventario");
            respuesta.setPeriodo("personalizado");
            respuesta.setFechaInicio(fechaInicio);
            respuesta.setFechaFin(fechaFin);
            respuesta.setDatos(datos);
            respuesta.setResumen(resumen);

            return respuesta;
        } catch (Exception e) {
            // Log del error
            e.printStackTrace();
            throw new RuntimeException("Error al generar reporte de inventario: " + e.getMessage());
        }
    }
}
