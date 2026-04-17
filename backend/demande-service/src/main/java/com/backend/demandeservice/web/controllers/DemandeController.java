package com.backend.demandeservice.web.controllers;

import com.backend.demandeservice.dao.dtos.DemandeRequest;
import com.backend.demandeservice.dao.dtos.UpdateStatusRequest;
import com.backend.demandeservice.dao.entities.Demande;
import com.backend.demandeservice.dao.enums.DemandeStatus;
import com.backend.demandeservice.services.DemandeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/demandes")
public class DemandeController {

    private final DemandeService demandeService;

    public DemandeController(DemandeService demandeService) {
        this.demandeService = demandeService;
    }

    @PostMapping
    public ResponseEntity<Demande> createDemande(@RequestBody DemandeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(demandeService.createDemande(request));
    }

    @GetMapping
    public ResponseEntity<List<Demande>> getAllDemandes() {
        return ResponseEntity.ok(demandeService.getAllDemandes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Demande> getDemandeById(@PathVariable Long id) {
        return ResponseEntity.ok(demandeService.getDemandeById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Demande>> getDemandesByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(demandeService.getDemandesByUser(userId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Demande> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request
    ) {
        return ResponseEntity.ok(demandeService.updateStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDemande(@PathVariable Long id) {
        demandeService.deleteDemande(id);
        return ResponseEntity.noContent().build();
    }
}