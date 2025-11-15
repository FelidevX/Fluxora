# 📊 Base de Datos Fluxora - Guía de Instalación

## 📋 Descripción

Este directorio contiene el esquema completo de la base de datos para el sistema Fluxora, un sistema integral de gestión para panaderías que incluye:

- 👥 **Gestión de Usuarios y Roles**
- 🏪 **Gestión de Clientes**
- 📦 **Inventario de Materias Primas** (con control FIFO/PPP)
- 🍞 **Catálogo de Productos y Recetas**
- 🚚 **Gestión de Rutas y Entregas**
- 📊 **Reportes y Análisis**

---

## 🗃️ Estructura de la Base de Datos

### Módulos Principales

#### 1. **Usuarios y Autenticación**
- `rol` - Catálogo de roles (ADMIN, DRIVER, PRODUCTION, SALES)
- `usuario` - Usuarios del sistema

#### 2. **Clientes**
- `cliente` - Información de clientes con geolocalización

#### 3. **Inventario - Materias Primas**
- `materias_primas` - Catálogo de materias primas
- `compras_materia_prima` - Registro de compras
- `lotes_materia_prima` - Lotes con control de stock (FIFO/PPP)

#### 4. **Inventario - Productos**
- `productos` - Catálogo de productos terminados
- `lotes_producto` - Lotes de producción con costos
- `recetas_maestras` - Recetas base
- `receta_ingredientes` - Ingredientes de cada receta
- `insumos_produccion` - Consumo de materias primas

#### 5. **Entregas y Rutas**
- `ruta` - Rutas de entrega
- `ruta_cliente` - Asignación de clientes a rutas
- `programacion_entrega` - Programación detallada
- `sesion_reparto` - Sesiones diarias de reparto
- `registro_entrega` - Entregas realizadas
- `resumen_entrega` - Resumen financiero

---

## 🚀 Instalación en Supabase

### Opción 1: SQL Editor (Recomendado)

1. **Accede a tu proyecto en Supabase**
   - Ve a https://supabase.com
   - Selecciona tu proyecto

2. **Abre el SQL Editor**
   - Click en "SQL Editor" en el menú lateral
   - Click en "+ New query"

3. **Copia y pega el contenido**
   - Abre el archivo `fluxora_schema.sql`
   - Copia TODO el contenido
   - Pégalo en el editor de Supabase

4. **Ejecuta el script**
   - Click en "Run" o presiona `Ctrl + Enter`
   - Espera a que termine (puede tomar 30-60 segundos)

5. **Verifica la instalación**
   - Ve a "Table Editor"
   - Deberías ver todas las tablas creadas

### Opción 2: CLI de Supabase

```bash
# Instala Supabase CLI
npm install -g supabase

# Login
supabase login

# Ejecuta el script
supabase db push --file fluxora_schema.sql
```

---

## ✅ Verificación Post-Instalación

### Comprobar que todas las tablas existen

Ejecuta esta consulta en SQL Editor:

```sql
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Deberías ver **18 tablas**:
- cliente
- compras_materia_prima
- insumos_produccion
- lotes_materia_prima
- lotes_producto
- materias_primas
- productos
- programacion_entrega
- receta_ingredientes
- recetas_maestras
- registro_entrega
- resumen_entrega
- rol
- ruta
- ruta_cliente
- sesion_reparto
- usuario

### Verificar datos iniciales

```sql
-- Verificar roles
SELECT * FROM rol;

