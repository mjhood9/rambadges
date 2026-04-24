package com.backend.laissezpasserservice.dao.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class LaissezPasserUpdateRequest {

    private String numLaissezPasser;
    private LocalDate dateDepotOnda;
    private LocalDate dateDelivrance;
    private LocalDate dateExpiration;

    private String imageUrl;
    private String imagePublicId;

    private String quitusPaiementUrl;
    private String quitusPaiementPublicId;

    private String statut;

    public LocalDate getDateDepotOnda() {
        return dateDepotOnda;
    }

    public void setDateDepotOnda(LocalDate dateDepotOnda) {
        this.dateDepotOnda = dateDepotOnda;
    }

    public LocalDate getDateDelivrance() {
        return dateDelivrance;
    }

    public void setDateDelivrance(LocalDate dateDelivrance) {
        this.dateDelivrance = dateDelivrance;
    }

    public LocalDate getDateExpiration() {
        return dateExpiration;
    }

    public void setDateExpiration(LocalDate dateExpiration) {
        this.dateExpiration = dateExpiration;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getImagePublicId() {
        return imagePublicId;
    }

    public void setImagePublicId(String imagePublicId) {
        this.imagePublicId = imagePublicId;
    }

    public String getQuitusPaiementUrl() {
        return quitusPaiementUrl;
    }

    public void setQuitusPaiementUrl(String quitusPaiementUrl) {
        this.quitusPaiementUrl = quitusPaiementUrl;
    }

    public String getQuitusPaiementPublicId() {
        return quitusPaiementPublicId;
    }

    public void setQuitusPaiementPublicId(String quitusPaiementPublicId) {
        this.quitusPaiementPublicId = quitusPaiementPublicId;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public String getNumLaissezPasser() {
        return numLaissezPasser;
    }

    public void setNumLaissezPasser(String numLaissezPasser) {
        this.numLaissezPasser = numLaissezPasser;
    }

    // getters & setters
}