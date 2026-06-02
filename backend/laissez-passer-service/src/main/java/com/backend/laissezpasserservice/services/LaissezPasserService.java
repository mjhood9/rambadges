package com.backend.laissezpasserservice.services;

import com.backend.laissezpasserservice.clients.DemandeClient;
import com.backend.laissezpasserservice.dao.dtos.LaissezPasserRequestDTO;
import com.backend.laissezpasserservice.dao.dtos.LaissezPasserUpdateRequest;
import com.backend.laissezpasserservice.dao.entities.LaissezPasser;
import com.backend.laissezpasserservice.dao.enums.LaissezPasserStatut;
import com.backend.laissezpasserservice.dao.repositories.LaissezPasserNotificationRepository;
import com.backend.laissezpasserservice.dao.repositories.LaissezPasserRepository;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@Service
public class LaissezPasserService {

    @Value("${frontend.base-url}")
    private String frontendBaseUrl;

    private static final Logger log = LoggerFactory.getLogger(LaissezPasserService.class);

    private final LaissezPasserRepository repository;
    private final DemandeClient demandeClient;
    private final KeycloakUserService keycloakUserService;
    private final EmailService emailService;
    private final Cloudinary cloudinary;
    private final LaissezPasserNotificationRepository notifRepo;

    private final CircuitBreaker circuitBreaker;
    private final Retry retry;

