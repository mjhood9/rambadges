package com.backend.demandeservice.services;

import com.backend.demandeservice.clients.UserClient;
import com.backend.demandeservice.dao.dtos.DemandeRequest;
import com.backend.demandeservice.dao.dtos.UpdateStatusRequest;
import com.backend.demandeservice.dao.entities.Demande;
import com.backend.demandeservice.dao.enums.DemandeStatus;
import com.backend.demandeservice.dao.repositories.DemandeRepository;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@Service
public class DemandeService {

    @Value("${frontend.base-url}")
    private String frontendBaseUrl;

    private static final Logger log = LoggerFactory.getLogger(DemandeService.class);

    private final DemandeRepository demandeRepository;
    private final Cloudinary cloudinary;
    private final CircuitBreaker circuitBreaker;
    private final EmailService emailService;
    private final KeycloakUserService keycloakUserService;
    private final Retry retry;

    public DemandeService(
            DemandeRepository demandeRepository, CommentaireService commentaireService,
            Cloudinary cloudinary,
            CircuitBreakerRegistry circuitBreakerRegistry, EmailService emailService, KeycloakUserService keycloakUserService,
            RetryRegistry retryRegistry
    ) {
        this.demandeRepository = demandeRepository;
        this.cloudinary = cloudinary;
        this.circuitBreaker = circuitBreakerRegistry.circuitBreaker("demande-service");
        this.emailService = emailService;
        this.keycloakUserService = keycloakUserService;
        this.retry = retryRegistry.retry("demande-service");
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
    // CREATE DEMANDE
    // =========================
    public Demande createDemande(DemandeRequest request) {

        return execute(() -> {
            Demande demande = new Demande();
            mapRequestToDemande(request, demande);

            // upload CNIE
            if (request.getCnieFile() != null && !request.getCnieFile().isEmpty()) {
                Map result = uploadFile(request.getCnieFile(), "demandes/cnie");
                demande.setCnieFileUrl(result.get("secure_url").toString());
                demande.setCnieFilePublicId(result.get("public_id").toString());
            }

            // upload PHOTO
            if (request.getPhotoFile() != null && !request.getPhotoFile().isEmpty()) {
                Map result = uploadFile(request.getPhotoFile(), "demandes/photos");
                demande.setPhotoFileUrl(result.get("secure_url").toString());
                demande.setPhotoFilePublicId(result.get("public_id").toString());
            }

            return demandeRepository.save(demande);

        }, "createDemande");
    }

    // =========================
    // GET ALL
    // =========================
    public List<Demande> getAllDemandes() {
        return execute(demandeRepository::findAll, "getAllDemandes");
    }

    // =========================
    // GET BY USER
    // =========================
    public List<Demande> getDemandesByUser(String userId) {
        return execute(() -> demandeRepository.findByUserId(userId), "getDemandesByUser");
    }

    // =========================
    // GET BY ID
    // =========================
    public Demande getDemandeById(Long id) {
        return execute(() ->
                        demandeRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Demande not found: " + id)),
                "getDemandeById"
        );
    }

    // =========================
// UPDATE DEMANDE
// =========================
    public Demande updateDemande(Long id, DemandeRequest request) {

        return execute(() -> {

            Demande demande = demandeRepository.findById(id)
                    .orElseThrow(() ->
                            new RuntimeException("Demande not found: " + id)
                    );

            // update fields
            mapRequestToDemande(request, demande);

            // update CNIE if new file exists
            if (request.getCnieFile() != null &&
                    !request.getCnieFile().isEmpty()) {

                try {
                    // delete old file
                    if (demande.getCnieFilePublicId() != null) {
                        cloudinary.uploader().destroy(
                                demande.getCnieFilePublicId(),
                                ObjectUtils.emptyMap()
                        );
                    }

                    // upload new
                    Map result = uploadFile(
                            request.getCnieFile(),
                            "demandes/cnie"
                    );

                    demande.setCnieFileUrl(
                            result.get("secure_url").toString()
                    );

                    demande.setCnieFilePublicId(
                            result.get("public_id").toString()
                    );

                } catch (Exception e) {
                    log.error("CNIE update failed: {}", e.getMessage());
                }
            }

            // update PHOTO if new file exists
            if (request.getPhotoFile() != null &&
                    !request.getPhotoFile().isEmpty()) {

                try {

                    // delete old
                    if (demande.getPhotoFilePublicId() != null) {
                        cloudinary.uploader().destroy(
                                demande.getPhotoFilePublicId(),
                                ObjectUtils.emptyMap()
                        );
                    }

                    // upload new
                    Map result = uploadFile(
                            request.getPhotoFile(),
                            "demandes/photos"
                    );

                    demande.setPhotoFileUrl(
                            result.get("secure_url").toString()
                    );

                    demande.setPhotoFilePublicId(
                            result.get("public_id").toString()
                    );

                } catch (Exception e) {
                    log.error("Photo update failed: {}", e.getMessage());
                }
            }

            return demandeRepository.save(demande);

        }, "updateDemande");
    }

    // =========================
    // UPDATE STATUS
    // =========================
    public Demande updateStatus(Long id, UpdateStatusRequest request) {

        return execute(() -> {

            Demande demande = demandeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Demande not found: " + id));

            DemandeStatus oldStatusDirecteur = demande.getStatusDirecteur();
            DemandeStatus oldStatusCorrespondant = demande.getStatusCorrespondant();

            // ======================
            // UPDATE FIELDS
            // ======================
            if (request.getStatus() != null) {
                demande.setStatus(request.getStatus());
            }

            if (request.getStatusDirecteur() != null) {
                demande.setStatusDirecteur(request.getStatusDirecteur());
            }

            if (request.getSignatureDirecteur() != null) {
                demande.setSignatureDirecteur(request.getSignatureDirecteur());
            }

            if (Boolean.TRUE.equals(request.getClearStatusCorrespondant())) {
                demande.setStatusCorrespondant(null);
            } else if (request.getStatusCorrespondant() != null) {
                demande.setStatusCorrespondant(request.getStatusCorrespondant());
            }

            if (request.getSignatureCorrespondant() != null) {
                demande.setSignatureCorrespondant(request.getSignatureCorrespondant());
            }

            Demande saved = demandeRepository.save(demande);

            // ======================
            // EMAIL NOTIFICATIONS
            // ======================
            notifyStatusEmails(saved, oldStatusDirecteur, oldStatusCorrespondant);

            return saved;

        }, "updateStatus");
    }

    private void notifyStatusEmails(Demande demande,
                                    DemandeStatus oldDir,
                                    DemandeStatus oldCorr) {

        String email = keycloakUserService.getUserEmail(demande.getUserId());

        // ===== DIRECTEUR =====
        if (isChanged(oldDir, demande.getStatusDirecteur())) {

            if (isFinalStatus(demande.getStatusDirecteur())) {

                sendEmail(
                        demande,
                        email,
                        demande.getStatusDirecteur(),
                        "Directeur De La Direction " + demande.getDirection()
                );
            }
        }

        // ===== CORRESPONDANT =====
        if (isChanged(oldCorr, demande.getStatusCorrespondant())) {

            if (isFinalStatus(demande.getStatusCorrespondant())) {

                sendEmail(demande, email, demande.getStatusCorrespondant(), "Correspondant de Sûreté");
            }
        }
    }

    private boolean isChanged(DemandeStatus oldStatus, DemandeStatus newStatus) {
        return newStatus != null && !newStatus.equals(oldStatus);
    }

    private boolean isFinalStatus(DemandeStatus status) {
        return status == DemandeStatus.APPROUVEE
                || status == DemandeStatus.REJETEE;
    }

    private void sendEmail(Demande demande,
                           String to,
                           DemandeStatus status,
                           String role) {

        String baseUrl = frontendBaseUrl;
        String demandeurLink = baseUrl + "/demandeur/dashboard";

        String subject;
        String body;

        String fullName = demande.getFirstName() + " " + demande.getLastName();
        Long demandeId = demande.getId();

        if (DemandeStatus.APPROUVEE.equals(status)) {

            subject = "✔ Confirmation de validation de votre demande";

            body = String.format(
                    "Bonjour %s,\n\n" +
                            "Nous vous informons que votre demande N°%d a été approuvée par %s.\n\n" +
                            "✔ Statut : APPROUVÉE\n" +
                            "📌 Décision prise par : %s\n\n" +
                            "Vous pouvez consulter les détails de votre demande à tout moment via le lien ci-dessous :\n" +
                            "%s\n\n" +
                            "Nous vous remercions pour votre confiance.\n\n" +
                            "Cordialement,\n" +
                            "RAM Badge",
                    fullName,
                    demandeId,
                    role,
                    role,
                    demandeurLink
            );

        } else if (DemandeStatus.REJETEE.equals(status)) {

            subject = "✖ Notification de rejet de votre demande";

            body = String.format(
                    "Bonjour %s,\n\n" +
                            "Nous vous informons que votre demande N°%d a été rejetée par %s.\n\n" +
                            "✖ Statut : REJETÉE\n" +
                            "📌 Décision prise par : %s\n\n" +
                            "Vous pouvez consulter les détails de votre demande via le lien ci-dessous :\n" +
                            "%s\n\n" +
                            "Pour toute information complémentaire, veuillez contacter le service concerné.\n\n" +
                            "Cordialement,\n" +
                            "RAM Badge",
                    fullName,
                    demandeId,
                    role,
                    role,
                    demandeurLink
            );

        } else {
            return; // no email for other statuses
        }

        emailService.sendEmail(to, subject, body);
    }

    // =========================
    // DELETE DEMANDE
    // =========================
    public void deleteDemande(Long id) {
        execute(() -> {

            Demande demande = demandeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Demande not found: " + id));

            try {
                if (demande.getCnieFilePublicId() != null) {
                    cloudinary.uploader().destroy(
                            demande.getCnieFilePublicId(),
                            ObjectUtils.emptyMap()
                    );
                }

                if (demande.getPhotoFilePublicId() != null) {
                    cloudinary.uploader().destroy(
                            demande.getPhotoFilePublicId(),
                            ObjectUtils.emptyMap()
                    );
                }

            } catch (Exception e) {
                // don't crash delete if cloudinary fails
                log.error("Cloudinary delete failed: {}", e.getMessage());
            }

            demandeRepository.deleteById(id);
            return null;

        }, "deleteDemande");
    }

    // =========================
    // CLOUDINARY UPLOAD (FIXED)
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
            log.error("Cloudinary upload failed: {}", e.getMessage());
            throw new RuntimeException("Upload failed");
        }
    }

    // =========================
    // MAP DTO -> ENTITY
    // =========================
    private void mapRequestToDemande(DemandeRequest request, Demande demande) {

        demande.setUserId(request.getUserId());
        demande.setFirstName(request.getFirstName());
        demande.setLastName(request.getLastName());
        demande.setNationalite(request.getNationalite());
        demande.setCnie(request.getCnie());
        demande.setLieuNaissance(request.getLieuNaissance());
        demande.setFilsDe(request.getFilsDe());
        demande.setBen(request.getBen());
        demande.setEtDe(request.getEtDe());
        demande.setBent(request.getBent());
        demande.setSituationFamiliale(request.getSituationFamiliale());
        demande.setConjointNom(request.getConjointNom());
        demande.setConjointFonction(request.getConjointFonction());
        demande.setNombreEnfants(request.getNombreEnfants());
        demande.setAdressePersonnelle(request.getAdressePersonnelle());
        demande.setAdressePrecedente(request.getAdressePrecedente());
        demande.setVille(request.getVille());

        demande.setOrganisme(
                request.getOrganisme() != null ? request.getOrganisme() : "Royal Air Maroc"
        );

        demande.setServiceEmployeur(request.getServiceEmployeur());
        demande.setFonction(request.getFonction());
        demande.setDirection(request.getDirection());
        demande.setEmployesPrecedents(request.getEmployesPrecedents());

        demande.setPassportNumber(request.getPassportNumber());
        demande.setPassportEmisA(request.getPassportEmisA());
        demande.setPermisNumber(request.getPermisNumber());
        demande.setPermisEmisA(request.getPermisEmisA());
        demande.setPermisPortArme(request.getPermisPortArme());

        demande.setServiceMilitaire(request.getServiceMilitaire());
        demande.setNiveauInstruction(request.getNiveauInstruction());
        demande.setEcole(request.getEcole());

        demande.setAppartenances(request.getAppartenances());
        demande.setPartiPolitique(request.getPartiPolitique());
        demande.setSyndicat(request.getSyndicat());
        demande.setAssociation(request.getAssociation());
        demande.setAntecedents(request.getAntecedents());
        demande.setDatesMotifs(request.getDatesMotifs());

        demande.setObjetAutorisation(request.getObjetAutorisation());
        demande.setSignature(request.getSignature());

        demande.setDateExpiration(request.getDateExpiration());
        demande.setDateNaissance(request.getDateNaissance());
        demande.setDateRecrutement(request.getDateRecrutement());
        demande.setDateExpirationPassport(request.getDateExpirationPassport());
        demande.setDateDebutPassport(request.getDateDebutPassport());
        demande.setDateDebutPermis(request.getDateDebutPermis());

        demande.setZones(request.getZones());
        demande.setPortes(request.getPortes());
        demande.setSecteur(request.getSecteur());
    }
}