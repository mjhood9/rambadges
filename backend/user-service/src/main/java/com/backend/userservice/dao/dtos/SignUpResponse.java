package com.backend.userservice.dao.dtos;

public class SignUpResponse {
    private String message;
    private String username;
    private String fullName;
    private String email;

    public String getMessage() { return message; }
    public String getUsername() { return username; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public void setMessage(String message) { this.message = message; }
    public void setUsername(String username) { this.username = username; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setEmail(String email) { this.email = email; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String message;
        private String username;
        private String fullName;
        private String email;

        public Builder message(String message) { this.message = message; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder email(String email) { this.email = email; return this; }

        public SignUpResponse build() {
            SignUpResponse r = new SignUpResponse();
            r.message = this.message;
            r.username = this.username;
            r.fullName = this.fullName;
            r.email = this.email;
            return r;
        }
    }
}