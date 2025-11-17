package com.microservice.usuario.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.microservice.usuario.dto.LoginRequest;
import com.microservice.usuario.dto.LoginResponse;
import com.microservice.usuario.repository.UsuarioRepository;
import com.microservice.usuario.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest req) {
        log.info("🔐 Intento de login para email: {}", req.getEmail());
        
        var user = usuarioRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> {
                    log.error("❌ Usuario no encontrado: {}", req.getEmail());
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas");
                });

        log.info("✅ Usuario encontrado: {} - Password en BD: {}", user.getEmail(), user.getPassword());
        log.info("🔑 Password ingresado: {}", req.getPassword());
        
        boolean matches = passwordEncoder.matches(req.getPassword(), user.getPassword());
        log.info("🔍 Password matches: {}", matches);
        
        if (!matches) {
            log.error("❌ Password incorrecto para usuario: {}", req.getEmail());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas");
        }

        log.info("✅ Login exitoso para: {}", user.getEmail());
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRol().getRol());
        return new LoginResponse(token, "Bearer");
    }
}