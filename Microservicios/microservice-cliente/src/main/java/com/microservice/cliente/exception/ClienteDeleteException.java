package com.microservice.cliente.exception;

public class ClienteDeleteException extends RuntimeException {
    
    public ClienteDeleteException(Long id, Throwable cause) {
        super("Error al eliminar cliente con ID: " + id, cause);
    }
}
