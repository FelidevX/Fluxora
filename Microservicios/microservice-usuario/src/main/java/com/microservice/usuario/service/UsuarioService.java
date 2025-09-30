package com.microservice.usuario.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;

import com.microservice.usuario.dto.CreateUsuarioRequest;
import com.microservice.usuario.dto.UpdateUsuarioRequest;
import com.microservice.usuario.entity.Rol;
import com.microservice.usuario.entity.Usuario;
import com.microservice.usuario.repository.RolRepository;
import com.microservice.usuario.repository.UsuarioRepository;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<Usuario> getAllUsuarios() {
        return usuarioRepository.findAll();
    }

    public Usuario createUsuario(CreateUsuarioRequest req) {
        if (usuarioRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email ya registrado");
        }
        Rol rol = rolRepository.findById(req.getRolId())
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado"));

        Usuario u = new Usuario();
        u.setNombre(req.getNombre());
        u.setEmail(req.getEmail());
        u.setPassword(passwordEncoder.encode(req.getPassword()));
        u.setRol(rol);
        return usuarioRepository.save(u);
    }

    public Usuario deleteUsuario(Long id){
        Usuario u = usuarioRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        usuarioRepository.delete(u);
        return u;
    }

    public Usuario updateUsuario(Long id, UpdateUsuarioRequest req) { // Actualizar usuario
        Usuario u = usuarioRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (req.getNombre() != null && !req.getNombre().isEmpty()) {
            u.setNombre(req.getNombre());
        }
        if (req.getEmail() != null && !req.getEmail().isEmpty()) {
            // validar que el nuevo email no esté en uso por otro usuario
            if (!u.getEmail().equals(req.getEmail()) && usuarioRepository.existsByEmail(req.getEmail())) {
                throw new IllegalArgumentException("Email ya registrado");
            }
            u.setEmail(req.getEmail());
        }
        if (req.getPassword() != null && !req.getPassword().isEmpty()) {
            u.setPassword(passwordEncoder.encode(req.getPassword()));
        }
        if (req.getRolId() != null) {
            Rol rol = rolRepository.findById(req.getRolId())
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado"));
            u.setRol(rol);
        }
        return usuarioRepository.save(u);
    }
        
    public List<Usuario> getUsuariosByRol(String rol) {
        return usuarioRepository.findByRolRol(rol);
    }

    public Usuario getUsuarioById(Long id) {
        return usuarioRepository.findById(id).orElse(null);
    }

}
