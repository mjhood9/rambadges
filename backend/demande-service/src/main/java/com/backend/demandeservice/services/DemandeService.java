package com.backend.demandeservice.services;

import com.backend.demandeservice.clients.UserClient;
import com.backend.demandeservice.dao.dtos.DemandeRequest;
import com.backend.demandeservice.dao.dtos.UpdateStatusRequest;
import com.backend.demandeservice.dao.dtos.UserResponse;
import com.backend.demandeservice.dao.entities.Demande;
import com.backend.demandeservice.dao.repositories.DemandeRepository;
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
public class DemandeService {

    private static final Logger log = LoggerFactory.getLogger(DemandeService.class);

    private final DemandeRepository demandeRepository;
    private final Cloudinary cloudinary;
    private final UserClient userClient;
    private final CircuitBreaker circuitBreaker;
    private final Retry retry;

    public DemandeService(
            DemandeRepository demandeRepository, CommentaireService commentaireService,
            Cloudinary cloudinary,
            UserClient userClient,
            CircuitBreakerRegistry circuitBreakerRegistry,
            RetryRegistry retryRegistry
    ) {
        this.demandeRepository = demandeRepository;
        this.cloudinary = cloudinary;
        this.userClient = userClient;
        this.circuitBreaker = circuitBreakerRegistry.circuitBreaker("demande-service");
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

            // verify user
            UserResponse user = userClient.getUserById(request.getUserId());
            if (user == null) {
                throw new RuntimeException("User not found: " + request.getUserId());
            }

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
    public List<Demande> getDemandesByUser(Long userId) {
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
    // UPDATE STATUS
    // =========================
    public Demande updateStatus(Long id, UpdateStatusRequest request) {

        return execute(() -> {

            Demande demande = demandeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Demande not found: " + id));

            if (request.getStatus() != null) {
                demande.setStatus(request.getStatus());
            }

            if (request.getStatusDirecteur() != null) {
                demande.setStatusDirecteur(request.getStatusDirecteur());
            }

            if(request.getSignatureDirecteur() != null){
                demande.setSignatureDirecteur(request.getSignatureDirecteur());
            }

            if (request.getStatusCorrespondant() != null) {
                demande.setStatusCorrespondant(request.getStatusCorrespondant());
            }

            if(request.getSignatureCorrespondant() != null){
                demande.setSignatureCorrespondant(request.getSignatureCorrespondant());
            }

            return demandeRepository.save(demande);

        }, "updateStatus");
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