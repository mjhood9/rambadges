package com.backend.userservice.dao.repositories;

import com.backend.userservice.dao.entities.Entite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EntiteRepository extends JpaRepository<Entite, Long> {
    Optional<Entite> findByName(String name);
    boolean existsByName(String name);
}
