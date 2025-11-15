# 📊 Diagrama de Relaciones - Base de Datos Fluxora

## Diagrama Completo (Mermaid)

```mermaid
erDiagram
    %% MÓDULO: USUARIOS
    rol ||--o{ usuario : "tiene"

    %% MÓDULO: CLIENTES
    cliente ||--o{ ruta_cliente : "está en"
    cliente ||--o{ programacion_entrega : "recibe"
    cliente ||--o{ registro_entrega : "recibe"

    %% MÓDULO: RUTAS Y ENTREGAS
    usuario ||--o{ ruta : "conduce"
    ruta ||--o{ ruta_cliente : "contiene"
    ruta ||--o{ programacion_entrega : "tiene"
    usuario ||--o{ sesion_reparto : "realiza"

    %% MÓDULO: MATERIAS PRIMAS
    materias_primas ||--o{ lotes_materia_prima : "tiene"
    materias_primas ||--o{ receta_ingredientes : "usa"
    materias_primas ||--o{ insumos_produccion : "consume"
    compras_materia_prima ||--o{ lotes_materia_prima : "genera"

    %% MÓDULO: PRODUCTOS Y RECETAS
    recetas_maestras ||--o{ receta_ingredientes : "contiene"
    recetas_maestras ||--o{ productos : "produce"
    productos ||--o{ lotes_producto : "tiene"
    lotes_producto ||--o{ programacion_entrega : "entrega"

    %% DEFINICIÓN DE TABLAS

    rol {
        bigint id PK
        varchar rol UK
    }

    usuario {
        bigint id PK
        varchar nombre
        varchar email UK
        varchar password
        bigint rol_id FK
    }

    cliente {
        bigint id PK
        varchar nombre_negocio
        varchar nombre
        text direccion
        varchar contacto
        varchar email
        double latitud
        double longitud
        double precio_corriente
        double precio_especial
    }

    materias_primas {
        bigint id PK
        varchar nombre
        varchar unidad
    }

    compras_materia_prima {
        bigint id PK
        varchar num_doc
        varchar tipo_doc
        varchar proveedor
        date fecha_compra
        date fecha_pago
        date created_at
    }

    lotes_materia_prima {
        bigint id PK
        bigint materia_prima_id FK
        bigint compra_id FK
        double cantidad
        double stock_actual
        double costo_unitario
        varchar numero_lote
        date fecha_compra
        date fecha_vencimiento
    }

    recetas_maestras {
        bigint id PK
        varchar nombre
        text descripcion
        varchar categoria
        varchar unidad_base
        double cantidad_base
        double precio_estimado
        double precio_unidad
        int tiempo_preparacion
        date fecha_creacion
        boolean activa
    }

    receta_ingredientes {
        bigint id PK
        bigint receta_maestra_id FK
        bigint materia_prima_id FK
        varchar materia_prima_nombre
        double cantidad_necesaria
        varchar unidad
        boolean es_opcional
        text notas
    }

    productos {
        bigint id PK
        varchar nombre
        double precio_venta
        varchar tipo_producto
        varchar categoria
        varchar estado
        bigint receta_maestra_id FK
    }

    lotes_producto {
        bigint id PK
        bigint producto_id FK
        int cantidad_producida
        int stock_actual
        double costo_produccion_total
        double costo_unitario
        date fecha_produccion
        date fecha_vencimiento
        varchar estado
    }

    insumos_produccion {
        bigint id PK
        bigint materia_prima_id FK
        double cantidad_usada
        date fecha
    }

    ruta {
        bigint id PK
        varchar nombre
        double latitud
        double longitud
        bigint id_driver FK
    }

    ruta_cliente {
        bigint id PK
        bigint id_ruta FK
        bigint id_cliente FK
        int orden
        varchar estado
        date fecha_programada
        double kg_corriente_programado
        double kg_especial_programado
        timestamp fecha_actualizacion
    }

    programacion_entrega {
        bigint id PK
        bigint id_ruta FK
        bigint id_cliente FK
        bigint id_lote FK
        date fecha_programada
        varchar nombre_producto
        int cantidad_producto
        double kg_corriente_programado
        double kg_especial_programado
        int orden
        varchar estado
        timestamp fecha_creacion
        timestamp fecha_actualizacion
    }

    sesion_reparto {
        bigint id PK
        bigint id_driver FK
        date fecha
        double kg_corriente
        double kg_especial
        double corriente_devuelto
        double especial_devuelto
        timestamp hora_retorno
    }

    registro_entrega {
        bigint id PK
        bigint id_pedido
        bigint id_cliente FK
        timestamp hora_entregada
        double corriente_entregado
        double especial_entregado
        double monto_corriente
        double monto_especial
        double monto_total
        text comentario
    }

    resumen_entrega {
        bigint id PK
        double total_corriente_vendido
        double total_especial_vendido
        double total_monto
        double diferencia_esperado
    }
```

---

## Vista Simplificada por Módulos

### 1. Módulo de Usuarios

```mermaid
graph TD
    A[Rol] -->|1:N| B[Usuario]
    B -->|conduce| C[Ruta]
    B -->|realiza| D[Sesión Reparto]
```

### 2. Módulo de Inventario - Materias Primas

```mermaid
graph TD
    A[Compra Materia Prima] -->|genera| B[Lotes Materia Prima]
    C[Materias Primas] -->|tiene| B
    C -->|usa en| D[Receta Ingredientes]
    C -->|consume| E[Insumos Producción]
```

### 3. Módulo de Productos y Recetas

