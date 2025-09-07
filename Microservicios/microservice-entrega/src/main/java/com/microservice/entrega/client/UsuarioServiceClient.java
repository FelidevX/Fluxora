package com.microservice.entrega.client;

import java.util.List;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import com.microservice.entrega.dto.UsuarioDTO;

@FeignClient(name = "microservice-usuario")
public interface UsuarioServiceClient {

    @GetMapping("/api/usuarios/")
    public List<UsuarioDTO> getDrivers(@RequestParam("rol") String rol);

    @GetMapping("/api/usuarios/{id}")
    public UsuarioDTO getDriverById(@PathVariable("id") Long id);

}
