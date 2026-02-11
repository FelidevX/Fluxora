# Tests Unitarios - Microservicio de Entrega

## 📋 Estructura de Tests

Se realizaron test al servicio y controller de rutas, como al servicio y contrller de entregas.

## 🎯 Cobertura de Tests

### RutaServiceTest
- Obtención de rutas y origen
- Gestión de clientes en rutas
- Asignación de clientes a rutas
- Obtención de rutas por driver
- Inicio y finalización de rutas
- Optimización de rutas con OR-Tools
- Generación de rutas OSRM

### EntregaServiceTest
- Registro de entregas con lotes de productos
- Validación de productos y pedidos
- Cálculo de montos (corriente, especial, total)
- Historial de entregas por cliente
- Asignación de drivers a rutas
- Obtención de entregas por pedido
- Gestión de sesiones de reparto
- Programación de entregas

### RutaControllerTest
- Endpoints de optimización de rutas
- Obtención de clientes de ruta
- Asignación de clientes a rutas
- Inicio y finalización de rutas
- Manejo de errores y excepciones

### EntregaControllerTest
- Registro de entregas con validaciones
- Historial de entregas por cliente
- Entregas por pedido
- Gestión de pedidos
- Asignación de drivers
- Rutas activas
- Creación de rutas

## Cómo Ejecutar los Tests

### Todos los tests
```bash
cd Microservicios/microservice-entrega
mvn test
```

### Solo tests de servicios
```bash
mvn test -Dtest="*Service*"
```

### Solo tests de controllers
```bash
mvn test -Dtest="*Controller*"
```

### Un archivo específico
```bash
mvn test -Dtest=RutaServiceTest
mvn test -Dtest=EntregaServiceTest
mvn test -Dtest=RutaControllerTest
mvn test -Dtest=EntregaControllerTest
```

### Ejecutar un test específico
```bash
mvn test -Dtest=RutaServiceTest#testGetOrigenRuta_Exitoso
```

## Tecnologías Utilizadas

- **JUnit 5**: Framework de testing
- **Mockito**: Mocking de dependencias
- **MockMvc**: Testing de controllers REST
- **Spring Boot Test**: Testing de aplicaciones Spring Boot
