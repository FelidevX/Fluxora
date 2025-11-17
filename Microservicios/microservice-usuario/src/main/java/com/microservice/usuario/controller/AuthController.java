package com.microservice.usuario.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.microservice.usuario.dto.LoginRequest;
import com.microservice.usuario.dto.LoginResponse;
import com.microservice.usuario.service.AuthService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Validated @RequestBody LoginRequest body) {
        try {
            LoginResponse response = authService.login(body);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // TEMPORAL: Devolver error detallado para debug
            return ResponseEntity.status(401).body(
                java.util.Map.of(
                    "error", "Login failed",
                    "message", e.getMessage(),
                    "email", body.getEmail(),
                    "timestamp", java.time.Instant.now().toString()
                )
            );
        }
    }
}