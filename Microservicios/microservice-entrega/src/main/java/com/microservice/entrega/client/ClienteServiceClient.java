package com.microservice.entrega.client;

import java.util.Arrays;
import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.client.RestTemplate;

import com.microservice.entrega.config.FeignClientInterceptor;
import com.microservice.entrega.dto.ClienteDTO;

@FeignClient(name = "microservice-cliente", configuration = FeignClientInterceptor.class)
public interface ClienteServiceClient {

    @GetMapping("/api/clientes/clientes")
    List<ClienteDTO> getAllClientes();

    @GetMapping("/api/clientes/clientes/{ids}")
    List<ClienteDTO> getClientesByIds(@PathVariable List<Long> ids);
}
