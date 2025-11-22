package com.microservice.exception;

public class RecursoNoEncontradoException extends RuntimeException {

    // Constructor para pasar solo el mensaje (Ej: "Lote con ID 5 no encontrado")
    public RecursoNoEncontradoException(String mensaje) {
        super(mensaje);
    }

    // Constructor para pasar mensaje y la causa original
    public RecursoNoEncontradoException(String mensaje, Throwable causa) {
        super(mensaje, causa);
    }
}