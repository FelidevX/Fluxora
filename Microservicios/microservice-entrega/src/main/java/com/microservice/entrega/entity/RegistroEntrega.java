package com.microservice.entrega.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistroEntrega {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TipoMovimiento tipo;
    
    private Long id_pedido;
    private Long id_cliente;
    private LocalDateTime hora_entregada;
    private Double corriente_entregado;
    private Double especial_entregado;
    private Double monto_corriente;      // Nuevo: monto por kg corriente
    private Double monto_especial;       // Nuevo: monto por kg especial
    private Double monto_total;          // Nuevo: monto total de la entrega
    private String comentario;
}
