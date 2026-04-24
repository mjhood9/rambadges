package com.backend.demandeservice.dao.dtos;

import com.backend.demandeservice.dao.enums.DemandeStatus;

public class UpdateStatusRequest {
    private DemandeStatus status;
    private DemandeStatus statusDirecteur;
    private String signatureDirecteur;
    private DemandeStatus statusCorrespondant;
    private String signatureCorrespondant;
    private Long userId;

    public DemandeStatus getStatus() {
        return status;
    }

    public void setStatus(DemandeStatus status) {
        this.status = status;
    }

    public DemandeStatus getStatusDirecteur() {
        return statusDirecteur;
    }

    public void setStatusDirecteur(DemandeStatus statusDirecteur) {
        this.statusDirecteur = statusDirecteur;
    }


    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
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
