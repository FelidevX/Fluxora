package com.microservice.entrega.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.microservice.entrega.config.FeignClientInterceptor;

import java.util.Map;

@FeignClient(name = "microservice-inventario", configuration = FeignClientInterceptor.class)
public interface InventarioServiceClient {

    @PutMapping("api/inventario/productos/{productoId}/lotes/{loteId}")
    ResponseEntity<?> actualizarStockLote(
        @PathVariable("productoId") Long productoId,
        @PathVariable("loteId") Long loteId,
        @RequestBody Map<String, Object> datos
    );

    @PutMapping("api/inventario/productos/{productoId}/descontar-stock")
    ResponseEntity<?> descontarInventario(
        @PathVariable("productoId") Long productoId,
        @RequestBody Map<String, Object> datos
    );

    @GetMapping("api/inventario/productos/lotes/{loteId}")
    ResponseEntity<?> getLoteById(@PathVariable("loteId") Long loteId);

    @GetMapping("api/inventario/productos/{id}")
    ResponseEntity<?> getProductoById(@PathVariable("id") Long id);

    @GetMapping("api/inventario/productos")
    ResponseEntity<?> getProductos();

    @GetMapping("api/inventario/productos/{nombre}")
    ResponseEntity<?> getProductoByNombre(@PathVariable("nombre") String nombre);

    @GetMapping("api/inventario/productos/{productoId}/stock-total")
    ResponseEntity<Integer> getStockTotalProducto(@PathVariable("productoId") Long productoId);
}