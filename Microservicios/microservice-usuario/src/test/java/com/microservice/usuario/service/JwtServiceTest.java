package com.microservice.usuario.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.Date;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

class JwtServiceTest {

    private JwtService jwtService;
    private String jwtSecret = "dGVzdFNlY3JldEtleUZvckpXVFRva2VuR2VuZXJhdGlvbkFuZFZhbGlkYXRpb25UZXN0cw=="; // Base64 encoded
    private long expirationMinutes = 60;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", jwtSecret);
        ReflectionTestUtils.setField(jwtService, "expirationMinutes", expirationMinutes);
    }

    @Test
    void generateToken_DeberiaGenerarTokenValido() {
        // Arrange
        Long userId = 1L;
        String email = "juan@example.com";
        String role = "ADMIN";

        // Act
        String token = jwtService.generateToken(userId, email, role);

        // Assert
        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3); // JWT tiene 3 partes: header.payload.signature
    }

    @Test
    void generateToken_DeberiaIncluirClaimsCorrectos() {
        // Arrange
        Long userId = 5L;
        String email = "maria@example.com";
        String role = "USER";

        // Act
        String token = jwtService.generateToken(userId, email, role);
        Claims claims = jwtService.parse(token);

        // Assert
        assertThat(claims.getSubject()).isEqualTo("5");
        assertThat(claims.get("email", String.class)).isEqualTo("maria@example.com");
        assertThat(claims.get("role", String.class)).isEqualTo("USER");
    }

    @Test
    void generateToken_DeberiaIncluirFechaEmision() {
        // Arrange
        Long userId = 1L;
        String email = "test@example.com";
        String role = "ADMIN";
        Instant before = Instant.now();

        // Act
        String token = jwtService.generateToken(userId, email, role);
        Claims claims = jwtService.parse(token);
        Instant after = Instant.now();

        // Assert
        assertThat(claims.getIssuedAt()).isNotNull();
        Date issuedAt = claims.getIssuedAt();
        assertThat(issuedAt.toInstant()).isBetween(before.minusSeconds(5), after.plusSeconds(5));
    }

    @Test
    void generateToken_DeberiaIncluirFechaExpiracion() {
        // Arrange
        Long userId = 1L;
        String email = "test@example.com";
        String role = "ADMIN";

        // Act
        String token = jwtService.generateToken(userId, email, role);
        Claims claims = jwtService.parse(token);

        // Assert
        assertThat(claims.getExpiration()).isNotNull();
        
        // Verificar que la expiración sea aproximadamente 60 minutos después de la emisión
        long timeDiffMinutes = (claims.getExpiration().getTime() - claims.getIssuedAt().getTime()) / (1000 * 60);
        assertThat(timeDiffMinutes).isEqualTo(60L);
    }

    @Test
    void parse_DeberiaParsearTokenCorrectamente() {
        // Arrange
        String token = jwtService.generateToken(10L, "pedro@example.com", "DRIVER");

        // Act
        Claims claims = jwtService.parse(token);

        // Assert
        assertThat(claims).isNotNull();
        assertThat(claims.getSubject()).isEqualTo("10");
        assertThat(claims.get("email", String.class)).isEqualTo("pedro@example.com");
        assertThat(claims.get("role", String.class)).isEqualTo("DRIVER");
    }

    @Test
    void parse_DeberiaLanzarExcepcionParaTokenInvalido() {
        // Arrange
        String tokenInvalido = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";

        // Act & Assert
        assertThatThrownBy(() -> jwtService.parse(tokenInvalido))
                .isInstanceOf(Exception.class); // Puede ser MalformedJwtException, SignatureException, etc.
    }

    @Test
    void parse_DeberiaLanzarExcepcionParaTokenExpirado() {
        // Arrange - Generar token que expire inmediatamente
        Instant now = Instant.now();
        String tokenExpirado = Jwts.builder()
                .setSubject("1")
                .setIssuedAt(Date.from(now.minusSeconds(3600)))
                .setExpiration(Date.from(now.minusSeconds(1800))) // Expiró hace 30 minutos
                .claim("email", "test@example.com")
                .claim("role", "ADMIN")
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret)))
                .compact();

        // Act & Assert
        assertThatThrownBy(() -> jwtService.parse(tokenExpirado))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    void generateToken_DeberiaGenerarTokensDiferentesParaDiferentesUsuarios() {
        // Arrange & Act
        String token1 = jwtService.generateToken(1L, "usuario1@example.com", "ADMIN");
        String token2 = jwtService.generateToken(2L, "usuario2@example.com", "USER");

        // Assert
        assertThat(token1).isNotEqualTo(token2);
        
        Claims claims1 = jwtService.parse(token1);
        Claims claims2 = jwtService.parse(token2);
        
        assertThat(claims1.getSubject()).isEqualTo("1");
        assertThat(claims2.getSubject()).isEqualTo("2");
        assertThat(claims1.get("email")).isNotEqualTo(claims2.get("email"));
        assertThat(claims1.get("role")).isNotEqualTo(claims2.get("role"));
    }

    @Test
    void parse_DeberiaManejarRolesEspeciales() {
        // Arrange
        String tokenAdmin = jwtService.generateToken(1L, "admin@example.com", "ADMIN");
        String tokenDriver = jwtService.generateToken(2L, "driver@example.com", "DRIVER");
        String tokenUser = jwtService.generateToken(3L, "user@example.com", "USER");

        // Act
        Claims claimsAdmin = jwtService.parse(tokenAdmin);
        Claims claimsDriver = jwtService.parse(tokenDriver);
        Claims claimsUser = jwtService.parse(tokenUser);

        // Assert
        assertThat(claimsAdmin.get("role", String.class)).isEqualTo("ADMIN");
        assertThat(claimsDriver.get("role", String.class)).isEqualTo("DRIVER");
        assertThat(claimsUser.get("role", String.class)).isEqualTo("USER");
    }
}
