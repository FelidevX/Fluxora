# Pruebas Unitarias - Microservicio Usuario

Este documento describe las pruebas unitarias implementadas para el microservicio de Usuario.

## Resumen de Cobertura

**Total: 34 pruebas**
- Pruebas de Integración: 1 prueba
- Pruebas de Servicio: 33 pruebas

## Desglose de Pruebas

### 1. UsuarioServiceTest (18 pruebas)

Pruebas para el servicio de gestión de usuarios.

#### Casos de Prueba:
1. **getAllUsuarios_DeberiaRetornarListaDeUsuarios** - Verifica que se retornen todos los usuarios
2. **getAllUsuarios_DeberiaRetornarListaVacia** - Verifica comportamiento con lista vacía
3. **createUsuario_DeberiaCrearUsuarioExitosamente** - Crea usuario con todos los campos
4. **createUsuario_DeberiaLanzarExcepcionCuandoEmailYaExiste** - Valida email duplicado
5. **createUsuario_DeberiaLanzarExcepcionCuandoRolNoExiste** - Valida rol inexistente
6. **updateUsuario_DeberiaActualizarNombreYEmail** - Actualiza nombre y email
7. **updateUsuario_DeberiaActualizarPassword** - Actualiza contraseña con encoding
8. **updateUsuario_DeberiaActualizarRol** - Actualiza rol del usuario
9. **updateUsuario_DeberiaLanzarExcepcionCuandoUsuarioNoExiste** - Valida usuario inexistente
10. **updateUsuario_DeberiaLanzarExcepcionCuandoEmailYaEstaEnUso** - Valida email duplicado en actualización
11. **updateUsuario_DeberiaPermitirMantenerMismoEmail** - Permite mantener el mismo email
12. **updateUsuario_DeberiaLanzarExcepcionCuandoRolNoExiste** - Valida rol inexistente en actualización
13. **deleteUsuario_DeberiaEliminarUsuarioExitosamente** - Elimina usuario existente
14. **deleteUsuario_DeberiaLanzarExcepcionCuandoUsuarioNoExiste** - Valida eliminación de usuario inexistente
15. **getUsuariosByRol_DeberiaRetornarUsuariosPorRol** - Filtra usuarios por rol
16. **getUsuariosByRol_DeberiaRetornarListaVaciaCuandoNoHayUsuarios** - Manejo de rol sin usuarios
17. **getUsuarioById_DeberiaRetornarUsuarioCuandoExiste** - Busca usuario por ID
18. **getUsuarioById_DeberiaRetornarNullCuandoNoExiste** - Retorna null cuando no existe

**Aspectos Clave:**
- Validación de email duplicado en creación y actualización
- Encoding de contraseñas con BCrypt
- Gestión de relaciones con roles
- Actualización parcial de campos
- Validación de existencia antes de operaciones

### 2. RolServiceTest (2 pruebas)

Pruebas para el servicio de gestión de roles.

#### Casos de Prueba:
1. **getAllRoles_DeberiaRetornarListaDeRoles** - Lista todos los roles (ADMIN, USER, DRIVER)
2. **getAllRoles_DeberiaRetornarListaVacia** - Manejo de lista vacía

**Aspectos Clave:**
- Servicio simple de consulta de roles
- Los roles son datos de catálogo del sistema

### 3. AuthServiceTest (4 pruebas)

Pruebas para el servicio de autenticación.

#### Casos de Prueba:
1. **login_DeberiaRetornarTokenCuandoCredencialesSonCorrectas** - Login exitoso con JWT
2. **login_DeberiaLanzarExcepcionCuandoUsuarioNoExiste** - Usuario no registrado (401)
3. **login_DeberiaLanzarExcepcionCuandoPasswordEsIncorrecto** - Contraseña incorrecta (401)
4. **login_DeberiaGenerarTokenConInformacionCorrecta** - Verifica claims del JWT

**Aspectos Clave:**
- Autenticación con email y contraseña
- Validación de contraseña con BCrypt
- Generación de JWT con información del usuario
- Respuestas HTTP 401 UNAUTHORIZED para credenciales inválidas
- Token tipo Bearer

