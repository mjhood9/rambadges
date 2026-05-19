package com.backend.userservice.services;

import com.backend.userservice.dao.entities.Entite;
import com.backend.userservice.dao.entities.Role;
import com.backend.userservice.dao.entities.Users;
import com.backend.userservice.dao.repositories.EntiteRepository;
import com.backend.userservice.dao.repositories.RoleRepository;
import com.backend.userservice.dao.repositories.UserRepository;
import com.backend.userservice.exception.UserNotFoundException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpHeaders;
import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import org.keycloak.admin.client.Keycloak;
import org.springframework.beans.factory.annotation.Value;

import com.backend.userservice.dao.dtos.SignUpRequest;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final CircuitBreaker circuitBreaker;
    private final Retry retry;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntiteRepository entiteRepository;
    private final Keycloak keycloak;
    private final RestTemplate restTemplate;

    @Value("${keycloak.admin.url}")
    private String keycloakUrl;

    @Value("${keycloak.admin.username}")
    private String adminUsername;

    @Value("${keycloak.admin.password}")
    private String adminPassword;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.client-secret}")
    private String clientSecret;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       CircuitBreakerRegistry circuitBreakerRegistry,
                       RetryRegistry retryRegistry, EntiteRepository entiteRepository, Keycloak keycloak, RestTemplate restTemplate) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.circuitBreaker = circuitBreakerRegistry.circuitBreaker("user-service");
        this.retry = retryRegistry.retry("user-service");
        this.entiteRepository = entiteRepository;
        this.keycloak = keycloak;
        this.restTemplate = restTemplate;
    }

    public List<Users> getAllUsers() {
        Supplier<List<Users>> supplier = CircuitBreaker
                .decorateSupplier(circuitBreaker, () -> userRepository.findAll());

        Supplier<List<Users>> supplierWithRetry = Retry
                .decorateSupplier(retry, supplier);

        try {
            return supplierWithRetry.get();
        } catch (Exception e) {
            return fallbackGetAllUsers(e);
        }
    }

    private List<Users> fallbackGetAllUsers(Exception e) {
        log.error("GetAllUsers fallback triggered: {}", e.getMessage());
        return new ArrayList<>();
    }

    public Users getUserById(Long id) {
        Supplier<Users> supplier = CircuitBreaker
                .decorateSupplier(circuitBreaker, () -> userRepository.findById(id)
                        .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id)));

        Supplier<Users> supplierWithRetry = Retry
                .decorateSupplier(retry, supplier);

        try {
            return supplierWithRetry.get();
        } catch (UserNotFoundException e) {
            throw e;
        } catch (Exception e) {
            return fallbackGetUserById(id, e);
        }
    }

    private Users fallbackGetUserById(Long id, Exception e) {
        log.error("GetUserById fallback triggered for id {}: {}", id, e.getMessage());
        throw new RuntimeException("User service is currently unavailable.");
    }

    public List<Users> getUsersWithEntite() {
        try {
            return userRepository.findAll().stream()
                    .filter(user -> user.getEntite() != null) // only users with entity
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching users with entites: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public Users updateUser(Long id, SignUpRequest request) {

        Users user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        String keycloakId = user.getKeycloakId();
        if (keycloakId == null || keycloakId.isEmpty()) {
            throw new RuntimeException("Missing Keycloak ID for user");
        }

        // =========================
        // 1. UPDATE KEYCLOAK USER
        // =========================
        try {
            String adminToken = getAdminToken();

            String url = keycloakUrl + "/admin/realms/" + realm + "/users/" + keycloakId;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(adminToken);

            Map<String, Object> kcUser = new HashMap<>();
            kcUser.put("firstName", request.getFirstName());
            kcUser.put("lastName", request.getLastName());
            kcUser.put("email", request.getEmail());
            kcUser.put("username", request.getEmail());

            HttpEntity<Map<String, Object>> entity =
                    new HttpEntity<>(kcUser, headers);

            restTemplate.exchange(url, HttpMethod.PUT, entity, String.class);

        } catch (Exception e) {
            throw new RuntimeException("Keycloak update failed: " + e.getMessage());
        }

        // =========================
        // 2. UPDATE ROLES (DB + KEYCLOAK)
        // =========================
        Set<Role> roles = new HashSet<>();

        if (request.getRoles() != null && !request.getRoles().isEmpty()) {

            roles = request.getRoles().stream()
                    .map(r -> roleRepository.findByName(r)
                            .orElseThrow(() -> new RuntimeException("Role not found: " + r)))
                    .collect(Collectors.toSet());

            user.setRoles(roles);

            // 🔥 SYNC ROLES TO KEYCLOAK
            try {
                String adminToken = getAdminToken();

                List<String> roleNames = roles.stream()
                        .map(r -> r.getName().name())
                        .collect(Collectors.toList());

                assignRoles(keycloakId, roleNames, adminToken);

            } catch (Exception e) {
                log.error("Role sync failed: {}", e.getMessage());
            }
        }

        // =========================
        // 3. UPDATE ENTITE (IMPORTANT FIX)
        // =========================
        if (request.getEntiteId() != null) {
            Entite entite = entiteRepository.findById(request.getEntiteId())
                    .orElseThrow(() -> new RuntimeException("Entite not found"));
            user.setEntite(entite);
        } else {
            // 🔥 IMPORTANT: explicitly remove entite if not selected
            user.setEntite(null);
        }

        // =========================
        // 4. UPDATE DB FIELDS
        // =========================
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setUsername(request.getEmail());
        user.setEmail(request.getEmail());

        return userRepository.save(user);
    }

    private Users fallbackUpdateUser(Long id, Exception e) {
        log.error("UpdateUser fallback triggered for id {}: {}", id, e.getMessage());
        throw new RuntimeException("User update failed.");
    }

    private String getAdminToken() {
        String url = keycloakUrl + "/realms/master/protocol/openid-connect/token";

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", "admin-cli");
        body.add("username", adminUsername);
        body.add("password", adminPassword);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        return response.getBody().get("access_token").toString();
    }

    private void assignRoles(String userId, List<String> roleNames, String adminToken) {
        try {
            String rolesUrl = keycloakUrl + "/admin/realms/" + realm + "/roles";
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setBearerAuth(adminToken);
            HttpEntity<?> request = new HttpEntity<>(headers);

            ResponseEntity<List> rolesResponse = restTemplate.exchange(
                    rolesUrl, HttpMethod.GET, request, List.class
            );

            List<Map<String, Object>> allRoles = rolesResponse.getBody();
            List<Map<String, Object>> rolesToAssign = allRoles.stream()
                    .filter(r -> roleNames.contains(r.get("name").toString()))
                    .collect(Collectors.toList());

            if (rolesToAssign.isEmpty()) return;

            String assignUrl = keycloakUrl + "/admin/realms/" + realm + "/users/" + userId + "/role-mappings/realm";
            org.springframework.http.HttpHeaders assignHeaders = new org.springframework.http.HttpHeaders();
            assignHeaders.setContentType(MediaType.APPLICATION_JSON);
            assignHeaders.setBearerAuth(adminToken);

            HttpEntity<List<Map<String, Object>>> assignRequest = new HttpEntity<>(rolesToAssign, assignHeaders);
            restTemplate.postForEntity(assignUrl, assignRequest, String.class);

        } catch (Exception e) {
            log.error("Failed to assign roles: {}", e.getMessage());
        }
    }

    public void deleteUser(Long id) {

        Runnable runnable = CircuitBreaker.decorateRunnable(
                circuitBreaker,
                () -> {

                    Users user = userRepository.findById(id)
                            .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));

                    String keycloakId = user.getKeycloakId();

                    // =========================
                    // 1. DELETE FROM KEYCLOAK
                    // =========================
                    if (keycloakId != null && !keycloakId.isEmpty()) {
                        try {
                            String adminToken = getAdminToken();

                            String url = keycloakUrl
                                    + "/admin/realms/"
                                    + realm
                                    + "/users/"
                                    + keycloakId;

                            org.springframework.http.HttpHeaders headers =
                                    new org.springframework.http.HttpHeaders();

                            headers.setBearerAuth(adminToken);

                            HttpEntity<Void> entity = new HttpEntity<>(headers);

                            restTemplate.exchange(
                                    url,
                                    HttpMethod.DELETE,
                                    entity,
                                    String.class
                            );

                        } catch (Exception e) {
                            throw new RuntimeException("Keycloak delete failed: " + e.getMessage());
                        }
                    }

                    // =========================
                    // 2. DELETE FROM DATABASE
                    // =========================
                    userRepository.delete(user);
                }
        );

        Runnable runnableWithRetry = Retry.decorateRunnable(retry, runnable);

        try {
            runnableWithRetry.run();
        } catch (Exception e) {
            fallbackDeleteUser(id, e);
        }
    }

    private void fallbackDeleteUser(Long id, Exception e) {
        log.error("DeleteUser fallback triggered for id {}: {}", id, e.getMessage());
        throw new RuntimeException("User deletion failed.");
    }
}