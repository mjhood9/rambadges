package com.backend.userservice.dao.repositories;

import com.backend.userservice.dao.entities.Role;
import com.backend.userservice.dao.enums.RoleEnum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleEnum name);
}
