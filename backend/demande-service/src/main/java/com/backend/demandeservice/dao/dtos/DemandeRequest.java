package com.backend.demandeservice.dao.dtos;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

public class DemandeRequest {

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
    private String signature;
    private String zones;
    private List<String> portes;
    private List<String> secteur;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateExpiration;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateNaissance;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateRecrutement;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateExpirationPassport;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateDebutPassport;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateDebutPermis;

    // Files as Base64
    private String cnieFile;
    private String photoFile;

    // Getters
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
    public String getCnieFile() { return cnieFile; }
    public String getPhotoFile() { return photoFile; }

    // Setters
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
    public void setCnieFile(String cnieFile) { this.cnieFile = cnieFile; }
    public void setPhotoFile(String photoFile) { this.photoFile = photoFile; }
}
