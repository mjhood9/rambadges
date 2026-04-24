package com.backend.laissezpasserservice.dao.repositories;

import com.backend.laissezpasserservice.dao.entities.LaissezPasser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LaissezPasserRepository extends JpaRepository<LaissezPasser, Long> {
    Optional<LaissezPasser> findByDemandeId(Long demandeId);
}