### 4. JwtServiceTest (9 pruebas)

Pruebas para el servicio de generación y validación de tokens JWT.

#### Casos de Prueba:
1. **generateToken_DeberiaGenerarTokenValido** - Genera token con estructura correcta
2. **generateToken_DeberiaIncluirClaimsCorrectos** - Incluye userId, email y role
3. **generateToken_DeberiaIncluirFechaEmision** - Incluye timestamp de emisión
4. **generateToken_DeberiaIncluirFechaExpiracion** - Token expira en 60 minutos
5. **parse_DeberiaParsearTokenCorrectamente** - Parsea y extrae claims
6. **parse_DeberiaLanzarExcepcionParaTokenInvalido** - Valida firma del token
7. **parse_DeberiaLanzarExcepcionParaTokenExpirado** - Detecta tokens expirados
8. **generateToken_DeberiaGenerarTokensDiferentesParaDiferentesUsuarios** - Tokens únicos por usuario
9. **parse_DeberiaManejarRolesEspeciales** - Maneja roles ADMIN, USER, DRIVER

**Aspectos Clave:**
- JWT con algoritmo HS256
- Claims: subject (userId), email, role
- Expiración configurable (60 minutos en tests)
- Validación de firma y expiración
- Estructura estándar: header.payload.signature

### 5. MicroserviceUsuarioApplicationTests (1 prueba)

Prueba de integración del contexto Spring.

#### Casos de Prueba:
1. **contextLoads** - Verifica que el contexto de Spring se cargue correctamente

**Aspectos Clave:**
- Usa perfil "test" con H2 en memoria
- Valida configuración de Spring Boot, JPA, Security
- Carga todos los beans del contexto

## 🛠️ Tecnologías Utilizadas

- **JUnit 5** - Framework de pruebas
- **Mockito** - Mocking de dependencias
- **Spring Boot Test** - Utilidades de prueba de Spring
- **H2 Database** - Base de datos en memoria (modo PostgreSQL)
- **AssertJ** - Aserciones fluidas
- **Spring Security Test** - Soporte para pruebas de seguridad

## 🏃 Ejecutar las Pruebas

### Ejecutar todas las pruebas
```bash
cd /Users/felipe/Projects/Fluxora/Microservicios/microservice-usuario
./mvnw test
```

### Ejecutar una clase específica
```bash
./mvnw test -Dtest=UsuarioServiceTest
./mvnw test -Dtest=AuthServiceTest
./mvnw test -Dtest=JwtServiceTest
```

## Cobertura de Pruebas

### Funcionalidades Probadas

#### Gestión de Usuarios
- CRUD completo de usuarios
- Validación de email duplicado
- Encoding de contraseñas con BCrypt
- Asociación con roles
- Actualización parcial de campos
- Filtrado por rol
- Validaciones de existencia

#### Gestión de Roles
- Consulta de roles del sistema
- Roles: ADMIN, USER, DRIVER

#### Autenticación JWT
- Login con email y contraseña
- Validación de credenciales
- Generación de tokens JWT
- Validación de firma y expiración
- Claims personalizados (userId, email, role)
- Manejo de errores 401 UNAUTHORIZED

## 📝 Notas Importantes

### Spring Security 

El microservicio tiene Spring Security configurado. Los tests de servicio usan mocks y no requieren autenticación. La prueba de integración carga el contexto completo con Security.
            
### Roles del Sistema

Los roles disponibles son:
- **ADMIN**: Administrador del sistema
- **DRIVER**: Conductor/repartidor

## Patron de Testing Utilizado

### Patrón AAA (Arrange-Act-Assert)
```java
@Test
void createUsuario_DeberiaCrearUsuarioExitosamente() {
    // Arrange: Configurar el escenario
    CreateUsuarioRequest request = new CreateUsuarioRequest();
    when(usuarioRepository.existsByEmail(...)).thenReturn(false);
    
    // Act: Ejecutar la acción
    Usuario result = usuarioService.createUsuario(request);
    
    // Assert: Verificar el resultado
    assertThat(result).isNotNull();
    verify(usuarioRepository, times(1)).save(any(Usuario.class));
}
```