package com.backend.userservice.services;

import com.backend.userservice.dao.entities.Users;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.stream.Collectors;

@Service
public class JwtService {

    @Value("${application.security.jwt.secret-key}")
    private String secretKey;

    @Value("${application.security.jwt.expiration}")
    private long expiration;

    // =========================
    // GENERATE TOKEN
    // =========================
    public String generateToken(Users user) {
        return Jwts.builder()
                .subject(String.valueOf(user.getId())) // ✅ USER ID AS SUBJECT
                .claim("username", user.getUsername())  // keep username for Spring Security
                .claim("roles", user.getRoles().stream()
                        .map(r -> r.getName().name())
                        .collect(Collectors.toList()))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignKey())
                .compact();
    }

    // =========================
    // EXTRACT USER ID
    // =========================
    public Long extractUserId(String token) {
        return Long.parseLong(getClaims(token).getSubject());
    }

    // =========================
    // EXTRACT USERNAME
    // =========================
    public String extractUsername(String token) {
        return getClaims(token).get("username", String.class);
    }

    // =========================
    // VALIDATION
    // =========================
    public boolean isTokenValid(String token) {
        return getClaims(token).getExpiration().after(new Date());
    }

    // =========================
    // INTERNAL
    // =========================
    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSignKey() {
        byte[] key = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(key);
    }
}