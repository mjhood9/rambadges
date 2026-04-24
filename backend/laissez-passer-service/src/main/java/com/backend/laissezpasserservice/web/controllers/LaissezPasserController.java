package com.backend.laissezpasserservice.web.controllers;

import com.backend.laissezpasserservice.dao.dtos.LaissezPasserRequestDTO;
import com.backend.laissezpasserservice.dao.dtos.LaissezPasserUpdateRequest;
import com.backend.laissezpasserservice.dao.entities.LaissezPasser;
import com.backend.laissezpasserservice.services.LaissezPasserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/laissezpasser")
public class LaissezPasserController {

    private final LaissezPasserService service;

    public LaissezPasserController(LaissezPasserService service) {
        this.service = service;
    }

    // =========================
    // CREATE
    // =========================
    @PostMapping
    public LaissezPasser create(@RequestBody LaissezPasserRequestDTO request) {
        return service.create(request);
    }

    // =========================
    // GET ALL
    // =========================
    @GetMapping
    public List<LaissezPasser> getAll() {
        return service.getAll();
    }

    // =========================
    // GET BY ID
    // =========================
    @GetMapping("/{id}")
    public LaissezPasser getById(@PathVariable Long id) {
        return service.getById(id);
    }

    // =========================
    // GET BY DEMANDE ID
    // =========================
    @GetMapping("/demande/{demandeId}")
    public LaissezPasser getByDemandeId(@PathVariable Long demandeId) {
        return service.getByDemandeId(demandeId);
    }

    // =========================
    // UPDATE STATUS ONLY
    // =========================
    @PutMapping("/{id}/status")
    public LaissezPasser updateStatus(
            @PathVariable Long id,
            @RequestParam String statut
    ) {
        return service.updateStatus(id, statut);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LaissezPasser> updateLaissezPasser(
            @PathVariable Long id,
            @RequestBody LaissezPasserUpdateRequest request
    ) {
        return ResponseEntity.ok(service.updateLaissezPasser(id, request));
    }

    // =========================
    // DELETE
    // =========================
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}