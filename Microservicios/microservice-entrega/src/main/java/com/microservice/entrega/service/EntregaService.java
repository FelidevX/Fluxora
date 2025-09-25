package com.microservice.entrega.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.microservice.entrega.client.ClienteServiceClient;
import com.microservice.entrega.dto.ClienteDTO;
import com.microservice.entrega.entity.RegistroEntrega;
import com.microservice.entrega.entity.Ruta;
import com.microservice.entrega.entity.RutaCliente;
import com.microservice.entrega.repository.RegistroEntregaRepository;
import com.microservice.entrega.repository.RutaClienteRepository;
import com.microservice.entrega.repository.RutaRepository;

@Service
public class EntregaService {

    @Autowired
    private RutaRepository rutaRepository;

    @Autowired
    private RutaClienteRepository rutaClienteRepository;

    @Autowired
    private RegistroEntregaRepository registroEntregaRepository;

    @Autowired
    private ClienteServiceClient clienteServiceClient;

    public List<Map<String, Object>> getRutasActivas() {
        List<Ruta> rutas = rutaRepository.findAll();
        List<Map<String, Object>> rutasActivas = new ArrayList<>();

        for (Ruta ruta : rutas) {
            Map<String, Object> rutaInfo = new HashMap<>();
            rutaInfo.put("id", ruta.getId());
            rutaInfo.put("nombre", ruta.getNombre());
            rutaInfo.put("id_driver", ruta.getId_driver());

            // Obtener clientes de la ruta
            List<RutaCliente> rutaClientes = rutaClienteRepository.findByIdRuta(ruta.getId());
            List<Long> clienteIds = rutaClientes.stream()
                .map(RutaCliente::getId_cliente)
                .toList();

            if (!clienteIds.isEmpty()) {
                List<ClienteDTO> clientes = clienteServiceClient.getClientesByIds(clienteIds);
                rutaInfo.put("clientes", clientes);
                rutaInfo.put("totalClientes", clientes.size());

                // Calcular entregas completadas
                int entregasCompletadas = 0;
                for (Long clienteId : clienteIds) {
                    List<RegistroEntrega> entregas = registroEntregaRepository.findByIdCliente(clienteId);
                    if (!entregas.isEmpty()) {
                        entregasCompletadas++;
                    }
                }
                rutaInfo.put("entregasCompletadas", entregasCompletadas);
                rutaInfo.put("progreso", clienteIds.size() > 0 ? (entregasCompletadas * 100) / clienteIds.size() : 0);
            } else {
                rutaInfo.put("clientes", new ArrayList<>());
                rutaInfo.put("totalClientes", 0);
                rutaInfo.put("entregasCompletadas", 0);
                rutaInfo.put("progreso", 0);
            }

            rutasActivas.add(rutaInfo);
        }

        return rutasActivas;
    }

