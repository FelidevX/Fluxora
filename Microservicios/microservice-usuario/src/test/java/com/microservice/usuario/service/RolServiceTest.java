package com.microservice.usuario.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.microservice.usuario.entity.Rol;
import com.microservice.usuario.repository.RolRepository;

@ExtendWith(MockitoExtension.class)
class RolServiceTest {

    @Mock
    private RolRepository rolRepository;

    @InjectMocks
    private RolService rolService;

    private Rol rolAdmin;
    private Rol rolUser;
    private Rol rolDriver;

    @BeforeEach
    void setUp() {
        rolAdmin = new Rol(1L, "ADMIN");
        rolUser = new Rol(2L, "USER");
        rolDriver = new Rol(3L, "DRIVER");
    }

    @Test
    void getAllRoles_DeberiaRetornarListaDeRoles() {
        // Arrange
        when(rolRepository.findAll()).thenReturn(Arrays.asList(rolAdmin, rolUser, rolDriver));

        // Act
        List<Rol> result = rolService.getAllRoles();

        // Assert
        assertThat(result).hasSize(3);
        assertThat(result.get(0).getRol()).isEqualTo("ADMIN");
        assertThat(result.get(1).getRol()).isEqualTo("USER");
        assertThat(result.get(2).getRol()).isEqualTo("DRIVER");
        verify(rolRepository, times(1)).findAll();
    }

    @Test
    void getAllRoles_DeberiaRetornarListaVacia() {
        // Arrange
        when(rolRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        List<Rol> result = rolService.getAllRoles();

        // Assert
        assertThat(result).isEmpty();
        verify(rolRepository, times(1)).findAll();
    }
}
