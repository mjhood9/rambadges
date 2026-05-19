package com.backend.userservice.services;

import com.backend.userservice.dao.dtos.*;
import com.backend.userservice.dao.entities.*;
import com.backend.userservice.dao.repositories.*;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Set;

@Service
public class AuthService {
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

    private final RestTemplate restTemplate;
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EntiteRepository entiteRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository, EntiteRepository entiteRepository,
                       PasswordEncoder passwordEncoder, RestTemplate restTemplate) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.entiteRepository = entiteRepository;
        this.passwordEncoder = passwordEncoder;
        this.restTemplate = restTemplate;
    }

    @CircuitBreaker(name = "user-service", fallbackMethod = "fallbackSignUp")
    @Retry(name = "user-service")
    public SignUpResponse signUp(SignUpRequest request) {

        String fullName = request.getFirstName() + " " + request.getLastName();

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Set<Role> roles = request.getRoles().stream()
                .map(r -> roleRepository.findByName(r)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + r)))
                .collect(Collectors.toSet());

        Entite entite = null;
        if (request.getEntiteId() != null) {
            entite = entiteRepository.findById(request.getEntiteId())
                    .orElseThrow(() -> new RuntimeException("Entite not found"));
        }

        Users user = new Users();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setUsername(fullName);
        user.setEmail(request.getEmail());
        user.setRoles(roles);
        user.setEntite(entite);

        // 1. Create in Keycloak
        String keycloakId = createKeycloakUser(user, roles);
        user.setKeycloakId(keycloakId);

        // 2. Send ONE email with both actions
        String adminToken = getAdminToken();
        sendActionsEmail(keycloakId, adminToken);

        // 3. Save to DB
        userRepository.save(user);

        SignUpResponse response = new SignUpResponse();
        response.setMessage("User created successfully. Check email to verify and set password.");
        response.setUsername(user.getUsername());
        response.setFullName(fullName);
        response.setEmail(user.getEmail());

        return response;
    }

    private String createKeycloakUser(Users user, Set<Role> roles) {
        try {
            String adminToken = getAdminToken();
            String url = keycloakUrl + "/admin/realms/" + realm + "/users";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(adminToken);

            List<String> roleNames = roles.stream()
                    .map(r -> r.getName().name())
                    .collect(Collectors.toList());

            Map<String, Object> kcUser = new HashMap<>();
            kcUser.put("username", user.getEmail());
            kcUser.put("email", user.getEmail());
            kcUser.put("firstName", user.getFirstName());
            kcUser.put("lastName", user.getLastName());
            kcUser.put("enabled", true);
            kcUser.put("emailVerified", false);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(kcUser, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode() == HttpStatus.CREATED) {
                String location = response.getHeaders().getLocation().toString();
                String userId = location.substring(location.lastIndexOf("/") + 1);
                assignRoles(userId, roleNames, adminToken);
                return userId;
            }

            throw new RuntimeException("Failed to create Keycloak user");

        } catch (Exception e) {
            throw new RuntimeException("Keycloak error: " + e.getMessage());
        }
    }

    private void sendActionsEmail(String userId, String adminToken) {
        try {
            String url = keycloakUrl
                    + "/admin/realms/" + realm
                    + "/users/" + userId
                    + "/execute-actions-email";

            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("client_id", clientId)
                    .queryParam("redirect_uri", "http://localhost:3000");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(adminToken);

            // both actions in one email
            List<String> actions = List.of("VERIFY_EMAIL", "UPDATE_PASSWORD");

            HttpEntity<List<String>> request = new HttpEntity<>(actions, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    builder.toUriString(),
                    HttpMethod.PUT,
                    request,
                    String.class
            );

            log.info("✅ Actions email sent: {}", response.getStatusCode());

        } catch (Exception e) {
            log.error("❌ Actions email failed: {}", e.getMessage());
        }
    }

    private String getAdminToken() {
        String url = keycloakUrl + "/realms/master/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
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
            HttpHeaders headers = new HttpHeaders();
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
            HttpHeaders assignHeaders = new HttpHeaders();
            assignHeaders.setContentType(MediaType.APPLICATION_JSON);
            assignHeaders.setBearerAuth(adminToken);

            HttpEntity<List<Map<String, Object>>> assignRequest = new HttpEntity<>(rolesToAssign, assignHeaders);
            restTemplate.postForEntity(assignUrl, assignRequest, String.class);

        } catch (Exception e) {
            log.error("Failed to assign roles: {}", e.getMessage());
        }
    }

    @CircuitBreaker(name = "user-service", fallbackMethod = "fallbackSignIn")
    @Retry(name = "user-service")
    public AuthResponse signIn(SignInRequest request) {

        String url = keycloakUrl + "/realms/" + realm +
                "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("grant_type", "password");
        body.add("username", request.getEmail());
        body.add("password", request.getPassword());

        HttpEntity<MultiValueMap<String, String>> req =
                new HttpEntity<>(body, headers);

        ResponseEntity<Map> res =
                restTemplate.postForEntity(url, req, Map.class);

        Map<String, Object> token = res.getBody();

        if (token == null || !token.containsKey("access_token")) {
            throw new RuntimeException("Invalid credentials");
        }

        AuthResponse response = new AuthResponse();
        response.setAccessToken(token.get("access_token").toString());
        response.setRefreshToken(token.get("refresh_token").toString());

        // OPTIONAL: load user from DB ONLY for profile info
        userRepository.findByEmail(request.getEmail())
                .ifPresent(user -> {
                    response.setFullName(user.getFirstName() + " " + user.getLastName());
                    response.setEmail(user.getEmail());
                });

        return response;
    }

    // Fallback methods
    public SignUpResponse fallbackSignUp(SignUpRequest request, Throwable e) {
        log.error("SignUp fallback triggered: {}", e.getMessage());

        SignUpResponse response = new SignUpResponse();
        response.setMessage("Service temporairement indisponible. Réessayez plus tard.");

        return response;
    }

    public AuthResponse fallbackSignIn(SignInRequest request, Exception e) {
        log.error("SignIn fallback triggered: {}", e.getMessage());
        throw new RuntimeException("Sign in service is currently unavailable. Please try again later.");
    }
}
