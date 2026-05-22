package com.backend.laissezpasserservice.dao.repositories;

import com.backend.laissezpasserservice.dao.entities.LaissezPasserNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LaissezPasserNotificationRepository
        extends JpaRepository<LaissezPasserNotification, Long> {

    Optional<LaissezPasserNotification> findTopByLaissezPasserIdAndTypeOrderBySentAtDesc(
            Long laissezPasserId,
            String type
    );
}