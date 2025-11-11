package com.microservice.cliente;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import com.microservice.cliente.client.EntregaServiceClient;

@SpringBootTest
@ActiveProfiles("test")
class MicroserviceClienteApplicationTests {

	// Mock de Feign client para evitar dependencias externas
	@MockBean
	private EntregaServiceClient entregaServiceClient;

	@Test
	void contextLoads() {
		// Test de integración básico que verifica que el contexto de Spring se carga correctamente
	}

}
