package com.microservice.exception;
import lombok.Getter;

@Getter
public class BusinessRuleException extends RuntimeException {
    private final String codigoError;
    private final Object detalles;

    public BusinessRuleException(String codigoError, String mensaje) {
        super(mensaje);
        this.codigoError = codigoError;
        this.detalles = null;
    }

    public BusinessRuleException(String codigoError, String mensaje, Object detalles) {
        super(mensaje);
        this.codigoError = codigoError;
        this.detalles = detalles;
    }
}
