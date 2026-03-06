package com.backend.userservice.dao.dtos;


import java.util.Set;

public class AuthResponse {
    private String token;
    private String username;
    private Set<String> roles;

    public String getToken() { return token; }
    public String getUsername() { return username; }
    public Set<String> getRoles() { return roles; }
    public void setToken(String token) { this.token = token; }
    public void setUsername(String username) { this.username = username; }
    public void setRoles(Set<String> roles) { this.roles = roles; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String token;
        private String username;
        private Set<String> roles;

        public Builder token(String token) { this.token = token; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder roles(Set<String> roles) { this.roles = roles; return this; }

        public AuthResponse build() {
            AuthResponse r = new AuthResponse();
            r.token = this.token;
            r.username = this.username;
            r.roles = this.roles;
            return r;
        }
    }
}