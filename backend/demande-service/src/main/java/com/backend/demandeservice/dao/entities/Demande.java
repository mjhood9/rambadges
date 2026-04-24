package com.backend.demandeservice.dao.entities;

import com.backend.demandeservice.dao.enums.DemandeStatus;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "demandes")
public class Demande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // User info
    private Long userId;
    private String firstName;
    private String lastName;
    private String nationalite;
    private String cnie;
    private String lieuNaissance;
    private String filsDe;
    private String ben;
    private String etDe;
    private String bent;
    private String situationFamiliale;
    private String conjointNom;
    private String conjointFonction;
    private String nombreEnfants;
    private String adressePersonnelle;
    private String adressePrecedente;
    private String ville;
    private String organisme;
    private String serviceEmployeur;
    private String fonction;
    private String direction;
    private String employesPrecedents;
    private String passportNumber;
    private String passportEmisA;
    private String permisNumber;
    private String permisEmisA;
    private String permisPortArme;
    private String serviceMilitaire;
    private String niveauInstruction;
    private String ecole;
    private String appartenances;
    private String partiPolitique;
    private String syndicat;
    private String association;
    private String antecedents;
    private String datesMotifs;
    private String objetAutorisation;
    @Lob
    @Column(columnDefinition = "TEXT")
    private String signature;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String signatureDirecteur;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String signatureCorrespondant;

    // Zones, portes, secteur stored as JSON strings
    private String zones;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> portes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> secteur;

    // Dates
    private LocalDate dateExpiration;
    private LocalDate dateNaissance;
    private LocalDate dateRecrutement;
    private LocalDate dateExpirationPassport;
    private LocalDate dateDebutPassport;
    private LocalDate dateDebutPermis;

    // Files stored as byte arrays
    @Lob
    @Column(columnDefinition = "TEXT")
    private String cnieFileUrl;
    @Lob
    @Column(columnDefinition = "TEXT")
    private String photoFileUrl;
    @Lob
    @Column(columnDefinition = "TEXT")
    private String cnieFilePublicId;
    @Lob
    @Column(columnDefinition = "TEXT")
    private String photoFilePublicId;

    // Status
    @Enumerated(EnumType.STRING)
    private DemandeStatus status;

    @Enumerated(EnumType.STRING)
    private DemandeStatus statusDirecteur;

    @Enumerated(EnumType.STRING)
    private DemandeStatus statusCorrespondant;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = DemandeStatus.EN_ATTENTE;
        this.statusDirecteur = DemandeStatus.EN_ATTENTE;
        if (this.organisme == null) this.organisme = "Royal Air Maroc";
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getNationalite() { return nationalite; }
    public String getCnie() { return cnie; }
    public String getLieuNaissance() { return lieuNaissance; }
    public String getFilsDe() { return filsDe; }
    public String getBen() { return ben; }
    public String getEtDe() { return etDe; }
    public String getBent() { return bent; }
    public String getSituationFamiliale() { return situationFamiliale; }
    public String getConjointNom() { return conjointNom; }
    public String getConjointFonction() { return conjointFonction; }
    public String getNombreEnfants() { return nombreEnfants; }
    public String getAdressePersonnelle() { return adressePersonnelle; }
    public String getAdressePrecedente() { return adressePrecedente; }
    public String getVille() { return ville; }
    public String getOrganisme() { return organisme; }
    public String getServiceEmployeur() { return serviceEmployeur; }
    public String getFonction() { return fonction; }
    public String getDirection() { return direction; }
    public String getEmployesPrecedents() { return employesPrecedents; }
    public String getPassportNumber() { return passportNumber; }
    public String getPassportEmisA() { return passportEmisA; }
    public String getPermisNumber() { return permisNumber; }
    public String getPermisEmisA() { return permisEmisA; }
    public String getPermisPortArme() { return permisPortArme; }
    public String getServiceMilitaire() { return serviceMilitaire; }
    public String getNiveauInstruction() { return niveauInstruction; }
    public String getEcole() { return ecole; }
    public String getAppartenances() { return appartenances; }
    public String getPartiPolitique() { return partiPolitique; }
    public String getSyndicat() { return syndicat; }
    public String getAssociation() { return association; }
    public String getAntecedents() { return antecedents; }
    public String getDatesMotifs() { return datesMotifs; }
    public String getObjetAutorisation() { return objetAutorisation; }
    public String getSignature() { return signature; }
    public String getZones() { return zones; }
    public List<String> getPortes() { return portes; }
    public List<String> getSecteur() { return secteur; }
    public LocalDate getDateExpiration() { return dateExpiration; }
    public LocalDate getDateNaissance() { return dateNaissance; }
    public LocalDate getDateRecrutement() { return dateRecrutement; }
    public LocalDate getDateExpirationPassport() { return dateExpirationPassport; }
    public LocalDate getDateDebutPassport() { return dateDebutPassport; }
    public LocalDate getDateDebutPermis() { return dateDebutPermis; }
    public String getCnieFileUrl() { return cnieFileUrl; }
    public String getPhotoFileUrl() { return photoFileUrl; }
    public String getCnieFilePublicId() { return cnieFilePublicId; }
    public String getPhotoFilePublicId() { return photoFilePublicId; }
    public DemandeStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setNationalite(String nationalite) { this.nationalite = nationalite; }
    public void setCnie(String cnie) { this.cnie = cnie; }
    public void setLieuNaissance(String lieuNaissance) { this.lieuNaissance = lieuNaissance; }
    public void setFilsDe(String filsDe) { this.filsDe = filsDe; }
    public void setBen(String ben) { this.ben = ben; }
    public void setEtDe(String etDe) { this.etDe = etDe; }
    public void setBent(String bent) { this.bent = bent; }
    public void setSituationFamiliale(String situationFamiliale) { this.situationFamiliale = situationFamiliale; }
    public void setConjointNom(String conjointNom) { this.conjointNom = conjointNom; }
    public void setConjointFonction(String conjointFonction) { this.conjointFonction = conjointFonction; }
    public void setNombreEnfants(String nombreEnfants) { this.nombreEnfants = nombreEnfants; }
    public void setAdressePersonnelle(String adressePersonnelle) { this.adressePersonnelle = adressePersonnelle; }
    public void setAdressePrecedente(String adressePrecedente) { this.adressePrecedente = adressePrecedente; }
    public void setVille(String ville) { this.ville = ville; }
    public void setOrganisme(String organisme) { this.organisme = organisme; }
    public void setServiceEmployeur(String serviceEmployeur) { this.serviceEmployeur = serviceEmployeur; }
    public void setFonction(String fonction) { this.fonction = fonction; }
    public void setDirection(String direction) { this.direction = direction; }
    public void setEmployesPrecedents(String employesPrecedents) { this.employesPrecedents = employesPrecedents; }
    public void setPassportNumber(String passportNumber) { this.passportNumber = passportNumber; }
    public void setPassportEmisA(String passportEmisA) { this.passportEmisA = passportEmisA; }
    public void setPermisNumber(String permisNumber) { this.permisNumber = permisNumber; }
    public void setPermisEmisA(String permisEmisA) { this.permisEmisA = permisEmisA; }
    public void setPermisPortArme(String permisPortArme) { this.permisPortArme = permisPortArme; }
    public void setServiceMilitaire(String serviceMilitaire) { this.serviceMilitaire = serviceMilitaire; }
    public void setNiveauInstruction(String niveauInstruction) { this.niveauInstruction = niveauInstruction; }
    public void setEcole(String ecole) { this.ecole = ecole; }
    public void setAppartenances(String appartenances) { this.appartenances = appartenances; }
    public void setPartiPolitique(String partiPolitique) { this.partiPolitique = partiPolitique; }
    public void setSyndicat(String syndicat) { this.syndicat = syndicat; }
    public void setAssociation(String association) { this.association = association; }
    public void setAntecedents(String antecedents) { this.antecedents = antecedents; }
    public void setDatesMotifs(String datesMotifs) { this.datesMotifs = datesMotifs; }
    public void setObjetAutorisation(String objetAutorisation) { this.objetAutorisation = objetAutorisation; }
    public void setSignature(String signature) { this.signature = signature; }
    public void setZones(String zones) { this.zones = zones; }
    public void setPortes(List<String> portes) { this.portes = portes; }
    public void setSecteur(List<String> secteur) { this.secteur = secteur; }
    public void setDateExpiration(LocalDate dateExpiration) { this.dateExpiration = dateExpiration; }
    public void setDateNaissance(LocalDate dateNaissance) { this.dateNaissance = dateNaissance; }
    public void setDateRecrutement(LocalDate dateRecrutement) { this.dateRecrutement = dateRecrutement; }
    public void setDateExpirationPassport(LocalDate dateExpirationPassport) { this.dateExpirationPassport = dateExpirationPassport; }
    public void setDateDebutPassport(LocalDate dateDebutPassport) { this.dateDebutPassport = dateDebutPassport; }
    public void setDateDebutPermis(LocalDate dateDebutPermis) { this.dateDebutPermis = dateDebutPermis; }
    public void setCnieFileUrl(String cnieFileUrl) { this.cnieFileUrl = cnieFileUrl; }
    public void setPhotoFileUrl(String photoFileUrl) { this.photoFileUrl = photoFileUrl; }
    public void setCnieFilePublicId(String cnieFilePublicId) { this.cnieFilePublicId = cnieFilePublicId; }
    public void setPhotoFilePublicId(String photoFilePublicId) { this.photoFilePublicId = photoFilePublicId; }
    public void setStatus(DemandeStatus status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public DemandeStatus getStatusDirecteur() {
        return statusDirecteur;
    }

    public void setStatusDirecteur(DemandeStatus statusDirecteur) {
        this.statusDirecteur = statusDirecteur;
    }

    public DemandeStatus getStatusCorrespondant() {
        return statusCorrespondant;
    }

    public void setStatusCorrespondant(DemandeStatus statusCorrespondant) {
        this.statusCorrespondant = statusCorrespondant;
    }

    public String getSignatureDirecteur() {
        return signatureDirecteur;
    }

    public void setSignatureDirecteur(String signatureDirecteur) {
        this.signatureDirecteur = signatureDirecteur;
    }

    public String getSignatureCorrespondant() {
        return signatureCorrespondant;
    }

    public void setSignatureCorrespondant(String signatureCorrespondant) {
        this.signatureCorrespondant = signatureCorrespondant;
    }
}
