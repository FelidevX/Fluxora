package com.microservice.inventario.microservice_inventario;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@ComponentScan(basePackages = "com.microservice")
@EntityScan(basePackages = "com.microservice.entity")
@EnableJpaRepositories(basePackages = "com.microservice.repository")
public class MicroserviceInventarioApplication {

	public static void main(String[] args) {
		SpringApplication.run(MicroserviceInventarioApplication.class, args);
	}

}
