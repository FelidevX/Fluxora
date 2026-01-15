package com.microservice.cliente.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.microservice.cliente.dto.ClienteDTO;
import com.microservice.cliente.entity.Cliente;

/**
 * Mapper para convertir entre entidades Cliente y DTOs
 * MapStruct genera automáticamente la implementación en tiempo de compilación
 * @componentModel "spring" hace que MapStruct genere un bean de Spring
 * que puede ser inyectado como cualquier otro servicio
 */
@Mapper(componentModel = "spring")
public interface ClienteMapper {

    @Mapping(target = "nombreRuta", source = "nombreRuta")
    ClienteDTO toDTO(Cliente cliente, String nombreRuta);

    @Mapping(target = "nombreRuta", constant = "Sin ruta asignada")
    ClienteDTO toDTO(Cliente cliente);
}
