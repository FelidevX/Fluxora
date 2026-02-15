package com.microservice.entrega.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.microservice.entrega.client.ClienteServiceClient;
import com.microservice.entrega.client.InventarioServiceClient;
import com.microservice.entrega.dto.ClienteDTO;
import com.microservice.entrega.entity.ProgramacionEntrega;
import com.microservice.entrega.entity.Ruta;
import com.microservice.entrega.repository.ProgramacionEntregaRepository;
import com.microservice.entrega.repository.RegistroEntregaRepository;
import com.microservice.entrega.repository.RutaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private final RegistroEntregaRepository registroEntregaRepository;
    private final ProgramacionEntregaRepository programacionEntregaRepository;
    private final RutaRepository rutaRepository;
    private final ClienteServiceClient clienteServiceClient;
    private final InventarioServiceClient inventarioServiceClient;

    /**
     * Obtener estadísticas para el dashboard
     */
    public Map<String, Object> obtenerEstadisticasDashboard() {
        Map<String, Object> estadisticas = new HashMap<>();
        
        LocalDate hoy = LocalDate.now();
        LocalDateTime finHoy = hoy.plusDays(1).atStartOfDay();
        
        // Estadísticas del día actual
        Long totalProgramadosHoy = programacionEntregaRepository.countClientesByFechaProgramada(hoy);
        Long totalEntregadosHoy = registroEntregaRepository.countByFecha(hoy);
        Double totalKilosHoy = 0.0;
        try {
            Double suma = registroEntregaRepository.sumKilosByFecha(hoy);
            totalKilosHoy = (suma != null) ? suma : 0.0;
        } catch (Exception e) {
            // En caso de error, dejar en 0 y seguir
            totalKilosHoy = 0.0;
        }
        
        Map<String, Object> entregasDelDia = new HashMap<>();
        entregasDelDia.put("completadas", totalEntregadosHoy != null ? totalEntregadosHoy : 0L);
        entregasDelDia.put("total", totalProgramadosHoy != null ? totalProgramadosHoy : 0L);
        estadisticas.put("entregasDelDia", entregasDelDia);
        estadisticas.put("productosVendidosHoy", totalKilosHoy);
        
        // Entregas de la última semana (7 días incluyendo hoy)
        List<Map<String, Object>> entregasPorDia = new ArrayList<>();
        LocalDate inicioSemana = hoy.minusDays(6); // Últimos 7 días
        LocalDateTime inicioRango = inicioSemana.atStartOfDay();
        LocalDateTime finRango = finHoy;
        
        // Obtener datos de entregas completadas por día
        List<Object[]> datosEntregas = registroEntregaRepository.countEntregasPorDia(inicioRango, finRango);
        Map<LocalDate, Long> entregasMap = new HashMap<>();
        for (Object[] row : datosEntregas) {
            // PostgreSQL devuelve java.sql.Date, necesitamos convertir a LocalDate
            java.sql.Date sqlDate = (java.sql.Date) row[0];
            LocalDate fecha = sqlDate.toLocalDate();
            // El COUNT puede ser Long o BigInteger dependiendo de la DB
            Long cantidad = ((Number) row[1]).longValue();
            entregasMap.put(fecha, cantidad);
        }
        
        // Crear array con todos los días de la semana
        for (int i = 0; i < 7; i++) {
            LocalDate fecha = inicioSemana.plusDays(i);
            Map<String, Object> diaData = new HashMap<>();
            diaData.put("fecha", fecha.toString());
            diaData.put("dia", obtenerNombreDia(fecha.getDayOfWeek().getValue()));
            diaData.put("entregas", entregasMap.getOrDefault(fecha, 0L));
            entregasPorDia.add(diaData);
        }
        
        estadisticas.put("entregasSemana", entregasPorDia);
        
        return estadisticas;
    }

    /**
     * Generar reporte de entregas por periodo
     */
    public Map<String, Object> generarReporteEntregas(LocalDate fechaInicio, LocalDate fechaFin, Long idRuta) {
        Map<String, Object> respuesta = new HashMap<>();
        
        try {
            // Obtener datos de entregas realizadas
            List<Object[]> datosEntregas;
            if (idRuta != null) {
                datosEntregas = registroEntregaRepository.obtenerReporteEntregasPorRuta(fechaInicio, fechaFin, idRuta);
            } else {
                datosEntregas = registroEntregaRepository.obtenerReporteEntregas(fechaInicio, fechaFin);
            }
            
            // Obtener entregas programadas por día
            List<Object[]> entregasProgramadas = programacionEntregaRepository.countEntregasProgramadasPorDia(fechaInicio, fechaFin);
            Map<LocalDate, Long> programadasMap = new HashMap<>();
            for (Object[] row : entregasProgramadas) {
                java.sql.Date sqlDate = (java.sql.Date) row[0];
                LocalDate fecha = sqlDate.toLocalDate();
                Long total = ((Number) row[1]).longValue();
                programadasMap.put(fecha, total);
            }
            
            // Procesar datos
            List<Map<String, Object>> datos = new ArrayList<>();
            double totalKgCorriente = 0;
            double totalKgEspecial = 0;
            long totalEntregasRealizadas = 0;
            long totalEntregasProgramadas = 0;
            
            for (Object[] row : datosEntregas) {
                Map<String, Object> fila = new HashMap<>();
                java.sql.Date sqlDate = (java.sql.Date) row[0];
                LocalDate fecha = sqlDate.toLocalDate();
                Long totalEntregas = ((Number) row[1]).longValue();
                Double kgCorriente = ((Number) row[2]).doubleValue();
                Double kgEspecial = ((Number) row[3]).doubleValue();
                
                Long entregasProgramadasDia = programadasMap.getOrDefault(fecha, 0L);
                double porcentajeCompletado = entregasProgramadasDia > 0 
                    ? (totalEntregas.doubleValue() / entregasProgramadasDia.doubleValue() * 100) 
                    : 0;
                
                fila.put("fecha", fecha.toString());
                fila.put("entregasProgramadas", entregasProgramadasDia);
                fila.put("totalEntregas", totalEntregas);
                fila.put("entregasCompletadas", totalEntregas);
                fila.put("kgCorriente", kgCorriente);
                fila.put("kgEspecial", kgEspecial);
                fila.put("kgTotal", kgCorriente + kgEspecial);
                fila.put("porcentajeCompletado", porcentajeCompletado);
                
                datos.add(fila);
                
                totalKgCorriente += kgCorriente;
                totalKgEspecial += kgEspecial;
                totalEntregasRealizadas += totalEntregas;
                totalEntregasProgramadas += entregasProgramadasDia;
            }
            
            // Crear resumen
            Map<String, Object> resumen = new HashMap<>();
            resumen.put("totalEntregas", totalEntregasRealizadas);
            resumen.put("totalProgramadas", totalEntregasProgramadas);
            resumen.put("totalKilos", totalKgCorriente + totalKgEspecial);
            resumen.put("porcentajeCompletado", totalEntregasProgramadas > 0 
                ? (totalEntregasRealizadas * 100.0 / totalEntregasProgramadas) 
                : 0);
            
            respuesta.put("datos", datos);
            respuesta.put("resumen", resumen);
            respuesta.put("fechaGeneracion", LocalDateTime.now().toString());
            
        } catch (Exception e) {
            System.err.println("Error al generar reporte de entregas: " + e.getMessage());
            e.printStackTrace();
            respuesta.put("error", "Error al generar reporte: " + e.getMessage());
        }
        
        return respuesta;
    }

    /**
     * Generar reporte de ventas por periodo
     */
    public Map<String, Object> generarReporteVentas(LocalDate fechaInicio, LocalDate fechaFin) {
        Map<String, Object> respuesta = new HashMap<>();
        
        try {
            // Obtener datos de ventas (ahora con montos guardados en BD)
            List<Object[]> datosVentas = registroEntregaRepository.obtenerReporteVentas(fechaInicio, fechaFin);
            
            // Procesar datos
            List<Map<String, Object>> datos = new ArrayList<>();
            double totalVentasGeneral = 0;
            double totalKilosGeneral = 0;
            double totalVentasCorriente = 0;
            double totalVentasEspecial = 0;
            int totalClientesUnicos = 0;
            
            for (Object[] row : datosVentas) {
                Map<String, Object> fila = new HashMap<>();
                java.sql.Date sqlDate = (java.sql.Date) row[0];
                LocalDate fecha = sqlDate.toLocalDate();
                Double totalVentas = ((Number) row[1]).doubleValue();
                Double totalKilos = ((Number) row[2]).doubleValue();
                Double ventasCorriente = ((Number) row[3]).doubleValue();
                Double ventasEspecial = ((Number) row[4]).doubleValue();
                Long numeroClientes = ((Number) row[5]).longValue();
                
                double ventaPromedio = numeroClientes > 0 ? totalVentas / numeroClientes : 0;
                
                fila.put("fecha", fecha.toString());
                fila.put("totalVentas", totalVentas);
                fila.put("totalKilos", totalKilos);
                fila.put("ventasCorriente", ventasCorriente);
                fila.put("ventasEspecial", ventasEspecial);
                fila.put("numeroClientes", numeroClientes);
                fila.put("ventaPromedio", ventaPromedio);
                
                datos.add(fila);
                
                totalVentasGeneral += totalVentas;
                totalKilosGeneral += totalKilos;
                totalVentasCorriente += ventasCorriente;
                totalVentasEspecial += ventasEspecial;
                totalClientesUnicos += numeroClientes.intValue();
            }
            
            // Crear resumen
            Map<String, Object> resumen = new HashMap<>();
            resumen.put("totalVentas", totalVentasGeneral);
            resumen.put("totalKilos", totalKilosGeneral);
            resumen.put("ventasCorriente", totalVentasCorriente);
            resumen.put("ventasEspecial", totalVentasEspecial);
            resumen.put("totalClientes", totalClientesUnicos);
            resumen.put("ventaPromedio", totalClientesUnicos > 0
                ? totalVentasGeneral / totalClientesUnicos 
                : 0);
            resumen.put("totalRegistros", datos.size());
            
            respuesta.put("datos", datos);
            respuesta.put("resumen", resumen);
            respuesta.put("fechaInicio", fechaInicio.toString());
            respuesta.put("fechaFin", fechaFin.toString());
            respuesta.put("fechaGeneracion", LocalDateTime.now().toString());
            
        } catch (Exception e) {
            System.err.println("Error al generar reporte de ventas: " + e.getMessage());
            e.printStackTrace();
            respuesta.put("error", "Error al generar reporte: " + e.getMessage());
        }
        
        return respuesta;
    }

    /**
     * Obtener plan de producción para una fecha específica
     */
    public Map<String, Object> getPlanProduccion(LocalDate fecha) {
        // Obtener todas las programaciones para la fecha
        List<ProgramacionEntrega> programaciones = programacionEntregaRepository.findByFechaProgramada(fecha);
        
        Map<String, Map<String, Object>> productosAgrupados = new HashMap<>();
        
        // Obtener todos los productos una sola vez antes del loop
        Map<String, String> unidadesPorProducto = new HashMap<>();
        try {
            ResponseEntity<?> productosResp = inventarioServiceClient.getProductos();
            
            if (productosResp.getStatusCode().is2xxSuccessful() && productosResp.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> productos = (List<Map<String, Object>>) productosResp.getBody();
                
                // Crear mapa de búsqueda rápida: nombreProducto -> unidadMedida
                for (Map<String, Object> producto : productos) {
                    String nombreProducto = (String) producto.get("nombre");
                    String unidadMedida = "Kg"; // default
                    
                    // Si tiene recetaMaestra, obtener unidadBase
                    if (producto.containsKey("recetaMaestra") && producto.get("recetaMaestra") != null) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> receta = (Map<String, Object>) producto.get("recetaMaestra");
                        if (receta.containsKey("unidadBase") && receta.get("unidadBase") != null) {
                            unidadMedida = receta.get("unidadBase").toString();
                        }
                    }
                    
                    unidadesPorProducto.put(nombreProducto, unidadMedida);
                }
            }
        } catch (Exception e) {
            System.err.println("Error al obtener productos del inventario: " + e.getMessage());
            // Continuar con valores por defecto
        }
        
        for (ProgramacionEntrega prog : programaciones) {
            String nombreProducto = prog.getNombreProducto();
            
            // Si el producto no existe en el map, se crea
            if (!productosAgrupados.containsKey(nombreProducto)) {
                // Obtener unidad de medida del mapa precargado o usar "Kg" por defecto
                String unidadMedida = unidadesPorProducto.getOrDefault(nombreProducto, "Kg");
                
                // Crear estructura del producto agrupado
                Map<String, Object> productoData = new HashMap<>();
                productoData.put("nombreProducto", nombreProducto);
                productoData.put("unidadMedida", unidadMedida);
                productoData.put("cantidadTotal", 0);
                productoData.put("clientes", new ArrayList<Map<String, Object>>());
                
                productosAgrupados.put(nombreProducto, productoData);
            }
            
            // Obtener datos del producto agrupado
            Map<String, Object> productoData = productosAgrupados.get(nombreProducto);
            
            // Sumar cantidad total
            Integer cantidadActual = (Integer) productoData.get("cantidadTotal");
            productoData.put("cantidadTotal", cantidadActual + prog.getCantidadProducto());
            
            // Agregar información del cliente
            try {
                ClienteDTO cliente = clienteServiceClient.getClienteById(prog.getId_cliente());
                Ruta ruta = rutaRepository.findById(prog.getId_ruta()).orElse(null);
                
                Map<String, Object> clienteInfo = new HashMap<>();
                clienteInfo.put("nombreCliente", cliente.getNombre() != null ? cliente.getNombre() : "Cliente " + prog.getId_cliente());
                clienteInfo.put("cantidad", prog.getCantidadProducto());
                clienteInfo.put("ruta", ruta != null ? ruta.getNombre() : "Sin ruta");
                
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> clientes = (List<Map<String, Object>>) productoData.get("clientes");
                clientes.add(clienteInfo);
                
            } catch (Exception e) {
                System.err.println("Error al obtener info del cliente " + prog.getId_cliente() + ": " + e.getMessage());
            }
        }
        
        // Construir respuesta
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("fecha", fecha.toString());
        respuesta.put("productos", new ArrayList<>(productosAgrupados.values()));
        respuesta.put("totalProductos", productosAgrupados.size());
        
        // Calcular cantidad total general
        int cantidadTotal = productosAgrupados.values().stream()
            .mapToInt(p -> (Integer) p.get("cantidadTotal"))
            .sum();
        respuesta.put("cantidadTotal", cantidadTotal);
        
        return respuesta;
    }

    /**
     * Convierte número de día a nombre en español
     */
    private String obtenerNombreDia(int numeroDia) {
        switch (numeroDia) {
            case 1: return "Lunes";
            case 2: return "Martes";
            case 3: return "Miércoles";
            case 4: return "Jueves";
            case 5: return "Viernes";
            case 6: return "Sábado";
            case 7: return "Domingo";
            default: return "";
        }
    }
}
