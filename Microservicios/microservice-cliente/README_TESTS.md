# Tests Unitarios - Microservicio Cliente

Este documento describe los tests unitarios implementados para el microservicio de clientes.

## 📋 Estructura de Tests

```
src/test/java/com/microservice/cliente/
├── controller/
│   └── ClienteControllerTest.java
├── service/
│   └── ClienteServiceTest.java
└── MicroserviceClienteApplicationTests.java
```

## 🧪 Tipos de Tests

### 1. Tests de Servicio (ClienteServiceTest)

**Total: 14 tests**

#### Operaciones CRUD:
- `testGetAllClientes()` - Obtener todos los clientes
- `testGetAllClientes_Empty()` - Lista vacía cuando no hay clientes
- `testAddCliente_Success()` - Agregar cliente exitosamente
- `testGetClienteByIds()` - Obtener clientes por lista de IDs
- `testGetClienteByIds_Empty()` - IDs que no existen
- `testGetClienteById_Found()` - Obtener cliente por ID existente
- `testGetClienteById_NotFound()` - ID que no existe

#### Eliminación:
- `testDeleteCliente_Success()` - Eliminar cliente exitosamente
- `testDeleteCliente_NotFound()` - Error cuando cliente no existe
- `testDeleteCliente_ErrorDeletingRelations()` - Error al eliminar relaciones

#### Conversión de datos:
- `testClienteDTOMapping()` - Conversión correcta de Cliente a DTO
- `testGetCoordenadas()` - Obtener coordenadas correctamente
- `testGetCoordenadas_Null()` - Manejar coordenadas nulas

### 2. Tests de Controller (ClienteControllerTest)

**Total: 14 tests organizados en 4 grupos**

#### Obtención de Clientes (5 tests):
- `deberiaObtenerTodosLosClientes()` - GET /clientes
- `deberiaRetornarListaVacia()` - Lista vacía
- `deberiaObtenerClientePorId()` - GET /clientes/cliente/{id}
- `deberiaRetornarNullCuandoNoExiste()` - Cliente no existe
- `deberiaObtenerClientesPorIds()` - GET /clientes/{ids}

#### Creación de Clientes (2 tests):
- `deberiaCrearClienteExitosamente()` - POST /clientes
- `deberiaCrearClienteConTodosCampos()` - Validar todos los campos

#### Eliminación de Clientes (3 tests):
- `deberiaEliminarClienteExitosamente()` - DELETE /clientes/{id}
- `deberiaManejarErrorClienteNoExiste()` - Cliente no existe
- `deberiaManejarErrorAlEliminarRelaciones()` - Error en microservicio externo

#### Validación de Datos (2 tests):
- `deberiaAceptarClienteConCoordenadasValidas()` - Coordenadas válidas
- `deberiaAceptarClienteConPreciosValidos()` - Precios válidos

#### Casos Límite (2 tests):
- `deberiaManejarMultiplesIds()` - Múltiples IDs en búsqueda
- `deberiaRetornarListaVaciaConIdsInexistentes()` - IDs inexistentes

### 3. Test de Integración

- `MicroserviceClienteApplicationTests` - Verifica que el contexto de Spring se carga correctamente

## 🚀 Ejecutar Tests

### Todos los tests (unitarios + integración)
```bash
./mvnw test
```

### Solo tests unitarios
```bash
./mvnw test -Dtest="*ServiceTest,*ControllerTest"
```

### Tests específicos
```bash
# Solo tests de servicio
./mvnw test -Dtest=ClienteServiceTest

# Solo tests de controller
./mvnw test -Dtest=ClienteControllerTest

# Solo test de integración
./mvnw test -Dtest=MicroserviceClienteApplicationTests
```

### Mocks
- **ClienteRepository**: Mockeado con Mockito
- **EntregaServiceClient**: Mockeado para evitar dependencias externas

## 📝 Notas Importantes

1. **Tests unitarios puros**: No requieren base de datos ni servicios externos
2. **Tests aislados**: Cada test es independiente y no afecta a otros
3. **Mocks configurados**: Todos los servicios externos están mockeados
4. **Datos de prueba**: Se crean datos limpios en cada test (@BeforeEach)

## 🎯 Casos de Prueba Cubiertos

### Casos exitosos
- Creación de clientes
- Obtención de clientes (uno, varios, todos)
- Eliminación de clientes
- Conversión de entidades a DTOs

### Casos de error ❌
- Cliente no encontrado
- Error al comunicarse con microservicio de entregas
- Listas vacías
- IDs inexistentes

### Casos especiales 🔍
- Coordenadas nulas
- Múltiples IDs
- Validación de todos los campos del cliente

## 🛠️ Stack Tecnológico

- **JUnit 5**: Framework de testing
- **Mockito**: Mocking framework
- **MockMvc**: Testing de controllers REST
- **Spring Boot Test**: Soporte para tests de Spring
- **H2**: Base de datos en memoria para tests de integración
