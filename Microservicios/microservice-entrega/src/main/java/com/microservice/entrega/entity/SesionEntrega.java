package com.microservice.entrega.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SesionEntrega {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long id_producto;
    private LocalDateTime fecha;
    private Double kg_corriente;
    private Double kg_especial;
    private Double corrienteDevuelto;
    private Double especialDevuelto;
    private LocalDateTime hora_retorno;
}
