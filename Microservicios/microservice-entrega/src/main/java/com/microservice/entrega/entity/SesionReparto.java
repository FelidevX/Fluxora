package com.microservice.entrega.entity;

import java.time.LocalDate;
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
public class SesionReparto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long id_driver;

    private LocalDate fecha;

    private Double kg_corriente;
    private Double kg_especial;
    private Double corriente_devuelto;
    private Double especial_devuelto;
    private LocalDateTime hora_retorno;
    
    private Double monto_total;
    private Boolean pagado = false;
    private LocalDateTime fecha_pago;
}