-- Verificar usuario administrador
SELECT id, nombre, email FROM usuario;
```

Deberías ver:
- 4 roles: ADMIN, DRIVER, PRODUCTION, SALES
- 1 usuario: admin@fluxora.com

---

## 🔑 Credenciales por Defecto

**Usuario Administrador:**
- Email: `admin@fluxora.com`
- Contraseña: `admin123`

⚠️ **IMPORTANTE:** Cambia esta contraseña en producción

---

## 📊 Vistas Disponibles

El script crea 3 vistas útiles para reportes:

### 1. `v_stock_materias_primas`
Stock actual de todas las materias primas

```sql
SELECT * FROM v_stock_materias_primas;
```

### 2. `v_stock_productos`
Stock actual de todos los productos

```sql
SELECT * FROM v_stock_productos;
```

### 3. `v_clientes_rutas`
Clientes con sus rutas asignadas

```sql
SELECT * FROM v_clientes_rutas;
```

---

## 🛠️ Funciones Disponibles

### 1. Calcular Precio Promedio Ponderado (PPP)

```sql
SELECT fn_calcular_ppp_materia_prima(1); -- ID de materia prima
```

### 2. Verificar Stock Disponible

```sql
SELECT fn_verificar_stock_materia_prima(1, 100.5); 
-- Retorna TRUE si hay stock suficiente
```

---

## 🔄 Actualizar el Esquema

Si necesitas actualizar la base de datos:

### Para agregar cambios:

```sql
-- Ejemplo: Agregar nueva columna
ALTER TABLE cliente ADD COLUMN telefono VARCHAR(20);
```

### Para resetear completamente (⚠️ CUIDADO):

1. Descomenta las líneas de `DROP TABLE` al inicio del script
2. Ejecuta el script completo
3. **Esto eliminará TODOS los datos**

---

## 📝 Notas Técnicas

### Tipos de Datos

- `BIGSERIAL` - ID autoincremental de 64 bits
- `VARCHAR(n)` - Texto de longitud variable
- `TEXT` - Texto sin límite
- `DOUBLE PRECISION` - Números decimales
- `DATE` - Solo fecha
- `TIMESTAMP` - Fecha y hora
- `BOOLEAN` - Verdadero/Falso

### Constraints Importantes

- **Foreign Keys**: Garantizan integridad referencial
- **CHECK**: Validan valores (ej: stock_actual >= 0)
- **UNIQUE**: Previenen duplicados (ej: email)
- **NOT NULL**: Campos obligatorios

### Índices

El esquema incluye índices en:
- Claves foráneas (FK)
- Campos de búsqueda frecuente
- Campos de fecha
- Combinaciones útiles (ej: latitud + longitud)

---

## 🔐 Seguridad en Supabase

### Row Level Security (RLS)

Considera activar RLS para tablas sensibles:

```sql
-- Ejemplo: Solo usuarios autenticados pueden ver clientes
ALTER TABLE cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver clientes"
ON cliente FOR SELECT
TO authenticated
USING (true);
```

---

## 📊 Diagrama de Relaciones

```
usuario ──────────┐
    │             │
    ├─► rol       │
    │             │
    └─► ruta ─────┼─► ruta_cliente ──► cliente
                  │         │
                  │         └─► programacion_entrega
                  │
                  └─► sesion_reparto
                  
materias_primas ──┬─► lotes_materia_prima ◄── compras_materia_prima
                  │
                  └─► receta_ingredientes ◄── recetas_maestras
                                                     │
productos ────────────────────────────────────────┘
    │
    └─► lotes_producto
```

---

## 🆘 Solución de Problemas

### Error: "relation already exists"

Las tablas ya existen. Opciones:
1. Usa `DROP TABLE` para eliminarlas
2. O usa `CREATE TABLE IF NOT EXISTS` (ya incluido)

### Error: "permission denied"

Tu usuario no tiene permisos. Contacta al administrador de Supabase.

### Las vistas no aparecen

Refresca la página o ejecuta:

```sql
SELECT * FROM information_schema.views 
WHERE table_schema = 'public';
```

---

## 📞 Soporte

Para más información sobre el proyecto Fluxora:
- Repositorio: https://github.com/FelidevX/Fluxora
- Branch: feature/deploy

---

## 📄 Licencia

Este esquema es parte del sistema Fluxora.
© 2025 Fluxora - Todos los derechos reservados.
