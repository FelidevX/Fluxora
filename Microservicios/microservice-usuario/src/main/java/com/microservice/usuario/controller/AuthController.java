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
    public ResponseEntity<LoginResponse> login(@Validated @RequestBody LoginRequest body) {
        return ResponseEntity.ok(authService.login(body));
    }
}