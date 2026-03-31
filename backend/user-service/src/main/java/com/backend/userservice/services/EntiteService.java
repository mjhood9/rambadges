package com.backend.userservice.services;

import com.backend.userservice.dao.dtos.EntiteRequest;
import com.backend.userservice.dao.entities.Entite;
import com.backend.userservice.dao.repositories.EntiteRepository;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

@Service
public class EntiteService {

    private static final Logger log = LoggerFactory.getLogger(EntiteService.class);

    private final EntiteRepository entiteRepository;
    private final CircuitBreaker circuitBreaker;
    private final Retry retry;

    public EntiteService(EntiteRepository entiteRepository,
                         CircuitBreakerRegistry circuitBreakerRegistry,
                         RetryRegistry retryRegistry) {
        this.entiteRepository = entiteRepository;
        this.circuitBreaker = circuitBreakerRegistry.circuitBreaker("user-service");
        this.retry = retryRegistry.retry("user-service");
    }

    private <T> T execute(Supplier<T> supplier, String operationName) {
        Supplier<T> withCB = CircuitBreaker.decorateSupplier(circuitBreaker, supplier);
        Supplier<T> withRetry = Retry.decorateSupplier(retry, withCB);
        try {
            return withRetry.get();
        } catch (RuntimeException e) {
            log.error("{} failed: {}", operationName, e.getMessage());
            throw e;
        }
    }

    public List<Entite> getAllEntites() {
        return execute(() -> entiteRepository.findAll(), "getAllEntites");
    }

    public Entite getEntiteById(Long id) {
        return execute(() -> entiteRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Entite not found with id: " + id)),
                "getEntiteById");
    }

    public Entite createEntite(EntiteRequest request) {
        return execute(() -> {
            if (entiteRepository.existsByName(request.getName())) {
                throw new RuntimeException("Entite already exists: " + request.getName());
            }
            Entite entite = Entite.builder()
                    .name(request.getName())
                    .build();
            return entiteRepository.save(entite);
        }, "createEntite");
    }

    public Entite updateEntite(Long id, EntiteRequest request) {
        return execute(() -> {
            Entite entite = entiteRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Entite not found with id: " + id));
            entite.setName(request.getName());
            return entiteRepository.save(entite);
        }, "updateEntite");
    }

    public void deleteEntite(Long id) {
        execute(() -> {
            entiteRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Entite not found with id: " + id));
            entiteRepository.deleteById(id);
            return null;
        }, "deleteEntite");
    }
}
