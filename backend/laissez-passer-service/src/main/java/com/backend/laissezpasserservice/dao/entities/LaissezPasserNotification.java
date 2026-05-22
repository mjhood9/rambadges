package com.backend.laissezpasserservice.dao.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class LaissezPasserNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long laissezPasserId;

    private String type;
    // EXPIRING_30_DAYS or EXPIRED

    private LocalDateTime sentAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getLaissezPasserId() {
        return laissezPasserId;
    }

    public void setLaissezPasserId(Long laissezPasserId) {
        this.laissezPasserId = laissezPasserId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    // getters/setters
}