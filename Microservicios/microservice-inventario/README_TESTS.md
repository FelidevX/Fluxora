# Pruebas Unitarias - Microservicio Inventario

Este documento describe las pruebas unitarias implementadas para el microservicio de inventario.

## 📋 Resumen de Pruebas

**Total: 56 pruebas**
- Pruebas de Integración: 1 prueba
- Pruebas de Servicio: 55 pruebas

### Pruebas de Servicios (Service Tests)
Se han implementado 4 clases de pruebas de servicios con un total de **55 tests**:

1. **ProductoServiceTest** (13 tests)
   - `findAll()` - Listar todos los productos
   - `findById()` - Obtener producto por ID
   - `save()` - Crear nuevos productos con/sin receta
   - `update()` - Actualizar productos existentes
   - `delete()` - Eliminar productos
   - Conversión DTO y manejo de enums
   - Manejo de excepciones

2. **MateriaPrimaServiceTest** (12 tests)
   - `findAll()` - Listar materias primas con stock calculado
   - `save()` - Crear/actualizar materias primas
   - `actualizarStock()` - Actualizar stock desde lotes
   - `delete()` - Eliminar materias primas
   - `findByNombre()` - Búsqueda por nombre (case-insensitive)
   - Manejo de stock null

3. **RecetaServiceTest** (12 tests)
   - `getAllRecetas()` - Listar todas las recetas
   - `getRecetasByProductoId()` - Obtener recetas por producto
   - `getRecetaById()` - Obtener receta específica
   - `createReceta()` - Crear nueva receta
   - `updateReceta()` - Actualizar receta existente
   - `deleteReceta()` - Eliminar receta por ID
   - `deleteRecetasByProductoId()` - Eliminar todas las recetas de un producto

4. **LoteProductoServiceTest** (18 tests)
   - `save()` - Crear lotes con/sin receta
   - **Lógica FEFO (First Expired, First Out)**:
     - Validación de stock disponible antes de producción
     - Descuento automático de materias primas usando FEFO
     - Manejo de múltiples lotes de materia prima
   - `findAll()` - Listar todos los lotes
   - `findById()` - Obtener lote por ID
   - `getStockTotalByProducto()` - Calcular stock total
   - `findLotesDisponibles()` - Listar lotes disponibles ordenados por FEFO
   - `verificarStockDisponible()` - Verificar disponibilidad para producción
   - `descontarStock()` - Descontar stock aplicando FEFO
   - Cálculo automático de costo unitario

### Prueba de Integración
**MicroserviceInventarioApplicationTests** (1 test)
- Verifica que el contexto de Spring se carga correctamente con perfil de test

## 📊 Total de Pruebas
- **Pruebas de Servicios:** 55 tests 
- **Pruebas de Integración:** 1 test 
- **TOTAL:** **56 tests**

## 🛠️ Tecnologías Utilizadas

- **JUnit 5** - Framework de pruebas
- **Mockito** - Mocking de dependencias
- **H2 Database** - Base de datos en memoria para pruebas (modo PostgreSQL)
- **Spring Boot Test** - Soporte de pruebas de Spring
- **AssertJ** - Aserciones fluidas

## 🏃 Ejecutar las Pruebas

### Ejecutar todas las pruebas
```bash
cd /Users/felipe/Projects/Fluxora/Microservicios/microservice-inventario
./mvnw test
```

### Ejecutar pruebas de una clase específica
```bash
./mvnw test -Dtest=ProductoServiceTest
./mvnw test -Dtest=LoteProductoServiceTest
```

## ⚙️ Configuración de Pruebas

### application-test.properties
Las pruebas utilizan H2 en memoria con las siguientes configuraciones:
- Modo PostgreSQL para compatibilidad
- DDL auto create-drop
- Eureka deshabilitado
- Logging SQL configurado para debugging

### Características de las Pruebas

1. **Aislamiento**: Cada test es independiente usando `@ExtendWith(MockitoExtension.class)`
2. **Mocking**: Todas las dependencias externas están mockeadas
3. **Base de datos en memoria**: H2 con modo PostgreSQL
4. **Perfil de test**: Usa `@ActiveProfiles("test")` para la prueba de integración

## Cobertura de Pruebas

### Funcionalidades Probadas

#### Gestión de Productos
- CRUD completo de productos
- Manejo de tipos de producto (CORRIENTE, ESPECIAL, NO_APLICA)
- Asociación con recetas maestras
- Conversión entre DTOs y entidades
- Manejo de casos edge (stock null, enums)

#### Gestión de Materias Primas
- CRUD completo de materias primas
- Cálculo de stock desde lotes
- Búsqueda por nombre (case-insensitive)
- Actualización de stock
- Conversión a DTO con stock calculado

#### Gestión de Recetas
- CRUD completo de recetas
- Filtrado por producto
- Eliminación en cascada por producto
- Conversión a DTO
- Manejo de casos inexistentes

#### Gestión de Lotes de Producto
- Creación de lotes con validación de receta
- **Lógica FEFO** para consumo de materias primas
- Validación de stock antes de producción
- Descuento automático de múltiples lotes
- Verificación de disponibilidad para producción
- Cálculo automático de costos
- Ordenamiento por fecha de vencimiento
- Filtrado de lotes disponibles (stock > 0)