```mermaid
graph TD
    A[Recetas Maestras] -->|contiene| B[Receta Ingredientes]
    A -->|produce| C[Productos]
    C -->|tiene| D[Lotes Producto]
    D -->|se entrega en| E[Programación Entrega]
```

### 4. Módulo de Entregas

```mermaid
graph TD
    A[Cliente] -->|está en| B[Ruta Cliente]
    C[Ruta] -->|contiene| B
    C -->|tiene| D[Programación Entrega]
    A -->|recibe| D
    A -->|recibe| E[Registro Entrega]
```

---

## Cardinalidad de Relaciones

| Tabla Origen              | Relación   | Tabla Destino        | Cardinalidad |
| ------------------------- | ---------- | -------------------- | ------------ |
| **rol**                   | tiene      | usuario              | 1:N          |
| **usuario**               | conduce    | ruta                 | 1:N          |
| **usuario**               | realiza    | sesion_reparto       | 1:N          |
| **cliente**               | está en    | ruta_cliente         | 1:N          |
| **cliente**               | recibe     | programacion_entrega | 1:N          |
| **cliente**               | recibe     | registro_entrega     | 1:N          |
| **ruta**                  | contiene   | ruta_cliente         | 1:N          |
| **ruta**                  | tiene      | programacion_entrega | 1:N          |
| **materias_primas**       | tiene      | lotes_materia_prima  | 1:N          |
| **materias_primas**       | usa en     | receta_ingredientes  | 1:N          |
| **materias_primas**       | consume    | insumos_produccion   | 1:N          |
| **compras_materia_prima** | genera     | lotes_materia_prima  | 1:N          |
| **recetas_maestras**      | contiene   | receta_ingredientes  | 1:N          |
| **recetas_maestras**      | produce    | productos            | 1:N          |
| **productos**             | tiene      | lotes_producto       | 1:N          |
| **lotes_producto**        | entrega en | programacion_entrega | 1:N          |

---

## Relaciones Clave

### Relaciones Obligatorias (NOT NULL)

- `usuario.rol_id` → `rol.id`
- `lotes_materia_prima.materia_prima_id` → `materias_primas.id`
- `lotes_producto.producto_id` → `productos.id`
- `ruta_cliente.id_ruta` → `ruta.id`
- `ruta_cliente.id_cliente` → `cliente.id`

### Relaciones Opcionales (NULL permitido)

- `ruta.id_driver` → `usuario.id` (puede no tener driver asignado)
- `productos.receta_maestra_id` → `recetas_maestras.id` (productos sin receta)
- `lotes_materia_prima.compra_id` → `compras_materia_prima.id` (lotes legacy)

---

## Flujos de Negocio Principales

### 1. Flujo de Compra de Materias Primas

```
Compra Materia Prima
    ↓
Lotes Materia Prima (cantidad inicial = stock_actual)
    ↓
Se consume en producción (stock_actual disminuye)
    ↓
Insumos Producción (registro histórico)
```

### 2. Flujo de Producción

```
Receta Maestra
    ↓
Receta Ingredientes (lista de materias primas)
    ↓
Consumo de Lotes Materia Prima (FIFO)
    ↓
Lotes Producto (con costo calculado PPP)
    ↓
Stock disponible para entregas
```

### 3. Flujo de Entregas

```
Ruta (asignada a driver)
    ↓
Ruta Cliente (clientes a visitar)
    ↓
Programación Entrega (productos y cantidades)
    ↓
Sesión Reparto (inventario cargado)
    ↓
Registro Entrega (entrega real)
    ↓
Resumen Entrega (consolidado financiero)
```

---

## Índices por Tabla

| Tabla                     | Índices                                                        |
| ------------------------- | -------------------------------------------------------------- |
| **usuario**               | email, rol_id                                                  |
| **cliente**               | email, (latitud, longitud)                                     |
| **materias_primas**       | nombre                                                         |
| **lotes_materia_prima**   | materia_prima_id, compra_id, fecha_vencimiento, stock_actual   |
| **compras_materia_prima** | fecha_compra, proveedor, num_doc                               |
| **recetas_maestras**      | nombre, activa                                                 |
| **receta_ingredientes**   | receta_maestra_id, materia_prima_id                            |
| **productos**             | nombre, tipo_producto, categoria, receta_maestra_id            |
| **lotes_producto**        | producto_id, fecha_produccion, fecha_vencimiento, stock_actual |
| **ruta**                  | id_driver                                                      |
| **ruta_cliente**          | id_ruta, id_cliente, fecha_programada, estado                  |
| **programacion_entrega**  | id_ruta, id_cliente, fecha_programada, estado                  |
| **sesion_reparto**        | id_driver, fecha                                               |
| **registro_entrega**      | id_pedido, id_cliente, hora_entregada                          |

---

## Visualizar en Herramientas

### DBDiagram.io

Puedes visualizar el esquema en [dbdiagram.io](https://dbdiagram.io/):

1. Copia el contenido del archivo `fluxora_schema.sql`
2. Ve a https://dbdiagram.io/
3. Pega el código SQL o usa el formato DBML

### DBeaver / pgAdmin

1. Conecta a tu base de datos Supabase
2. Ve a ER Diagram
3. Selecciona las tablas que quieres visualizar

---

## Notas Técnicas

- **PK** = Primary Key (Clave Primaria)
- **FK** = Foreign Key (Clave Foránea)
- **UK** = Unique Key (Clave Única)
- **1:N** = Uno a Muchos
- **N:M** = Muchos a Muchos (implementado con tabla intermedia)

---

## Actualizado

Fecha: 14 de noviembre de 2025
Versión: 1.0
