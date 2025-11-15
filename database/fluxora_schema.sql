-- ===============================================
-- SCRIPT SQL COMPLETO - FLUXORA DATABASE
-- Sistema de Gestión Integral para Panadería
-- Compatible con PostgreSQL (Supabase)
-- ===============================================
-- Fecha de generación: 14 de noviembre de 2025
-- Versión: 1.0
-- ===============================================

-- ===============================================
-- LIMPIAR BASE DE DATOS (CUIDADO EN PRODUCCIÓN)
-- ===============================================
-- Descomenta las siguientes líneas solo si quieres reiniciar la base de datos

-- DROP TABLE IF EXISTS programacion_entrega CASCADE;
-- DROP TABLE IF EXISTS registro_entrega CASCADE;
-- DROP TABLE IF EXISTS resumen_entrega CASCADE;
-- DROP TABLE IF EXISTS sesion_reparto CASCADE;
-- DROP TABLE IF EXISTS ruta_cliente CASCADE;
-- DROP TABLE IF EXISTS ruta CASCADE;
-- DROP TABLE IF EXISTS insumos_produccion CASCADE;
-- DROP TABLE IF EXISTS receta_ingredientes CASCADE;
-- DROP TABLE IF EXISTS recetas_maestras CASCADE;
-- DROP TABLE IF EXISTS lotes_producto CASCADE;
-- DROP TABLE IF EXISTS productos CASCADE;
-- DROP TABLE IF EXISTS lotes_materia_prima CASCADE;
-- DROP TABLE IF EXISTS compras_materia_prima CASCADE;
-- DROP TABLE IF EXISTS materias_primas CASCADE;
-- DROP TABLE IF EXISTS cliente CASCADE;
-- DROP TABLE IF EXISTS usuario CASCADE;
-- DROP TABLE IF EXISTS rol CASCADE;

-- ===============================================
-- MÓDULO: USUARIOS Y AUTENTICACIÓN
-- ===============================================

-- Tabla: ROL
-- Catálogo de roles del sistema
CREATE TABLE IF NOT EXISTS rol (
    id BIGSERIAL PRIMARY KEY,
    rol VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla: USUARIO
-- Usuarios del sistema con autenticación
CREATE TABLE IF NOT EXISTS usuario (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol_id BIGINT NOT NULL,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) 
        REFERENCES rol(id) ON DELETE RESTRICT
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);
CREATE INDEX IF NOT EXISTS idx_usuario_rol_id ON usuario(rol_id);

-- ===============================================
-- MÓDULO: CLIENTES
-- ===============================================

-- Tabla: CLIENTE
-- Información de clientes y negocios
CREATE TABLE IF NOT EXISTS cliente (
    id BIGSERIAL PRIMARY KEY,
    nombre_negocio VARCHAR(255),
    nombre VARCHAR(255),
    direccion TEXT,
    contacto VARCHAR(50),
    email VARCHAR(255),
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    precio_corriente DOUBLE PRECISION,
    precio_especial DOUBLE PRECISION
);

-- Índices para optimizar búsquedas geográficas
CREATE INDEX IF NOT EXISTS idx_cliente_email ON cliente(email);
CREATE INDEX IF NOT EXISTS idx_cliente_coordenadas ON cliente(latitud, longitud);

-- ===============================================
-- MÓDULO: INVENTARIO - MATERIAS PRIMAS
-- ===============================================

-- Tabla: MATERIAS_PRIMAS
-- Catálogo de materias primas
CREATE TABLE IF NOT EXISTS materias_primas (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    unidad VARCHAR(50) NOT NULL -- kg, litros, unidades, etc.
);

-- Índice para búsquedas por nombre
CREATE INDEX IF NOT EXISTS idx_materias_primas_nombre ON materias_primas(nombre);

