package com.backend.userservice.web.controllers;

import com.backend.userservice.dao.dtos.EntiteRequest;
import com.backend.userservice.dao.entities.Entite;
import com.backend.userservice.services.EntiteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entites")
public class EntiteController {

    private final EntiteService entiteService;

    public EntiteController(EntiteService entiteService) {
        this.entiteService = entiteService;
    }

    @GetMapping
    public ResponseEntity<List<Entite>> getAllEntites() {
        return ResponseEntity.ok(entiteService.getAllEntites());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Entite> getEntiteById(@PathVariable Long id) {
        return ResponseEntity.ok(entiteService.getEntiteById(id));
    }

    @PostMapping
    public ResponseEntity<Entite> createEntite(@RequestBody EntiteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(entiteService.createEntite(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Entite> updateEntite(@PathVariable Long id, @RequestBody EntiteRequest request) {
        return ResponseEntity.ok(entiteService.updateEntite(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntite(@PathVariable Long id) {
        entiteService.deleteEntite(id);
        return ResponseEntity.noContent().build();
    }
}
