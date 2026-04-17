package com.backend.demandeservice.dao.repositories;

import com.backend.demandeservice.dao.entities.Demande;
import com.backend.demandeservice.dao.enums.DemandeStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DemandeRepository extends JpaRepository<Demande, Long> {
    List<Demande> findByUserId(Long userId);
}