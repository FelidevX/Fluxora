package com.microservice.exception;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Manejo de Reglas de Negocio
    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRule(BusinessRuleException ex) {
        ErrorResponse error = ErrorResponse.builder()
                .codigo(ex.getCodigoError()) // Ej: "STOCK_ERROR"
                .mensaje(ex.getMessage())
                .detalles(ex.getDetalles()) // Aquí viaja la lista al frontend
                .timestamp(LocalDateTime.now())
                .build();
        
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    // 2. Manejo de No Encontrado (404) - Reutilizable
    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(RecursoNoEncontradoException ex) {
        ErrorResponse error = ErrorResponse.builder()
                .codigo("NOT_FOUND")
                .mensaje(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    // 3. Manejo de errores inesperados (NullPointer, DB caída, etc)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        ErrorResponse error = ErrorResponse.builder()
                .codigo("INTERNAL_ERROR")
                .mensaje("Ocurrió un error inesperado. Contacte al administrador.")
                // IMPORTANTE: No enviar ex.getMessage() al frontend en producción por seguridad
                .timestamp(LocalDateTime.now())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
