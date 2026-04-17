package com.backend.demandeservice.dao.repositories;

import com.backend.demandeservice.dao.entities.Commentaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentaireRepository extends JpaRepository<Commentaire, Long> {
    List<Commentaire> findByDemandeId(Long demandeId);
}
