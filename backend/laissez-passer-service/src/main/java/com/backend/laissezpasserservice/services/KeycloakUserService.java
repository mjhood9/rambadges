package com.backend.laissezpasserservice.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class KeycloakUserService {

    @Value("${keycloak.auth-server-url}")
    private String authServerUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.client-secret}")
    private String clientSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    // =========================
    // GET ADMIN TOKEN (client_credentials)
    // =========================
    private String getAccessToken() {

        String url = authServerUrl +
                "/realms/" + realm +
                "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String body =
                "grant_type=client_credentials" +
                        "&client_id=" + clientId +
                        "&client_secret=" + clientSecret;

        HttpEntity<String> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response =
                restTemplate.exchange(url, HttpMethod.POST, request, Map.class);

        return (String) response.getBody().get("access_token");
    }

    // =========================
    // GET USER EMAIL FROM KEYCLOAK
    // =========================
    public String getUserEmail(String userId) {

        String token = getAccessToken();

        String url = authServerUrl +
                "/admin/realms/" + realm +
                "/users/" + userId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response =
                restTemplate.exchange(url, HttpMethod.GET, request, Map.class);

        Map body = response.getBody();

        if (body == null || body.get("email") == null) {
            throw new RuntimeException("Email not found in Keycloak");
        }

        return body.get("email").toString();
    }
}