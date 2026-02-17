package com.microservice.entrega.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.microservice.entrega.client.ClienteServiceClient;
import com.microservice.entrega.dto.ClienteDTO;
import com.microservice.entrega.entity.ProgramacionEntrega;
import com.microservice.entrega.repository.ProgramacionEntregaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProgramacionService {

    private final ProgramacionEntregaRepository programacionEntregaRepository;
    private final ClienteServiceClient clienteServiceClient;

    /**
     * Actualizar programación individual de un cliente específico
     */
    public String actualizarProgramacionCliente(Long idRuta, Long idCliente, String fecha, Double kgCorriente,
            Double kgEspecial) {
        try {
            // Convertir formato de fecha si es necesario
            LocalDate fechaProgramada;
            if (fecha.contains("-") && fecha.length() == 10) {
                String[] partes = fecha.split("-");
                if (partes.length == 3 && partes[2].length() == 4) {
                    // Formato dd-MM-yyyy, convertir a yyyy-MM-dd
                    fechaProgramada = LocalDate.parse(partes[2] + "-" + partes[1] + "-" + partes[0]);
                } else {
                    // Formato yyyy-MM-dd
                    fechaProgramada = LocalDate.parse(fecha);
                }
            } else {
                fechaProgramada = LocalDate.parse(fecha);
            }

            // Verificar si ya existen programaciones para esta ruta y fecha
            List<ProgramacionEntrega> programacionesExistentes = programacionEntregaRepository.findByIdRutaAndFechaProgramada(idRuta,
                    fechaProgramada);

            if (programacionesExistentes.isEmpty()) {
                // Primera vez que se programa para esta fecha - crear programaciones para todos
                // los clientes
                List<ProgramacionEntrega> clientesBase = programacionEntregaRepository.findByIdRuta(idRuta);

                for (ProgramacionEntrega clienteBase : clientesBase) {
                    // Solo procesar clientes base (sin fecha programada)
                    if (clienteBase.getFecha_programada() == null) {
                        ProgramacionEntrega nuevaProgramacion = new ProgramacionEntrega();
                        nuevaProgramacion.setId_ruta(idRuta);
                        nuevaProgramacion.setId_cliente(clienteBase.getId_cliente());
                        nuevaProgramacion.setOrden(clienteBase.getOrden());
                        nuevaProgramacion.setFecha_programada(fechaProgramada);
                        nuevaProgramacion.setEstado("PROGRAMADO");

                        // Si es el cliente que se está editando, usar los valores proporcionados
                        if (clienteBase.getId_cliente().equals(idCliente)) {
                            nuevaProgramacion.setKg_corriente_programado(kgCorriente);
                            nuevaProgramacion.setKg_especial_programado(kgEspecial);
                        } else {
                            // Para los demás clientes, usar valores por defecto (0)
                            nuevaProgramacion.setKg_corriente_programado(0.0);
                            nuevaProgramacion.setKg_especial_programado(0.0);
                        }

                        programacionEntregaRepository.save(nuevaProgramacion);
                    }
                }

                return "Programación creada exitosamente para toda la ruta. Cliente " + idCliente + " actualizado.";
            } else {
                // Ya existen programaciones - solo actualizar el cliente específico
                List<ProgramacionEntrega> programacionClienteOpt = programacionEntregaRepository
                        .findByIdRutaAndIdClienteAndFechaProgramada(idRuta, idCliente, fechaProgramada);

                if (!programacionClienteOpt.isEmpty()) {
                    ProgramacionEntrega programacionCliente = programacionClienteOpt.get(0);
                    programacionCliente.setKg_corriente_programado(kgCorriente);
                    programacionCliente.setKg_especial_programado(kgEspecial);
                    programacionCliente.setEstado("PROGRAMADO");
                    programacionEntregaRepository.save(programacionCliente);

                    return "Programación actualizada exitosamente para el cliente " + idCliente;
                } else {
                    return "Error: No se encontró la programación para el cliente " + idCliente;
                }
            }

        } catch (Exception e) {
            return "Error al actualizar programación: " + e.getMessage();
        }
    }

    /**
     * Obtener programación del día anterior para preasignar valores
     */
    public List<Map<String, Object>> obtenerProgramacionAnterior(Long idRuta, String fecha) {
        LocalDate fechaActual = LocalDate.parse(fecha);
        LocalDate fechaAnterior = fechaActual.minusDays(1);

        List<ProgramacionEntrega> programacionAnterior = programacionEntregaRepository
                .findByIdRutaAndFechaProgramada(idRuta, fechaAnterior);

        List<Map<String, Object>> resultado = new ArrayList<>();

        for (ProgramacionEntrega prog : programacionAnterior) {
            Map<String, Object> programacion = new HashMap<>();
            programacion.put("id_cliente", prog.getId_cliente());
            programacion.put("kg_corriente_programado", prog.getKg_corriente_programado());
            programacion.put("kg_especial_programado", prog.getKg_especial_programado());
            programacion.put("orden", prog.getOrden());

            // Obtener información del cliente
            try {
                List<Long> clienteIds = List.of(prog.getId_cliente());
                List<ClienteDTO> clientes = clienteServiceClient.getClientesByIds(clienteIds);
                if (!clientes.isEmpty()) {
                    programacion.put("cliente", clientes.get(0));
                }
            } catch (Exception e) {
                log.warn("Error al obtener cliente {}: {}", prog.getId_cliente(), e.getMessage());
            }

            resultado.add(programacion);
        }

        return resultado;
    }

    /**
     * Programar entrega diaria con productos
     */
    @Transactional
    public String programarEntrega(Long idRuta, Long idCliente, LocalDate fechaProgramacion, List<Map<String, Object>> productos) {
        try {
            // Primero, eliminar las programaciones existentes para este cliente en esta ruta y fecha
            // Esto permite actualizar los productos sin duplicar
            List<ProgramacionEntrega> programacionesExistentes = programacionEntregaRepository
                .findByIdRutaAndIdClienteAndFechaProgramada(idRuta, idCliente, fechaProgramacion);
            
            if (!programacionesExistentes.isEmpty()) {
                programacionEntregaRepository.deleteAll(programacionesExistentes);
                log.info("Se eliminaron {} programaciones existentes para el cliente {}", 
                    programacionesExistentes.size(), idCliente);
            }
            
            // Ahora crear las nuevas programaciones
            for (Map<String, Object> prod : productos) {
                Long idLote = Long.valueOf(prod.get("id_lote").toString());
                Integer cantidad = Integer.valueOf(prod.get("cantidad_kg").toString());
                String nombreProducto = prod.get("nombreProducto").toString();
                String tipoProducto = prod.get("tipoProducto").toString();

                ProgramacionEntrega programacion = new ProgramacionEntrega();
                programacion.setId_ruta(idRuta);
                programacion.setId_cliente(idCliente);
                programacion.setId_lote(idLote);
                programacion.setCantidadProducto(cantidad);
                programacion.setNombreProducto(nombreProducto);
                programacion.setFecha_programada(fechaProgramacion);

                if(tipoProducto.equalsIgnoreCase("corriente")){
                    programacion.setKg_corriente_programado((double) cantidad);
                    programacion.setKg_especial_programado(0.0);
                } else if(tipoProducto.equalsIgnoreCase("especial")){
                    programacion.setKg_especial_programado((double) cantidad);
                    programacion.setKg_corriente_programado(0.0);
                } else {
                    throw new IllegalArgumentException("Tipo de producto inválido: " + tipoProducto);
                }

                programacionEntregaRepository.save(programacion);
            }
            
            return "Entrega programada exitosamente";
        } catch (Exception e) {
            throw new RuntimeException("Error al programar entrega diaria: " + e.getMessage(), e);
        }
    }

    /**
     * Obtener programación por ruta y fecha
     */
    public List<ProgramacionEntrega> getProgramacionPorRutaYFecha(Long idRuta, LocalDate fecha) {
        try {
            return programacionEntregaRepository.findByIdRutaAndFechaProgramada(idRuta, fecha);
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener programación por ruta y fecha: " + e.getMessage(), e);
        }
    }
}