    public List<Map<String, Object>> getClientesDeRutaConEntregas(Long idRuta) {
        List<RutaCliente> rutaClientes = rutaClienteRepository.findByIdRuta(idRuta);
        List<Long> clienteIds = rutaClientes.stream()
            .map(RutaCliente::getId_cliente)
            .toList();

        if (clienteIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<ClienteDTO> clientes = clienteServiceClient.getClientesByIds(clienteIds);
        List<Map<String, Object>> clientesConEntregas = new ArrayList<>();

        for (ClienteDTO cliente : clientes) {
            Map<String, Object> clienteInfo = new HashMap<>();
            clienteInfo.put("cliente", cliente);

            // Verificar si ya se hizo entrega
            List<RegistroEntrega> entregas = registroEntregaRepository.findByIdCliente(cliente.getId());
            clienteInfo.put("entregaRealizada", !entregas.isEmpty());
            clienteInfo.put("ultimaEntrega", entregas.isEmpty() ? null : entregas.get(entregas.size() - 1));

            // Obtener el orden de la ruta
            RutaCliente rutaCliente = rutaClientes.stream()
                .filter(rc -> rc.getId_cliente().equals(cliente.getId()))
                .findFirst()
                .orElse(null);
            clienteInfo.put("orden", rutaCliente != null ? rutaCliente.getOrden() : 0);

            clientesConEntregas.add(clienteInfo);
        }

        // Ordenar por orden de ruta
        clientesConEntregas.sort((a, b) -> {
            Integer ordenA = (Integer) a.get("orden");
            Integer ordenB = (Integer) b.get("orden");
            return ordenA.compareTo(ordenB);
        });

        return clientesConEntregas;
    }

    public void registrarEntrega(RegistroEntrega registroEntrega) {
        // Validar que el cliente existe
        if (registroEntrega.getId_cliente() == null) {
            throw new RuntimeException("ID de cliente es requerido");
        }

        // Establecer la hora actual si no se especifica
        if (registroEntrega.getHora_entregada() == null) {
            registroEntrega.setHora_entregada(LocalDateTime.now());
        }

        // Validar cantidades
        if (registroEntrega.getCorriente_entregado() == null) {
            registroEntrega.setCorriente_entregado(0.0);
        }
        if (registroEntrega.getEspecial_entregado() == null) {
            registroEntrega.setEspecial_entregado(0.0);
        }

        registroEntregaRepository.save(registroEntrega);
    }

    public List<RegistroEntrega> getHistorialEntregasCliente(Long idCliente) {
        return registroEntregaRepository.findByIdCliente(idCliente);
    }

    public List<Map<String, Object>> getEntregasConductor(Long idConductor) {
        // Buscar rutas del conductor
        List<Ruta> rutasConductor = rutaRepository.findByIdDriver(idConductor);
        List<Map<String, Object>> entregasConductor = new ArrayList<>();

        for (Ruta ruta : rutasConductor) {
            List<RutaCliente> rutaClientes = rutaClienteRepository.findByIdRuta(ruta.getId());
            
            for (RutaCliente rutaCliente : rutaClientes) {
                List<RegistroEntrega> entregas = registroEntregaRepository.findByIdCliente(rutaCliente.getId_cliente());
                
                for (RegistroEntrega entrega : entregas) {
                    Map<String, Object> entregaInfo = new HashMap<>();
                    entregaInfo.put("entrega", entrega);
                    entregaInfo.put("ruta", ruta);
                    
                    // Obtener información del cliente
                    try {
                        List<Long> clienteIds = List.of(entrega.getId_cliente());
                        List<ClienteDTO> clientes = clienteServiceClient.getClientesByIds(clienteIds);
                        if (!clientes.isEmpty()) {
                            entregaInfo.put("cliente", clientes.get(0));
                        }
                    } catch (Exception e) {
                        // Si no se puede obtener info del cliente, continuar
                    }
                    
                    entregasConductor.add(entregaInfo);
                }
            }
        }

        return entregasConductor;
    }

    public List<Map<String, Object>> getHistorialCompleto() {
        List<RegistroEntrega> todasLasEntregas = registroEntregaRepository.findAll();
        List<Map<String, Object>> historialCompleto = new ArrayList<>();

        for (RegistroEntrega entrega : todasLasEntregas) {
            Map<String, Object> entregaInfo = new HashMap<>();
            entregaInfo.put("entrega", entrega);

            // Obtener información del cliente
            try {
                List<Long> clienteIds = List.of(entrega.getId_cliente());
                List<ClienteDTO> clientes = clienteServiceClient.getClientesByIds(clienteIds);
                if (!clientes.isEmpty()) {
                    entregaInfo.put("cliente", clientes.get(0));
                }
            } catch (Exception e) {
                // Si no se puede obtener info del cliente, continuar
            }

            // Buscar la ruta asociada al cliente
            try {
                List<RutaCliente> rutaClientes = rutaClienteRepository.findAll().stream()
                    .filter(rc -> rc.getId_cliente().equals(entrega.getId_cliente()))
                    .toList();
                
                if (!rutaClientes.isEmpty()) {
                    RutaCliente rutaCliente = rutaClientes.get(0);
                    Ruta ruta = rutaRepository.findById(rutaCliente.getId_ruta()).orElse(null);
                    if (ruta != null) {
                        entregaInfo.put("ruta", ruta);
                    }
                }
            } catch (Exception e) {
                // Si no se puede obtener info de la ruta, continuar
            }

            historialCompleto.add(entregaInfo);
        }

        return historialCompleto;
    }

    // Método para crear datos de prueba
    public void crearDatosPrueba() {
        // Crear rutas de prueba
        Ruta ruta1 = new Ruta();
        ruta1.setNombre("Ruta Centro");
        ruta1.setLatitud(-12.0464); // Lima, Perú - Centro
        ruta1.setLongitud(-77.0428);
        ruta1.setId_driver(1L); // Driver 1
        rutaRepository.save(ruta1);

        Ruta ruta2 = new Ruta();
        ruta2.setNombre("Ruta Norte");
        ruta2.setLatitud(-12.0200); // Lima Norte
        ruta2.setLongitud(-77.0500);
        ruta2.setId_driver(2L); // Driver 2
        rutaRepository.save(ruta2);

        // Crear asignaciones de clientes a rutas
        RutaCliente rc1 = new RutaCliente();
        rc1.setId_ruta(ruta1.getId());
        rc1.setId_cliente(1L);
        rc1.setOrden(1);
        rutaClienteRepository.save(rc1);

        RutaCliente rc2 = new RutaCliente();
        rc2.setId_ruta(ruta1.getId());
        rc2.setId_cliente(2L);
        rc2.setOrden(2);
        rutaClienteRepository.save(rc2);

        RutaCliente rc3 = new RutaCliente();
        rc3.setId_ruta(ruta2.getId());
        rc3.setId_cliente(3L);
        rc3.setOrden(1);
        rutaClienteRepository.save(rc3);

        // Crear algunas entregas de ejemplo
        RegistroEntrega entrega1 = new RegistroEntrega();
        entrega1.setId_cliente(1L);
        entrega1.setHora_entregada(LocalDateTime.now().minusDays(1));
        entrega1.setCorriente_entregado(10.0);
        entrega1.setEspecial_entregado(5.0);
        registroEntregaRepository.save(entrega1);

        RegistroEntrega entrega2 = new RegistroEntrega();
        entrega2.setId_cliente(2L);
        entrega2.setHora_entregada(LocalDateTime.now().minusHours(2));
        entrega2.setCorriente_entregado(8.0);
        entrega2.setEspecial_entregado(3.0);
        registroEntregaRepository.save(entrega2);
    }
}