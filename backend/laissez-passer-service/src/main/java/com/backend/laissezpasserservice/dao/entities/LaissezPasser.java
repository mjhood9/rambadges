package com.backend.laissezpasserservice.dao.entities;

import com.backend.laissezpasserservice.dao.enums.LaissezPasserStatut;
import com.fasterxml.jackson.annotation.JsonAutoDetect;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "laissez_passer")
@JsonAutoDetect(fieldVisibility = JsonAutoDetect.Visibility.ANY)
public class LaissezPasser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "demande_id")
    private Long demandeId;

    @Column(name = "num_laissez_passer", unique = true)
    private String numLaissezPasser;

    @Column(name = "date_depot_onda")
    private LocalDate dateDepotOnda;

    @Column(name = "date_delivrance")
    private LocalDate dateDelivrance;

    @Column(name = "date_expiration")
    private LocalDate dateExpiration;

    @Lob
    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Lob
    @Column(name = "image_public_id", columnDefinition = "TEXT")
    private String imagePublicId;

    @Lob
    @Column(name = "quitus_paiement_url", columnDefinition = "TEXT")
    private String quitusPaiementUrl;

    @Lob
    @Column(name = "quitus_paiement_public_id", columnDefinition = "TEXT")
    private String quitusPaiementPublicId;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut")
    private LaissezPasserStatut statut;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDemandeId() {
        return demandeId;
    }

    public void setDemandeId(Long demandeId) {
        this.demandeId = demandeId;
    }

    public String getNumLaissezPasser() {
        return numLaissezPasser;
    }

    public void setNumLaissezPasser(String numLaissezPasser) {
        this.numLaissezPasser = numLaissezPasser;
    }

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

    public LaissezPasserStatut getStatut() {
        return statut;
    }

    public void setStatut(LaissezPasserStatut statut) {
        this.statut = statut;
    }
}
