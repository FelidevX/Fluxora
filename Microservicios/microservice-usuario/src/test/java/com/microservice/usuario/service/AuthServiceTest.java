package com.microservice.usuario.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.microservice.usuario.dto.LoginRequest;
import com.microservice.usuario.dto.LoginResponse;
import com.microservice.usuario.entity.Rol;
import com.microservice.usuario.entity.Usuario;
import com.microservice.usuario.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private Usuario usuario;
    private Rol rol;

    @BeforeEach
    void setUp() {
        rol = new Rol(1L, "ADMIN");
        usuario = new Usuario(1L, "Juan Pérez", "juan@example.com", "encodedPassword", rol);
    }

    @Test
    void login_DeberiaRetornarTokenCuandoCredencialesSonCorrectas() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("juan@example.com");
        request.setPassword("password123");

        when(usuarioRepository.findByEmail("juan@example.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(jwtService.generateToken(1L, "juan@example.com", "ADMIN")).thenReturn("generatedJwtToken");

        // Act
        LoginResponse result = authService.login(request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getAccessToken()).isEqualTo("generatedJwtToken");
        assertThat(result.getTokenType()).isEqualTo("Bearer");
        verify(usuarioRepository, times(1)).findByEmail("juan@example.com");
        verify(passwordEncoder, times(1)).matches("password123", "encodedPassword");
        verify(jwtService, times(1)).generateToken(1L, "juan@example.com", "ADMIN");
    }

    @Test
    void login_DeberiaLanzarExcepcionCuandoUsuarioNoExiste() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("noexiste@example.com");
        request.setPassword("password123");

        when(usuarioRepository.findByEmail("noexiste@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Credenciales inválidas")
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        
        verify(usuarioRepository, times(1)).findByEmail("noexiste@example.com");
        verify(passwordEncoder, times(0)).matches(anyString(), anyString());
        verify(jwtService, times(0)).generateToken(anyLong(), anyString(), anyString());
    }

    @Test
    void login_DeberiaLanzarExcepcionCuandoPasswordEsIncorrecto() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("juan@example.com");
        request.setPassword("wrongPassword");

        when(usuarioRepository.findByEmail("juan@example.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Credenciales inválidas")
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        
        verify(usuarioRepository, times(1)).findByEmail("juan@example.com");
        verify(passwordEncoder, times(1)).matches("wrongPassword", "encodedPassword");
        verify(jwtService, times(0)).generateToken(anyLong(), anyString(), anyString());
    }

    @Test
    void login_DeberiaGenerarTokenConInformacionCorrecta() {
        // Arrange
        Rol rolDriver = new Rol(3L, "DRIVER");
        Usuario driver = new Usuario(5L, "Pedro Driver", "pedro@example.com", "encodedPassword", rolDriver);
        
        LoginRequest request = new LoginRequest();
        request.setEmail("pedro@example.com");
        request.setPassword("password123");

        when(usuarioRepository.findByEmail("pedro@example.com")).thenReturn(Optional.of(driver));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(jwtService.generateToken(5L, "pedro@example.com", "DRIVER")).thenReturn("driverToken");

        // Act
        LoginResponse result = authService.login(request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getAccessToken()).isEqualTo("driverToken");
        assertThat(result.getTokenType()).isEqualTo("Bearer");
        verify(jwtService, times(1)).generateToken(5L, "pedro@example.com", "DRIVER");
    }
}
