package com.backend.userservice.dao.dtos;

import com.backend.userservice.dao.enums.RoleEnum;

import java.util.Set;

public class SignUpRequest {
    private String username;
    private String password;
    private Set<RoleEnum> roles;

    public String getUsername() { return username; }
    public String getPassword() { return password; }
    public Set<RoleEnum> getRoles() { return roles; }
    public void setUsername(String username) { this.username = username; }
    public void setPassword(String password) { this.password = password; }
    public void setRoles(Set<RoleEnum> roles) { this.roles = roles; }
}