    public LaissezPasserService(
            LaissezPasserRepository repository,
            DemandeClient demandeClient, KeycloakUserService keycloakUserService, EmailService emailService,
            Cloudinary cloudinary, LaissezPasserNotificationRepository notifRepo,
            CircuitBreakerRegistry circuitBreakerRegistry,
            RetryRegistry retryRegistry
    ) {
        this.repository = repository;
        this.demandeClient = demandeClient;
        this.keycloakUserService = keycloakUserService;
        this.emailService = emailService;
        this.cloudinary = cloudinary;
        this.notifRepo = notifRepo;

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

            LaissezPasser lp = new LaissezPasser();

            lp.setDemandeId(request.getDemandeId());
            lp.setUserId(request.getUserId());
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
            if (request.getUserId() != null) {
                lp.setUserId(request.getUserId());
            }
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

            // save
            repository.save(lp);

            // refetch fresh entity
            LaissezPasser saved = repository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Laissez-passer not found after save: " + id));

            // trigger email
            notifyLaissezPasserDelivered(saved);

            return saved;
        }, "updateLaissezPasser");
    }

    private void notifyLaissezPasserDelivered(LaissezPasser lp) {

        // ONLY send if all required fields exist
        if (lp.getNumLaissezPasser() == null
                || lp.getDateDelivrance() == null
                || lp.getDateExpiration() == null) {
            return;
        }

        String email = keycloakUserService.getUserEmail(lp.getUserId());

        String subject = "Votre laissez-passer a été délivré";

        String link = frontendBaseUrl + "/demandeur/dashboard/";

        String body = buildDeliveredEmail(lp, link);

        emailService.sendEmail(email, subject, body);
    }

    private String buildDeliveredEmail(LaissezPasser lp, String link) {

        return """
Bonjour,

Nous avons le plaisir de vous informer que votre laissez-passer a été délivré avec succès.

📄 Informations du laissez-passer :
- Numéro : %s
- Demande ID : %d
- Date de délivrance : %s
- Date d’expiration : %s

🔗 Accès à votre laissez-passer :
%s

⚠️ Veuillez conserver ce document et vérifier sa validité régulièrement.

Cordialement,
RAM Badge
""".formatted(
                lp.getNumLaissezPasser(),
                lp.getDemandeId(),
                lp.getDateDelivrance(),
                lp.getDateExpiration(),
                link
        );
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

    @Scheduled(cron = "0 0 * * * *")
    public void expireLaissezPasser() {

        LocalDate today = LocalDate.now();
        List<LaissezPasser> list = repository.findAll();

        boolean changed = false;

        for (LaissezPasser lp : list) {

            if (lp.getDateExpiration() != null
                    && lp.getDateExpiration().isBefore(today)
                    && lp.getStatut() != LaissezPasserStatut.EXPIRE) {

                lp.setStatut(LaissezPasserStatut.EXPIRE);
                changed = true;
            }
        }

        if (changed) repository.saveAll(list);
    }

    // =========================
    // WARNING JOB
    // =========================
    @Scheduled(cron = "0 0 9 * * *") // every day at 09:00
    public void notifyExpiring() {

        LocalDate today = LocalDate.now();

        for (LaissezPasser lp : repository.findAll()) {

            try {

                if (lp.getDateExpiration() == null) {
                    continue;
                }

                long daysLeft =
                        ChronoUnit.DAYS.between(today, lp.getDateExpiration());

                boolean shouldSend = false;

                // send once at 30 days
                if (daysLeft == 30) {
                    shouldSend = true;
                }

                // send once at 15 days
                else if (daysLeft == 15) {
                    shouldSend = true;
                }

                // send DAILY from 7 -> 1
                else if (daysLeft <= 7 && daysLeft >= 1) {
                    shouldSend = true;
                }

                if (!shouldSend) {
                    continue;
                }

                String email =
                        keycloakUserService.getUserEmail(lp.getUserId());

                String subject;

                if (daysLeft == 1) {

                    subject =
                            "⚠️ Expiration du laissez-passer demain";

                } else {

                    subject =
                            "📌 Rappel - Expiration dans "
                                    + daysLeft
                                    + " jour(s)";
                }

                emailService.sendEmail(
                        email,
                        subject,
                        buildExpiringEmail(lp, daysLeft)
                );

                System.out.println(
                        "✅ Expiring email sent to "
                                + email
                                + " | Days left: "
                                + daysLeft
                );

            } catch (Exception e) {

                System.err.println(
                        "❌ Expiring notification failed for LP "
                                + lp.getId()
                                + ": "
                                + e.getMessage()
                );
            }
        }
    }

    @Scheduled(fixedRate = 3600000) // every 1 hour
    public void notifyExpired() {

        LocalDate today = LocalDate.now();

        for (LaissezPasser lp : repository.findAll()) {

            try {

                if (lp.getDateExpiration() == null) {
                    continue;
                }

                // expires immediately when date <= today
                boolean expired =
                        !lp.getDateExpiration().isAfter(today);

                // send ONLY ONCE
                if (expired && !lp.isExpiredNotified()) {

                    String email =
                            keycloakUserService.getUserEmail(lp.getUserId());

                    emailService.sendEmail(
                            email,
                            "❌ Laissez-Passer expiré",
                            buildExpiredEmail(lp)
                    );

                    // mark as already notified
                    lp.setExpiredNotified(true);

                    // update status
                    lp.setStatut(LaissezPasserStatut.EXPIRE);

                    repository.save(lp);

                    System.out.println(
                            "✅ Expired email sent to: " + email
                    );
                }

            } catch (Exception e) {

                System.err.println(
                        "❌ Expired notification failed for LP "
                                + lp.getId()
                                + ": "
                                + e.getMessage()
                );
            }
        }
    }

    private String buildExpiringEmail(LaissezPasser lp, long daysLeft) {

        return """
    Bonjour,

    Ceci est un rappel automatique concernant votre laissez-passer.

    📄 Numéro : %s
    📅 Date d’expiration : %s
    ⏳ Il reste : %d jour(s)

    ⚠️ Nous vous invitons à renouveler votre laissez-passer avant expiration.

    Cordialement,
    RAM Badge
    """.formatted(
                lp.getNumLaissezPasser(),
                lp.getDateExpiration(),
                daysLeft
        );
    }
    private String buildExpiredEmail(LaissezPasser lp) {

        return """
    Bonjour,

    Nous vous informons que votre laissez-passer a expiré.

    📄 Numéro : %s
    📅 Date d’expiration : %s

    ❌ Votre laissez-passer n’est plus valide.

    Merci de procéder à son renouvellement dans les plus brefs délais.

    Cordialement,
    RAM Badge
    """.formatted(
                lp.getNumLaissezPasser(),
                lp.getDateExpiration()
        );
    }
}