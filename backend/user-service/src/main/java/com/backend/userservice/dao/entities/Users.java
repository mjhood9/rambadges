package com.backend.userservice.dao.entities;

import jakarta.persistence.*;

import java.util.*;

@Entity
@Table(name = "users")
public class Users {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "entite_id")
    private Entite entite;

    public Long getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public Set<Role> getRoles() { return roles; }
    public Entite getEntite() { return entite; }

    public void setId(Long id) { this.id = id; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setRoles(Set<Role> roles) { this.roles = roles; }
    public void setEntite(Entite entite) { this.entite = entite; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String firstName;
        private String lastName;
        private String email;
        private String username;
        private String password;
        private Set<Role> roles = new HashSet<>();
        private Entite entite;

        public Builder firstName(String firstName) { this.firstName = firstName; return this; }
        public Builder lastName(String lastName) { this.lastName = lastName; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder password(String password) { this.password = password; return this; }
        public Builder roles(Set<Role> roles) { this.roles = roles; return this; }
        public Builder entite(Entite entite) { this.entite = entite; return this; }

        public Users build() {
            Users user = new Users();
            user.firstName = this.firstName;
            user.lastName = this.lastName;
            user.username = this.username;
            user.email = this.email;
            user.password = this.password;
            user.roles = this.roles;
            user.entite = this.entite;
            return user;
        }
    }
}