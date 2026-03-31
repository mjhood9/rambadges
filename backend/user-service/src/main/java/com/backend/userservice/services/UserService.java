package com.backend.userservice.services;

import com.backend.userservice.dao.entities.Users;
import com.backend.userservice.dao.repositories.RoleRepository;
import com.backend.userservice.dao.repositories.UserRepository;
import com.backend.userservice.exception.UserNotFoundException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final CircuitBreaker circuitBreaker;
    private final Retry retry;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       CircuitBreakerRegistry circuitBreakerRegistry,
                       RetryRegistry retryRegistry) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.circuitBreaker = circuitBreakerRegistry.circuitBreaker("user-service");
        this.retry = retryRegistry.retry("user-service");
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
}