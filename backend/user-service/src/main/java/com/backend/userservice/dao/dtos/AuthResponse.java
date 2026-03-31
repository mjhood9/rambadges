package com.backend.userservice.dao.dtos;


import java.util.Set;

public class AuthResponse {
    private String token;
    private String username;
    private String fullName;
    private String email;
    private Set<String> roles;

    public String getToken() { return token; }
    public String getUsername() { return username; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public Set<String> getRoles() { return roles; }

    public void setToken(String token) { this.token = token; }
    public void setUsername(String username) { this.username = username; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setEmail(String email) { this.email = email; }
    public void setRoles(Set<String> roles) { this.roles = roles; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String token;
        private String username;
        private String fullName;
        private String email;
        private Set<String> roles;

        public Builder token(String token) { this.token = token; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder roles(Set<String> roles) { this.roles = roles; return this; }

        public AuthResponse build() {
            AuthResponse r = new AuthResponse();
            r.token = this.token;
            r.username = this.username;
            r.fullName = this.fullName;
            r.email = this.email;
            r.roles = this.roles;
            return r;
        }
    }
}