-- Tabla: COMPRAS_MATERIA_PRIMA
-- Registro de compras de materias primas
CREATE TABLE IF NOT EXISTS compras_materia_prima (
    id BIGSERIAL PRIMARY KEY,
    num_doc VARCHAR(50) NOT NULL,
    tipo_doc VARCHAR(20) NOT NULL CHECK (tipo_doc IN ('BOLETA', 'FACTURA')),
    proveedor VARCHAR(255) NOT NULL,
    fecha_compra DATE NOT NULL,
    fecha_pago DATE,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_compras_fecha ON compras_materia_prima(fecha_compra);
CREATE INDEX IF NOT EXISTS idx_compras_proveedor ON compras_materia_prima(proveedor);
CREATE INDEX IF NOT EXISTS idx_compras_num_doc ON compras_materia_prima(num_doc);

-- Tabla: LOTES_MATERIA_PRIMA
-- Lotes individuales de materias primas con control de stock
CREATE TABLE IF NOT EXISTS lotes_materia_prima (
    id BIGSERIAL PRIMARY KEY,
    materia_prima_id BIGINT NOT NULL,
    compra_id BIGINT,
    cantidad DOUBLE PRECISION NOT NULL,
    stock_actual DOUBLE PRECISION NOT NULL,
    costo_unitario DOUBLE PRECISION NOT NULL,
    numero_lote VARCHAR(50),
    fecha_compra DATE NOT NULL,
    fecha_vencimiento DATE,
    CONSTRAINT fk_lote_materia_prima FOREIGN KEY (materia_prima_id) 
        REFERENCES materias_primas(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lote_compra FOREIGN KEY (compra_id) 
        REFERENCES compras_materia_prima(id) ON DELETE SET NULL,
    CONSTRAINT chk_stock_positivo CHECK (stock_actual >= 0),
    CONSTRAINT chk_cantidad_positiva CHECK (cantidad > 0)
);

-- Índices para optimizar consultas de lotes
CREATE INDEX IF NOT EXISTS idx_lote_materia_prima_id ON lotes_materia_prima(materia_prima_id);
CREATE INDEX IF NOT EXISTS idx_lote_compra_id ON lotes_materia_prima(compra_id);
CREATE INDEX IF NOT EXISTS idx_lote_fecha_vencimiento ON lotes_materia_prima(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_lote_stock_disponible ON lotes_materia_prima(stock_actual) WHERE stock_actual > 0;

-- ===============================================
-- MÓDULO: INVENTARIO - PRODUCTOS Y RECETAS
-- ===============================================

-- Tabla: RECETAS_MAESTRAS
-- Recetas base para producción
CREATE TABLE IF NOT EXISTS recetas_maestras (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    unidad_base VARCHAR(50),
    cantidad_base DOUBLE PRECISION,
    precio_estimado DOUBLE PRECISION,
    precio_unidad DOUBLE PRECISION,
    tiempo_preparacion INTEGER, -- en minutos
    fecha_creacion DATE,
    activa BOOLEAN DEFAULT TRUE
);

-- Índices para recetas
CREATE INDEX IF NOT EXISTS idx_recetas_nombre ON recetas_maestras(nombre);
CREATE INDEX IF NOT EXISTS idx_recetas_activa ON recetas_maestras(activa);

-- Tabla: RECETA_INGREDIENTES
-- Ingredientes necesarios para cada receta
CREATE TABLE IF NOT EXISTS receta_ingredientes (
    id BIGSERIAL PRIMARY KEY,
    receta_maestra_id BIGINT NOT NULL,
    materia_prima_id BIGINT,
    materia_prima_nombre VARCHAR(255),
    cantidad_necesaria DOUBLE PRECISION NOT NULL,
    unidad VARCHAR(50),
    es_opcional BOOLEAN DEFAULT FALSE,
    notas TEXT,
    CONSTRAINT fk_ingrediente_receta FOREIGN KEY (receta_maestra_id) 
        REFERENCES recetas_maestras(id) ON DELETE CASCADE,
    CONSTRAINT fk_ingrediente_materia_prima FOREIGN KEY (materia_prima_id) 
        REFERENCES materias_primas(id) ON DELETE SET NULL
);

-- Índices para ingredientes
CREATE INDEX IF NOT EXISTS idx_ingrediente_receta_id ON receta_ingredientes(receta_maestra_id);
CREATE INDEX IF NOT EXISTS idx_ingrediente_materia_prima_id ON receta_ingredientes(materia_prima_id);

-- Tabla: PRODUCTOS
-- Catálogo de productos terminados
CREATE TABLE IF NOT EXISTS productos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    precio_venta DOUBLE PRECISION,
    tipo_producto VARCHAR(20) CHECK (tipo_producto IN ('CORRIENTE', 'ESPECIAL', 'NO_APLICA')),
    categoria VARCHAR(100),
    estado VARCHAR(50),
    receta_maestra_id BIGINT,
    CONSTRAINT fk_producto_receta FOREIGN KEY (receta_maestra_id) 
        REFERENCES recetas_maestras(id) ON DELETE SET NULL
);

-- Índices para productos
CREATE INDEX IF NOT EXISTS idx_producto_nombre ON productos(nombre);
CREATE INDEX IF NOT EXISTS idx_producto_tipo ON productos(tipo_producto);
CREATE INDEX IF NOT EXISTS idx_producto_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_producto_receta_id ON productos(receta_maestra_id);

-- Tabla: LOTES_PRODUCTO
-- Lotes de productos terminados con costos de producción
CREATE TABLE IF NOT EXISTS lotes_producto (
    id BIGSERIAL PRIMARY KEY,
    producto_id BIGINT NOT NULL,
    cantidad_producida INTEGER NOT NULL,
    stock_actual INTEGER NOT NULL,
    costo_produccion_total DOUBLE PRECISION NOT NULL,
    costo_unitario DOUBLE PRECISION NOT NULL,
    fecha_produccion DATE NOT NULL,
    fecha_vencimiento DATE,
    estado VARCHAR(50),
    CONSTRAINT fk_lote_producto FOREIGN KEY (producto_id) 
        REFERENCES productos(id) ON DELETE RESTRICT,
    CONSTRAINT chk_lote_stock_positivo CHECK (stock_actual >= 0),
    CONSTRAINT chk_lote_cantidad_positiva CHECK (cantidad_producida > 0)
);

-- Índices para lotes de producto
CREATE INDEX IF NOT EXISTS idx_lote_producto_id ON lotes_producto(producto_id);
CREATE INDEX IF NOT EXISTS idx_lote_producto_fecha ON lotes_producto(fecha_produccion);
CREATE INDEX IF NOT EXISTS idx_lote_producto_vencimiento ON lotes_producto(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_lote_producto_stock ON lotes_producto(stock_actual) WHERE stock_actual > 0;

-- Tabla: INSUMOS_PRODUCCION
-- Registro de consumo de materias primas en producción
CREATE TABLE IF NOT EXISTS insumos_produccion (
    id BIGSERIAL PRIMARY KEY,
    materia_prima_id BIGINT,
    cantidad_usada DOUBLE PRECISION NOT NULL,
    fecha DATE NOT NULL,
    CONSTRAINT fk_insumo_materia_prima FOREIGN KEY (materia_prima_id) 
        REFERENCES materias_primas(id) ON DELETE SET NULL
);

-- Índices para insumos de producción
CREATE INDEX IF NOT EXISTS idx_insumo_materia_prima_id ON insumos_produccion(materia_prima_id);
CREATE INDEX IF NOT EXISTS idx_insumo_fecha ON insumos_produccion(fecha);

-- ===============================================
-- MÓDULO: ENTREGAS Y RUTAS
-- ===============================================

-- Tabla: RUTA
-- Rutas de entrega asignadas a repartidores
CREATE TABLE IF NOT EXISTS ruta (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255),
    latitud DOUBLE PRECISION, -- Coordenada de origen (panadería)
    longitud DOUBLE PRECISION, -- Coordenada de origen (panadería)
    id_driver BIGINT,
    CONSTRAINT fk_ruta_driver FOREIGN KEY (id_driver) 
        REFERENCES usuario(id) ON DELETE SET NULL
);

-- Índices para rutas
CREATE INDEX IF NOT EXISTS idx_ruta_driver ON ruta(id_driver);

-- Tabla: RUTA_CLIENTE
-- Relación entre rutas y clientes
CREATE TABLE IF NOT EXISTS ruta_cliente (
    id BIGSERIAL PRIMARY KEY,
    id_ruta BIGINT NOT NULL,
    id_cliente BIGINT NOT NULL,
    orden INTEGER,
    estado VARCHAR(50),
    fecha_programada DATE,
    kg_corriente_programado DOUBLE PRECISION,
    kg_especial_programado DOUBLE PRECISION,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ruta_cliente_ruta FOREIGN KEY (id_ruta) 
        REFERENCES ruta(id) ON DELETE CASCADE,
    CONSTRAINT fk_ruta_cliente_cliente FOREIGN KEY (id_cliente) 
        REFERENCES cliente(id) ON DELETE CASCADE
);

-- Índices para ruta_cliente
CREATE INDEX IF NOT EXISTS idx_ruta_cliente_ruta ON ruta_cliente(id_ruta);
CREATE INDEX IF NOT EXISTS idx_ruta_cliente_cliente ON ruta_cliente(id_cliente);
CREATE INDEX IF NOT EXISTS idx_ruta_cliente_fecha ON ruta_cliente(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_ruta_cliente_estado ON ruta_cliente(estado);

-- Tabla: PROGRAMACION_ENTREGA
-- Programación detallada de entregas
CREATE TABLE IF NOT EXISTS programacion_entrega (
    id BIGSERIAL PRIMARY KEY,
    id_ruta BIGINT,
    id_cliente BIGINT,
    id_lote BIGINT,
    fecha_programada DATE,
    nombre_producto VARCHAR(255),
    cantidad_producto INTEGER,
    kg_corriente_programado DOUBLE PRECISION,
    kg_especial_programado DOUBLE PRECISION,
    orden INTEGER,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prog_ruta FOREIGN KEY (id_ruta) 
        REFERENCES ruta(id) ON DELETE CASCADE,
    CONSTRAINT fk_prog_cliente FOREIGN KEY (id_cliente) 
        REFERENCES cliente(id) ON DELETE CASCADE,
    CONSTRAINT fk_prog_lote FOREIGN KEY (id_lote) 
        REFERENCES lotes_producto(id) ON DELETE SET NULL
);

-- Índices para programación de entregas
CREATE INDEX IF NOT EXISTS idx_prog_ruta ON programacion_entrega(id_ruta);
CREATE INDEX IF NOT EXISTS idx_prog_cliente ON programacion_entrega(id_cliente);
CREATE INDEX IF NOT EXISTS idx_prog_fecha ON programacion_entrega(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_prog_estado ON programacion_entrega(estado);

-- Tabla: SESION_REPARTO
-- Sesiones de reparto diarias por repartidor
CREATE TABLE IF NOT EXISTS sesion_reparto (
    id BIGSERIAL PRIMARY KEY,
    id_driver BIGINT,
    fecha DATE NOT NULL,
    kg_corriente DOUBLE PRECISION,
    kg_especial DOUBLE PRECISION,
    corriente_devuelto DOUBLE PRECISION,
    especial_devuelto DOUBLE PRECISION,
    hora_retorno TIMESTAMP,
    CONSTRAINT fk_sesion_driver FOREIGN KEY (id_driver) 
        REFERENCES usuario(id) ON DELETE SET NULL
);

-- Índices para sesiones de reparto
CREATE INDEX IF NOT EXISTS idx_sesion_driver ON sesion_reparto(id_driver);
CREATE INDEX IF NOT EXISTS idx_sesion_fecha ON sesion_reparto(fecha);

-- Tabla: REGISTRO_ENTREGA
-- Registro de entregas realizadas
CREATE TABLE IF NOT EXISTS registro_entrega (
    id BIGSERIAL PRIMARY KEY,
    id_pedido BIGINT,
    id_cliente BIGINT,
    hora_entregada TIMESTAMP,
    corriente_entregado DOUBLE PRECISION,
    especial_entregado DOUBLE PRECISION,
    monto_corriente DOUBLE PRECISION,
    monto_especial DOUBLE PRECISION,
    monto_total DOUBLE PRECISION,
    comentario TEXT,
    CONSTRAINT fk_registro_cliente FOREIGN KEY (id_cliente) 
        REFERENCES cliente(id) ON DELETE SET NULL
);

-- Índices para registro de entregas
CREATE INDEX IF NOT EXISTS idx_registro_pedido ON registro_entrega(id_pedido);
CREATE INDEX IF NOT EXISTS idx_registro_cliente ON registro_entrega(id_cliente);
CREATE INDEX IF NOT EXISTS idx_registro_fecha ON registro_entrega(hora_entregada);

-- Tabla: RESUMEN_ENTREGA
-- Resumen financiero de entregas
CREATE TABLE IF NOT EXISTS resumen_entrega (
    id BIGSERIAL PRIMARY KEY,
    total_corriente_vendido DOUBLE PRECISION,
    total_especial_vendido DOUBLE PRECISION,
    total_monto DOUBLE PRECISION,
    diferencia_esperado DOUBLE PRECISION
);

-- ===============================================
-- DATOS INICIALES (SEED DATA)
-- ===============================================

-- Insertar roles por defecto
INSERT INTO rol (rol) VALUES 
    ('ADMIN'),
    ('DRIVER'),
    ('PRODUCTION'),
    ('SALES')
ON CONFLICT (rol) DO NOTHING;

-- Insertar usuario administrador por defecto
-- Contraseña: admin123 (debe ser hasheada en producción)
INSERT INTO usuario (nombre, email, password, rol_id) VALUES 
    ('Administrador', 'admin@fluxora.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IZ1NLmqvUlG02tVzGJz9qG7TtWmKVq', 
     (SELECT id FROM rol WHERE rol = 'ADMIN'))
ON CONFLICT (email) DO NOTHING;

-- ===============================================
-- VISTAS ÚTILES PARA REPORTES
-- ===============================================

-- Vista: Stock actual de materias primas
CREATE OR REPLACE VIEW v_stock_materias_primas AS
SELECT 
    mp.id,
    mp.nombre,
    mp.unidad,
    COALESCE(SUM(lmp.stock_actual), 0) as stock_total,
    COUNT(lmp.id) as total_lotes,
    MIN(lmp.fecha_vencimiento) as proxima_vencimiento
FROM materias_primas mp
LEFT JOIN lotes_materia_prima lmp ON mp.id = lmp.materia_prima_id 
    AND lmp.stock_actual > 0
GROUP BY mp.id, mp.nombre, mp.unidad;

-- Vista: Stock actual de productos
CREATE OR REPLACE VIEW v_stock_productos AS
SELECT 
    p.id,
    p.nombre,
    p.tipo_producto,
    p.categoria,
    COALESCE(SUM(lp.stock_actual), 0) as stock_total,
    COUNT(lp.id) as total_lotes,
    MIN(lp.fecha_vencimiento) as proxima_vencimiento,
    p.precio_venta
FROM productos p
LEFT JOIN lotes_producto lp ON p.id = lp.producto_id 
    AND lp.stock_actual > 0
GROUP BY p.id, p.nombre, p.tipo_producto, p.categoria, p.precio_venta;

-- Vista: Clientes con rutas asignadas
CREATE OR REPLACE VIEW v_clientes_rutas AS
SELECT 
    c.id as cliente_id,
    c.nombre_negocio,
    c.nombre,
    c.direccion,
    r.id as ruta_id,
    r.nombre as ruta_nombre,
    u.nombre as driver_nombre,
    rc.estado,
    rc.fecha_programada
FROM cliente c
LEFT JOIN ruta_cliente rc ON c.id = rc.id_cliente
LEFT JOIN ruta r ON rc.id_ruta = r.id
LEFT JOIN usuario u ON r.id_driver = u.id;

-- ===============================================
-- FUNCIONES ÚTILES
-- ===============================================

-- Función: Obtener costo promedio ponderado (PPP) de materia prima
CREATE OR REPLACE FUNCTION fn_calcular_ppp_materia_prima(p_materia_prima_id BIGINT)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    v_ppp DOUBLE PRECISION;
BEGIN
    SELECT 
        CASE 
            WHEN SUM(stock_actual) = 0 THEN 0
            ELSE SUM(stock_actual * costo_unitario) / SUM(stock_actual)
        END INTO v_ppp
    FROM lotes_materia_prima
    WHERE materia_prima_id = p_materia_prima_id 
        AND stock_actual > 0;
    
    RETURN COALESCE(v_ppp, 0);
END;
$$ LANGUAGE plpgsql;

-- Función: Verificar stock disponible de materia prima
CREATE OR REPLACE FUNCTION fn_verificar_stock_materia_prima(
    p_materia_prima_id BIGINT,
    p_cantidad_requerida DOUBLE PRECISION
)
RETURNS BOOLEAN AS $$
DECLARE
    v_stock_total DOUBLE PRECISION;
BEGIN
    SELECT COALESCE(SUM(stock_actual), 0) INTO v_stock_total
    FROM lotes_materia_prima
    WHERE materia_prima_id = p_materia_prima_id 
        AND stock_actual > 0;
    
    RETURN v_stock_total >= p_cantidad_requerida;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- TRIGGERS PARA MANTENER INTEGRIDAD
-- ===============================================

-- Trigger: Actualizar fecha_actualizacion en ruta_cliente
CREATE OR REPLACE FUNCTION fn_actualizar_fecha_ruta_cliente()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_ruta_cliente_update
    BEFORE UPDATE ON ruta_cliente
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_fecha_ruta_cliente();

-- Trigger: Actualizar fecha_actualizacion en programacion_entrega
CREATE OR REPLACE FUNCTION fn_actualizar_fecha_programacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_programacion_update
    BEFORE UPDATE ON programacion_entrega
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_fecha_programacion();

-- ===============================================
-- COMENTARIOS EN TABLAS PARA DOCUMENTACIÓN
-- ===============================================

COMMENT ON TABLE rol IS 'Catálogo de roles del sistema (ADMIN, DRIVER, etc.)';
COMMENT ON TABLE usuario IS 'Usuarios del sistema con autenticación';
COMMENT ON TABLE cliente IS 'Clientes y negocios que compran productos';
COMMENT ON TABLE materias_primas IS 'Catálogo de materias primas para producción';
COMMENT ON TABLE compras_materia_prima IS 'Registro de compras realizadas a proveedores';
COMMENT ON TABLE lotes_materia_prima IS 'Lotes individuales de materias primas con control FIFO/PPP';
COMMENT ON TABLE recetas_maestras IS 'Recetas base para producción de productos';
COMMENT ON TABLE receta_ingredientes IS 'Ingredientes necesarios para cada receta';
COMMENT ON TABLE productos IS 'Catálogo de productos terminados';
COMMENT ON TABLE lotes_producto IS 'Lotes de productos terminados con costos de producción';
COMMENT ON TABLE insumos_produccion IS 'Registro histórico de consumo de materias primas';
COMMENT ON TABLE ruta IS 'Rutas de entrega asignadas a repartidores';
COMMENT ON TABLE ruta_cliente IS 'Relación entre rutas y clientes a visitar';
COMMENT ON TABLE programacion_entrega IS 'Programación detallada de entregas por fecha';
COMMENT ON TABLE sesion_reparto IS 'Sesiones diarias de reparto con inventario cargado';
COMMENT ON TABLE registro_entrega IS 'Registro de entregas efectivamente realizadas';
COMMENT ON TABLE resumen_entrega IS 'Resumen financiero de entregas';

-- ===============================================
-- FIN DEL SCRIPT
-- ===============================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ===============================================
-- NOTAS IMPORTANTES
-- ===============================================
-- 1. Este script es compatible con PostgreSQL 12+
-- 2. Las contraseñas deben ser hasheadas con BCrypt en la aplicación
-- 3. Se recomienda configurar backups automáticos en Supabase
-- 4. Los índices están optimizados para las consultas más comunes
-- 5. Las constraints garantizan la integridad referencial
-- 6. Las vistas facilitan consultas complejas frecuentes
-- ===============================================
