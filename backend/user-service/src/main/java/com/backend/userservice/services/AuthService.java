package com.backend.userservice.services;

import com.backend.userservice.dao.dtos.*;
import com.backend.userservice.dao.entities.*;
import com.backend.userservice.dao.repositories.*;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @CircuitBreaker(name = "user-service", fallbackMethod = "fallbackSignUp")
    @Retry(name = "user-service")
    public SignUpResponse signUp(SignUpRequest request) {
        String fullName = request.getFullName();

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Set<Role> roles = request.getRoles().stream()
                .map(r -> roleRepository.findByName(r)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + r)))
                .collect(Collectors.toSet());

        Users user = Users.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .username(fullName)
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(roles)
                .build();

        userRepository.save(user);

        return SignUpResponse.builder()
                .message("User created successfully")
                .username(user.getUsername())
                .fullName(user.getFirstName() + " " + user.getLastName())
                .email(user.getEmail())
                .build();
    }

    @CircuitBreaker(name = "user-service", fallbackMethod = "fallbackSignIn")
    @Retry(name = "user-service")
    public AuthResponse signIn(SignInRequest request) {
        Users user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        return AuthResponse.builder()
                .token(jwtService.generateToken(user))
                .username(user.getUsername())
                .fullName(user.getFirstName() + " " + user.getLastName())
                .email(user.getEmail())
                .roles(user.getRoles().stream()
                        .map(r -> r.getName().name())
                        .collect(Collectors.toSet()))
                .build();
    }

    // Fallback methods
    public AuthResponse fallbackSignUp(SignUpRequest request, Exception e) {
        log.error("SignUp fallback triggered: {}", e.getMessage());
        throw new RuntimeException("Sign up service is currently unavailable. Please try again later.");
    }

    public AuthResponse fallbackSignIn(SignInRequest request, Exception e) {
        log.error("SignIn fallback triggered: {}", e.getMessage());
        throw new RuntimeException("Sign in service is currently unavailable. Please try again later.");
    }
}
