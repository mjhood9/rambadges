package com.backend.userservice.dao.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "entities")
public class Entite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;


    public Long getId() { return id; }
    public String getName() { return name; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String name;

        public Builder name(String name) { this.name = name; return this; }

        public Entite build() {
            Entite e = new Entite();
            e.name = this.name;
            return e;
        }
    }
}
