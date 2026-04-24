package com.backend.laissezpasserservice.services;

import com.backend.laissezpasserservice.clients.DemandeClient;
import com.backend.laissezpasserservice.dao.dtos.LaissezPasserRequestDTO;
import com.backend.laissezpasserservice.dao.dtos.LaissezPasserUpdateRequest;
import com.backend.laissezpasserservice.dao.entities.LaissezPasser;
import com.backend.laissezpasserservice.dao.enums.LaissezPasserStatut;
import com.backend.laissezpasserservice.dao.repositories.LaissezPasserRepository;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@Service
public class LaissezPasserService {

    private static final Logger log = LoggerFactory.getLogger(LaissezPasserService.class);

    private final LaissezPasserRepository repository;
    private final DemandeClient demandeClient;
    private final Cloudinary cloudinary;

    private final CircuitBreaker circuitBreaker;
    private final Retry retry;

    public LaissezPasserService(
            LaissezPasserRepository repository,
            DemandeClient demandeClient,
            Cloudinary cloudinary,
            CircuitBreakerRegistry circuitBreakerRegistry,
            RetryRegistry retryRegistry
    ) {
        this.repository = repository;
        this.demandeClient = demandeClient;
        this.cloudinary = cloudinary;

        this.circuitBreaker = circuitBreakerRegistry.circuitBreaker("laissez-passer-service");
        this.retry = retryRegistry.retry("laissez-passer-service");
    }

    // =========================
    // CIRCUIT BREAKER WRAPPER
    // =========================
    private <T> T execute(Supplier<T> supplier, String operationName) {

        Supplier<T> decorated = CircuitBreaker.decorateSupplier(
                circuitBreaker,
                Retry.decorateSupplier(retry, supplier)
        );

        try {
            return decorated.get();
        } catch (Exception e) {
            log.error("{} failed: {}", operationName, e.getMessage());
            throw new RuntimeException(e);
        }
    }

    // =========================
    // CREATE LAISSEZ-PASSER
    // =========================
    public LaissezPasser create(LaissezPasserRequestDTO request) {

        return execute(() -> {

            // 🔗 Verify Demande exists via Feign
            var demande = demandeClient.getDemandeById(request.getDemandeId());
            if (demande == null) {
                throw new RuntimeException("Demande not found: " + request.getDemandeId());
            }

            LaissezPasser lp = new LaissezPasser();

            lp.setDemandeId(request.getDemandeId());
            lp.setNumLaissezPasser(request.getNumLaissezPasser());
            lp.setDateDepotOnda(request.getDateDepotOnda());
            lp.setDateDelivrance(request.getDateDelivrance());
            lp.setDateExpiration(request.getDateExpiration());
            lp.setStatut(request.getStatut());

            // =========================
            // IMAGE UPLOAD (Cloudinary)
            // =========================
            if (request.getImageUrl() != null && !request.getImageUrl().isEmpty()) {
                Map result = uploadFile(request.getImageUrl(), "laissez-passer/image");
                lp.setImageUrl(result.get("secure_url").toString());
                lp.setImagePublicId(result.get("public_id").toString());
            }

            // =========================
            // QUITUS UPLOAD
            // =========================
            if (request.getQuitusPaiementUrl() != null && !request.getQuitusPaiementUrl().isEmpty()) {
                Map result = uploadFile(request.getQuitusPaiementUrl(), "laissez-passer/quitus");
                lp.setQuitusPaiementUrl(result.get("secure_url").toString());
                lp.setQuitusPaiementPublicId(result.get("public_id").toString());
            }

            return repository.save(lp);

        }, "createLaissezPasser");
    }

    // =========================
    // GET BY ID
    // =========================
    public LaissezPasser getById(Long id) {
        return execute(() ->
                        repository.findById(id)
                                .orElseThrow(() -> new RuntimeException("LaissezPasser not found: " + id)),
                "getById"
        );
    }

    // =========================
    // GET BY DEMANDE ID
    // =========================
    public LaissezPasser getByDemandeId(Long demandeId) {
        return execute(() ->
                        repository.findByDemandeId(demandeId)
                                .orElseThrow(() -> new RuntimeException("Not found for demande: " + demandeId)),
                "getByDemandeId"
        );
    }

    // =========================
    // GET ALL
    // =========================
    public List<LaissezPasser> getAll() {
        return execute(repository::findAll, "getAllLaissezPasser");
    }

    // =========================
    // UPDATE STATUS ONLY
    // =========================
    public LaissezPasser updateStatus(Long id, String statut) {

        return execute(() -> {

            LaissezPasser lp = repository.findById(id)
                    .orElseThrow(() -> new RuntimeException("LaissezPasser not found: " + id));

            lp.setStatut(
                    com.backend.laissezpasserservice.dao.enums.LaissezPasserStatut.valueOf(statut)
            );

            return repository.save(lp);

        }, "updateStatus");
    }

    public LaissezPasser updateLaissezPasser(Long id, LaissezPasserUpdateRequest request) {
        return execute(() -> {
            LaissezPasser lp = repository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Laissez-passer not found: " + id));

            if (request.getNumLaissezPasser() != null) {
                lp.setNumLaissezPasser(request.getNumLaissezPasser());
            }
            if (request.getDateDepotOnda() != null) {
                lp.setDateDepotOnda(request.getDateDepotOnda());
            }
            if (request.getDateDelivrance() != null) {
                lp.setDateDelivrance(request.getDateDelivrance());
            }
            if (request.getDateExpiration() != null) {
                lp.setDateExpiration(request.getDateExpiration());
            }
            if (request.getStatut() != null) {
                lp.setStatut(LaissezPasserStatut.valueOf(request.getStatut()));
            }
            if (request.getImageUrl() != null && request.getImageUrl().startsWith("data")) {
                Map result = uploadFile(request.getImageUrl(), "laissez-passer/image");
                lp.setImageUrl(result.get("secure_url").toString());
                lp.setImagePublicId(result.get("public_id").toString());
            }
            if (request.getQuitusPaiementUrl() != null && request.getQuitusPaiementUrl().startsWith("data")) {
                Map result = uploadFile(request.getQuitusPaiementUrl(), "laissez-passer/quitus");
                lp.setQuitusPaiementUrl(result.get("secure_url").toString());
                lp.setQuitusPaiementPublicId(result.get("public_id").toString());
            }

            // save and refetch from DB to get fresh data
            repository.save(lp);
            return repository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Laissez-passer not found after save: " + id));

        }, "updateLaissezPasser");
    }

    // =========================
    // DELETE
    // =========================
    public void delete(Long id) {

        execute(() -> {

            LaissezPasser lp = repository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Not found: " + id));

            try {
                if (lp.getImagePublicId() != null) {
                    cloudinary.uploader().destroy(lp.getImagePublicId(), ObjectUtils.emptyMap());
                }

                if (lp.getQuitusPaiementPublicId() != null) {
                    cloudinary.uploader().destroy(lp.getQuitusPaiementPublicId(), ObjectUtils.emptyMap());
                }

            } catch (Exception e) {
                log.error("Cloudinary delete failed: {}", e.getMessage());
            }

            repository.deleteById(id);
            return null;

        }, "deleteLaissezPasser");
    }

    // =========================
    // CLOUDINARY UPLOAD
    // =========================
    private Map uploadFile(String base64, String folder) {
        try {
            return cloudinary.uploader().upload(
                    base64,
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "auto"
                    )
            );
        } catch (Exception e) {
            log.error("Upload failed: {}", e.getMessage());
            throw new RuntimeException("Cloudinary upload failed");
        }
    }
}