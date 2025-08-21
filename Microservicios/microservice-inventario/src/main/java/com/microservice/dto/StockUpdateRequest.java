package com.microservice.dto;

public class StockUpdateRequest {
    private int cantidad;

    public StockUpdateRequest() {}

    public StockUpdateRequest(int cantidad) {
        this.cantidad = cantidad;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }
}
