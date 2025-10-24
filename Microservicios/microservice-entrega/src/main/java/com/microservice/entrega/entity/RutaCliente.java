package com.microservice.entrega.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

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
public class RutaCliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long id_ruta;
    private Long id_cliente;
    private Integer orden; // Revisar, ya que creo que OSRM lo hace automatico para obtener la mejor ruta
    
    // Anotación para setear automáticamente la fecha
    @CreationTimestamp
    private LocalDateTime fecha_actualizacion;
}
