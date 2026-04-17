package com.backend.demandeservice.services;

import com.backend.demandeservice.dao.dtos.CommentaireRequest;
import com.backend.demandeservice.dao.entities.Commentaire;
import com.backend.demandeservice.dao.repositories.CommentaireRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CommentaireService {

    @Autowired
    private CommentaireRepository commentaireRepository;

    public Commentaire addComment(CommentaireRequest request) {

        Commentaire c = new Commentaire();
        c.setContent(request.getContent());
        c.setUserId(request.getUserId());
        c.setDemandeId(request.getDemandeId());

        return commentaireRepository.save(c);
    }

    public List<Commentaire> getByDemande(Long demandeId) {
        return commentaireRepository.findByDemandeId(demandeId);
    }

    public void deleteComment(Long id) {
        commentaireRepository.deleteById(id);
    }
}
