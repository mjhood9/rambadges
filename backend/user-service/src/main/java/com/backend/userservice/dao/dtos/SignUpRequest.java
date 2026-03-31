package com.backend.userservice.dao.dtos;

import com.backend.userservice.dao.enums.RoleEnum;

import java.util.Set;

public class SignUpRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private Set<RoleEnum> roles;
    private Long entiteId;

    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public Set<RoleEnum> getRoles() { return roles; }
    public Long getEntiteId() { return entiteId; }

    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setRoles(Set<RoleEnum> roles) { this.roles = roles; }
    public void setEntiteId(Long entiteId) { this.entiteId = entiteId; }

    public String getFullName() {
        return firstName + " " + lastName;
    }
}