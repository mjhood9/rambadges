package com.backend.userservice.dao.entities;

import jakarta.persistence.*;

import java.util.*;

@Entity
@Table(name = "users")
public class Users {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    // Getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getPassword() { return password; }
    public Set<Role> getRoles() { return roles; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setPassword(String password) { this.password = password; }
    public void setRoles(Set<Role> roles) { this.roles = roles; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String username;
        private String password;
        private Set<Role> roles = new HashSet<>();

        public Builder username(String username) { this.username = username; return this; }
        public Builder password(String password) { this.password = password; return this; }
        public Builder roles(Set<Role> roles) { this.roles = roles; return this; }

        public Users build() {
            Users user = new Users();
            user.username = this.username;
            user.password = this.password;
            user.roles = this.roles;
            return user;
        }
    }
}