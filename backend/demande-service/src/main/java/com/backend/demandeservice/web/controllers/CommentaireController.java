package com.backend.demandeservice.web.controllers;

import com.backend.demandeservice.dao.dtos.CommentaireRequest;
import com.backend.demandeservice.dao.entities.Commentaire;
import com.backend.demandeservice.services.CommentaireService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/commentaires")
public class CommentaireController {

    @Autowired
    private CommentaireService commentaireService;

    @PostMapping
    public Commentaire add(@RequestBody CommentaireRequest request) {
        return commentaireService.addComment(request);
    }

    @GetMapping("/demande/{demandeId}")
    public List<Commentaire> getByDemande(@PathVariable Long demandeId) {
        return commentaireService.getByDemande(demandeId);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        commentaireService.deleteComment(id);
    }
}
