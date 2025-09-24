package com.microservice.usuario.controller;

import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.microservice.usuario.entity.Rol;

import com.microservice.usuario.service.RolService;

import java.util.List;

import com.microservice.usuario.entity.Rol;

@RestController
@RequestMapping("/roles")
public class RolController {
    @Autowired
    private RolService rolService;

    @GetMapping()
    public List<Rol> getAllRoles() {
        return rolService.getAllRoles();
    }
}
