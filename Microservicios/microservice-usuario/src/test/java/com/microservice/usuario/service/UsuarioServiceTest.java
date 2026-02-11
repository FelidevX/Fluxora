package com.microservice.usuario.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.microservice.usuario.dto.CreateUsuarioRequest;
import com.microservice.usuario.dto.UpdateUsuarioRequest;
import com.microservice.usuario.entity.Rol;
import com.microservice.usuario.entity.Usuario;
import com.microservice.usuario.repository.RolRepository;
import com.microservice.usuario.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private RolRepository rolRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UsuarioService usuarioService;

    private Usuario usuario;
    private Rol rol;

    @BeforeEach
    void setUp() {
        rol = new Rol(1L, "ADMIN");
        usuario = new Usuario(1L, "Juan Pérez", "juan@example.com", "encodedPassword", rol);
    }

    @Test
    void getAllUsuarios_DeberiaRetornarListaDeUsuarios() {
        // Arrange
        Usuario usuario2 = new Usuario(2L, "María García", "maria@example.com", "encodedPassword", rol);
        when(usuarioRepository.findAll()).thenReturn(Arrays.asList(usuario, usuario2));

        // Act
        List<Usuario> result = usuarioService.getAllUsuarios();

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getNombre()).isEqualTo("Juan Pérez");
        assertThat(result.get(1).getNombre()).isEqualTo("María García");
        verify(usuarioRepository, times(1)).findAll();
    }

    @Test
    void getAllUsuarios_DeberiaRetornarListaVacia() {
        // Arrange
        when(usuarioRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        List<Usuario> result = usuarioService.getAllUsuarios();

        // Assert
        assertThat(result).isEmpty();
        verify(usuarioRepository, times(1)).findAll();
    }

    @Test
    void createUsuario_DeberiaCrearUsuarioExitosamente() {
        // Arrange
        CreateUsuarioRequest request = new CreateUsuarioRequest();
        request.setNombre("Carlos López");
        request.setEmail("carlos@example.com");
        request.setPassword("password123");
        request.setRolId(1L);

        when(usuarioRepository.existsByEmail("carlos@example.com")).thenReturn(false);
        when(rolRepository.findById(1L)).thenReturn(Optional.of(rol));
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword123");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> {
            Usuario u = invocation.getArgument(0);
            u.setId(3L);
            return u;
        });

        // Act
        Usuario result = usuarioService.createUsuario(request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getNombre()).isEqualTo("Carlos López");
        assertThat(result.getEmail()).isEqualTo("carlos@example.com");
        assertThat(result.getPassword()).isEqualTo("encodedPassword123");
        assertThat(result.getRol()).isEqualTo(rol);
        verify(usuarioRepository, times(1)).existsByEmail("carlos@example.com");
        verify(rolRepository, times(1)).findById(1L);
        verify(passwordEncoder, times(1)).encode("password123");
        verify(usuarioRepository, times(1)).save(any(Usuario.class));
    }

    @Test
    void createUsuario_DeberiaLanzarExcepcionCuandoEmailYaExiste() {
        // Arrange
        CreateUsuarioRequest request = new CreateUsuarioRequest();
        request.setEmail("juan@example.com");
        request.setPassword("password123");
        request.setRolId(1L);

        when(usuarioRepository.existsByEmail("juan@example.com")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> usuarioService.createUsuario(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Email ya registrado");
        
        verify(usuarioRepository, times(1)).existsByEmail("juan@example.com");
        verify(rolRepository, times(0)).findById(anyLong());
        verify(usuarioRepository, times(0)).save(any(Usuario.class));
    }

    @Test
    void createUsuario_DeberiaLanzarExcepcionCuandoRolNoExiste() {
        // Arrange
        CreateUsuarioRequest request = new CreateUsuarioRequest();
        request.setNombre("Pedro Martínez");
        request.setEmail("pedro@example.com");
        request.setPassword("password123");
        request.setRolId(99L);

        when(usuarioRepository.existsByEmail("pedro@example.com")).thenReturn(false);
        when(rolRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> usuarioService.createUsuario(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Rol no encontrado");
        
        verify(usuarioRepository, times(1)).existsByEmail("pedro@example.com");
        verify(rolRepository, times(1)).findById(99L);
        verify(usuarioRepository, times(0)).save(any(Usuario.class));
    }

    @Test
    void updateUsuario_DeberiaActualizarNombreYEmail() {
        // Arrange
        UpdateUsuarioRequest request = new UpdateUsuarioRequest();
        request.setNombre("Juan Carlos Pérez");
        request.setEmail("juancarlos@example.com");

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.existsByEmail("juancarlos@example.com")).thenReturn(false);
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        // Act
        Usuario result = usuarioService.updateUsuario(1L, request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getNombre()).isEqualTo("Juan Carlos Pérez");
        assertThat(result.getEmail()).isEqualTo("juancarlos@example.com");
        verify(usuarioRepository, times(1)).findById(1L);
        verify(usuarioRepository, times(1)).existsByEmail("juancarlos@example.com");
        verify(usuarioRepository, times(1)).save(usuario);
    }

    @Test
    void updateUsuario_DeberiaActualizarPassword() {
        // Arrange
        UpdateUsuarioRequest request = new UpdateUsuarioRequest();
        request.setPassword("newPassword123");

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(passwordEncoder.encode("newPassword123")).thenReturn("newEncodedPassword");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        // Act
        Usuario result = usuarioService.updateUsuario(1L, request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getPassword()).isEqualTo("newEncodedPassword");
        verify(usuarioRepository, times(1)).findById(1L);
        verify(passwordEncoder, times(1)).encode("newPassword123");
        verify(usuarioRepository, times(1)).save(usuario);
    }

    @Test
    void updateUsuario_DeberiaActualizarRol() {
        // Arrange
        Rol nuevoRol = new Rol(2L, "USER");
        UpdateUsuarioRequest request = new UpdateUsuarioRequest();
        request.setRolId(2L);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(rolRepository.findById(2L)).thenReturn(Optional.of(nuevoRol));
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        // Act
        Usuario result = usuarioService.updateUsuario(1L, request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getRol()).isEqualTo(nuevoRol);
        assertThat(result.getRol().getRol()).isEqualTo("USER");
        verify(usuarioRepository, times(1)).findById(1L);
        verify(rolRepository, times(1)).findById(2L);
        verify(usuarioRepository, times(1)).save(usuario);
    }

    @Test
    void updateUsuario_DeberiaLanzarExcepcionCuandoUsuarioNoExiste() {
        // Arrange
        UpdateUsuarioRequest request = new UpdateUsuarioRequest();
        request.setNombre("Nuevo Nombre");

        when(usuarioRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> usuarioService.updateUsuario(99L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Usuario no encontrado");
        
        verify(usuarioRepository, times(1)).findById(99L);
        verify(usuarioRepository, times(0)).save(any(Usuario.class));
    }

    @Test
    void updateUsuario_DeberiaLanzarExcepcionCuandoEmailYaEstaEnUso() {
        // Arrange
        UpdateUsuarioRequest request = new UpdateUsuarioRequest();
        request.setEmail("maria@example.com");

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.existsByEmail("maria@example.com")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> usuarioService.updateUsuario(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Email ya registrado");
        
        verify(usuarioRepository, times(1)).findById(1L);
        verify(usuarioRepository, times(1)).existsByEmail("maria@example.com");
        verify(usuarioRepository, times(0)).save(any(Usuario.class));
    }

    @Test
    void updateUsuario_DeberiaPermitirMantenerMismoEmail() {
        // Arrange
        UpdateUsuarioRequest request = new UpdateUsuarioRequest();
        request.setEmail("juan@example.com"); // mismo email actual

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        // Act
        Usuario result = usuarioService.updateUsuario(1L, request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("juan@example.com");
        verify(usuarioRepository, times(1)).findById(1L);
        verify(usuarioRepository, times(0)).existsByEmail(anyString()); // No debe validar
        verify(usuarioRepository, times(1)).save(usuario);
    }

    @Test
    void updateUsuario_DeberiaLanzarExcepcionCuandoRolNoExiste() {
        // Arrange
        UpdateUsuarioRequest request = new UpdateUsuarioRequest();
        request.setRolId(99L);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(rolRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> usuarioService.updateUsuario(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Rol no encontrado");
        
        verify(usuarioRepository, times(1)).findById(1L);
        verify(rolRepository, times(1)).findById(99L);
        verify(usuarioRepository, times(0)).save(any(Usuario.class));
    }

    @Test
    void deleteUsuario_DeberiaEliminarUsuarioExitosamente() {
        // Arrange
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));

        // Act
        Usuario result = usuarioService.deleteUsuario(1L);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getNombre()).isEqualTo("Juan Pérez");
        verify(usuarioRepository, times(1)).findById(1L);
        verify(usuarioRepository, times(1)).delete(usuario);
    }

    @Test
    void deleteUsuario_DeberiaLanzarExcepcionCuandoUsuarioNoExiste() {
        // Arrange
        when(usuarioRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> usuarioService.deleteUsuario(99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Usuario no encontrado");
        
        verify(usuarioRepository, times(1)).findById(99L);
        verify(usuarioRepository, times(0)).delete(any(Usuario.class));
    }

    @Test
    void getUsuariosByRol_DeberiaRetornarUsuariosPorRol() {
        // Arrange
        Usuario usuario2 = new Usuario(2L, "Pedro Admin", "pedro@example.com", "encodedPassword", rol);
        when(usuarioRepository.findByRolRol("ADMIN")).thenReturn(Arrays.asList(usuario, usuario2));

        // Act
        List<Usuario> result = usuarioService.getUsuariosByRol("ADMIN");

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getRol().getRol()).isEqualTo("ADMIN");
        assertThat(result.get(1).getRol().getRol()).isEqualTo("ADMIN");
        verify(usuarioRepository, times(1)).findByRolRol("ADMIN");
    }

    @Test
    void getUsuariosByRol_DeberiaRetornarListaVaciaCuandoNoHayUsuarios() {
        // Arrange
        when(usuarioRepository.findByRolRol("DRIVER")).thenReturn(Arrays.asList());

        // Act
        List<Usuario> result = usuarioService.getUsuariosByRol("DRIVER");

        // Assert
        assertThat(result).isEmpty();
        verify(usuarioRepository, times(1)).findByRolRol("DRIVER");
    }

    @Test
    void getUsuarioById_DeberiaRetornarUsuarioCuandoExiste() {
        // Arrange
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));

        // Act
        Usuario result = usuarioService.getUsuarioById(1L);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getNombre()).isEqualTo("Juan Pérez");
        assertThat(result.getEmail()).isEqualTo("juan@example.com");
        verify(usuarioRepository, times(1)).findById(1L);
    }

    @Test
    void getUsuarioById_DeberiaRetornarNullCuandoNoExiste() {
        // Arrange
        when(usuarioRepository.findById(99L)).thenReturn(Optional.empty());

        // Act
        Usuario result = usuarioService.getUsuarioById(99L);

        // Assert
        assertThat(result).isNull();
        verify(usuarioRepository, times(1)).findById(99L);
    }
}
