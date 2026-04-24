import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../assets/styles/main.css";

const DemandeurDetails = () => {
    const { id } = useParams();

    const [demande, setDemande] = useState(null);
    const [commentaires, setCommentaires] = useState([]);
    const [laissezPasser, setLaissezPasser] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const downloadFile = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();

            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename || "file";
            document.body.appendChild(link);
            link.click();

            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download failed", error);
        }
    };

    const downloadCnie = (url) => {
        const downloadUrl = url.replace(
            "/upload/",
            "/upload/fl_attachment,f_pdf/"
        );

        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = "document.pdf"; // 🔥 important
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const token = localStorage.getItem("token");

                const [resDemande, resComments, resUsers, resLaissezPasser] = await Promise.all([
                    axios.get(`http://localhost:8080/api/demandes/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),

                    axios.get(`http://localhost:8080/api/commentaires/demande/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),

                    axios.get(`http://localhost:8080/api/users`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get(`http://localhost:8080/api/laissezpasser`, {
                        params: { demandeId: id },
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                ]);

                setDemande(resDemande.data);
                setCommentaires(resComments.data);
                setUsers(resUsers.data);
                const lpData = resLaissezPasser.data;

                setLaissezPasser(Array.isArray(lpData) ? lpData[0] : lpData || null);

            } catch (err) {
                console.error(err);
                setError("Erreur lors du chargement des détails");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const usersMap = users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
    }, {});

    if (loading) return <p>Chargement...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (!demande) return <p>Aucune donnée</p>;

    const getStatusLabel = (status) => {
        switch (status) {
            case "EN_ATTENTE":
                return "EN ATTENTE";
            case "APPROUVEE":
                return "VALIDÉ";
            case "REJETEE":
                return "REFUSÉ";
            default:
                return "-";
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "EN_ATTENTE":
                return "badge-attent";
            case "APPROUVEE":
                return "status-approuvee";
            case "REJETEE":
                return "status-rejetee";
            default:
                return "badge-secondary";
        }
    };

    const validationSteps = demande
        ? [
            {
                label: "DIRECTEUR",
                status: demande.statusDirecteur
            },
            {
                label: "CORRESPONDANT DE SÛRETÉ",
                status: demande.statusCorrespondant
            },
            {
                label: "DÉPÔT ONDA",
                date: laissezPasser?.dateDepotOnda
            },
            {
                label: "DÉLIVRANCE DE LAISSEZ-PASSER",
                date: laissezPasser?.dateDelivrance
            }
        ]
        : [];

    return (
        <>
            <Helmet>
                <title>Détails Demande</title>
            </Helmet>

            <div className="background">
                <div className="overlay">
                    <div
                        className="back-arrow"
                        onClick={() => navigate("/demandeur/dashboard")}
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                    </div>
                    <div className="container">
                        <div className="demande-card">
                            <div className="card-top">
                                <div className="card-info">
                                    <span className="card-label">N° de Demande</span>
                                    <span className="card-value">{demande.id}</span>
                                </div>
                                <div className="card-info">
                                    <span className="card-label">Direction</span>
                                    <span className="card-value">{demande.direction}</span>
                                </div>
                                <span className={`status-badge ${getStatusClass(demande.status)}`}>
                                {getStatusLabel(demande.status)}
                            </span>
                                <div className="card-info">
                                    <span className="card-label">Date de demande</span>
                                    <span className="card-value">
                        {new Date(demande.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                                </div>
                            </div>

                            <div className="card-bottom">
                                <span className="validations-label">Validations →</span>

                                <div className="validation-steps">

                                    {validationSteps.map((step, index) => (
                                        <div key={index} className="val-step">

                                            {/* LABEL */}
                                            <span
                                                className={`val-label ${step.status || step.date ? "active" : ""}`}
                                            >
                {step.label}
            </span>

                                            {/* STATUS BADGE */}
                                            {step.status && (
                                                <span className={`status-badge ${getStatusClass(step.status)}`}>
                    {getStatusLabel(step.status)}
                </span>
                                            )}

                                            {/* DATE DISPLAY */}
                                            {step.date && (
                                                <span className="card-value">
        {new Date(step.date).toLocaleDateString('fr-FR')}
    </span>
                                            )}

                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="step-form">
                            <h5>Informations personnelles</h5>
                            <div className="summary-step1">
                                <div className="summary-box">
                                    <p><strong>Prénom:</strong> {demande.firstName}</p>
                                    <p><strong>Nom:</strong> {demande.lastName}</p>
                                    <p><strong>Nationalité:</strong> {demande.nationalite || "—"}</p>
                                    <p><strong>N° CNIE:</strong> {demande.cnie || "—"}</p>
                                    <p><strong>Date d'expiration :</strong> {demande.dateExpiration ? new Date(demande.dateExpiration).toLocaleDateString('fr-FR') : "—"}</p>
                                    <br/>
                                    <p><strong>Date de Naissance:</strong> {demande.dateNaissance ? new Date(demande.dateNaissance).toLocaleDateString('fr-FR') : "—"}</p>
                                    <p><strong>Lieu de Naissance:</strong> {demande.lieuNaissance || "—"}</p>
                                    <br/>
                                    <p><strong>Fils(le) de:</strong> {demande.filsDe || "—"}</p>
                                    <p><strong>Ben:</strong> {demande.ben || "—"}</p>
                                    <p><strong>Et de:</strong> {demande.etDe || "—"}</p>
                                    <p><strong>Bent:</strong> {demande.bent || "—"}</p>
                                </div>

                                <div className="summary-box">
                                    <p><strong>Situation Familiale:</strong> {demande.situationFamiliale || "—"}</p>
                                    <p><strong>Nom de conjoint :</strong> {demande.conjointNom || "—"}</p>
                                    <p><strong>Fonction de conjoint :</strong> {demande.conjointFonction || "—"}</p>
                                    <p><strong>Nombre d'enfant :</strong> {demande.nombreEnfants || "—"}</p>
                                    <p><strong>Adresse Personnelle :</strong> {demande.adressePersonnelle || "—"}</p>
                                    <p><strong>Adresse Precedente :</strong> {demande.adressePrecedente || "—"}</p>
                                    <p><strong>Ville :</strong> {demande.ville || "—"}</p>
                                </div>

                                <div className="summary-box">
                                    <p><strong>N° Passport:</strong> {demande.passportNumber || "—"}</p>
                                    <p><strong>Date d'expiration:</strong> {demande.dateExpirationPassport ? new Date(demande.dateExpirationPassport).toLocaleDateString('fr-FR') : "—"}</p>
                                    <p><strong>Emis Le:</strong> {demande.dateDebutPassport
                                        ? new Date(demande.dateDebutPassport).toLocaleDateString('fr-FR')
                                        : "—"}</p>
                                    <p><strong>Emis A:</strong> {demande.passportEmisA|| "—"}</p>
                                    <br/>
                                    <p><strong>Permis de conduire N°:</strong> {demande.permisNumber || "—"}</p>
                                    <p><strong>Emis Le:</strong> {demande.dateDebutPermis ? new Date(demande.dateDebutPermis).toLocaleDateString('fr-FR') : "—"}</p>
                                    <p><strong>Emis A:</strong> {demande.permisEmisA|| "—"}</p>
                                    <br/>
                                    <p><strong>Permis du porte d'arme:</strong> {demande.permisPortArme || "—"}</p>
                                    <p><strong>Service militaire:</strong> {demande.serviceMilitaire|| "—"}</p>
                                </div>
                                <div className="summary-box">
                                    <p><strong>Organisme Employeur:</strong> {demande.organisme || "—"}</p>
                                    <p><strong>Service Employeur:</strong> {demande.serviceEmployeur || "—"}</p>
                                    <p><strong>Fonction:</strong> {demande.fonction|| "—"}</p>
                                    <p><strong>Date de Recrutement:</strong> {demande.dateRecrutement ? new Date(demande.dateRecrutement).toLocaleDateString('fr-FR') : "—"}</p>
                                    <p><strong>Direction:</strong> {demande.direction|| "—"}</p>
                                    <p><strong>Emploies precedents:</strong> {demande.employesPrecedents|| "—"}</p>
                                </div>
                                <div className="summary-box">
                                    <p><strong>Niveau d'instruction:</strong> {demande.niveauInstruction || "—"}</p>
                                    <p><strong>Etablissements scolaires frequents:</strong> {demande.ecole || "—"}</p>
                                    <br/>
                                    <p><strong>Appartenances:</strong> {demande.appartenances|| "—"}</p>
                                    <p><strong>Parti politique:</strong> {demande.partiPolitique|| "—"}</p>
                                    <p><strong>Syndicat:</strong> {demande.syndicat|| "—"}</p>
                                    <p><strong>Association:</strong> {demande.association|| "—"}</p>
                                    <p><strong>Antécédents judiciaires:</strong> {demande.antecedents|| "—"}</p>
                                    <p><strong>Dates et motifs:</strong> {demande.datesMotifs|| "—"}</p>
                                </div>

                            </div>
                            <h5>Zones d'accès</h5>
                            <div className="summary-step1">
                                <div className="summary-box">
                                    <p><strong>Objet de l'autorisation d'accès: </strong> {demande.objetAutorisation || "—"}</p>
                                    <br/>
                                    <p><strong>Portes d'accès demandées:</strong>
                                        {demande.portes?.length > 0 ? (
                                            demande.portes.map((p, i) => (
                                                <span key={i} className="badge-details">
                                                    {p}
                                                </span>
                                            ))
                                        ) : (
                                            "—"
                                        )}</p>
                                    <br/>
                                    <p><strong>Zones de Sûreté Demandées:</strong> {demande.zones ? (
                                        <span className="badge-details">{demande.zones}</span>
                                    ) : (
                                        "—"
                                    )}</p>
                                    <br/>
                                    <p><strong>Secteurs de sûreté:</strong> {demande.secteur?.length > 0 ? (
                                        demande.secteur.map((s, i) => (
                                            <span key={i} className="badge-details">
                {s}
            </span>
                                        ))
                                    ) : (
                                        "—"
                                    )}</p>
                                </div>

                                <div className="summary-box">
                                    <h5>Signature du concerne</h5>
                                    {demande.signature ? (
                                        <img
                                            src={demande.signature}
                                            alt="Signature"
                                            style={{
                                                width: "100%",
                                                maxHeight: "150px",
                                                border: "1px solid #ddd",
                                                borderRadius: "8px"
                                            }}
                                        />
                                    ) : (
                                        <p>Non signée ❌</p>
                                    )}
                                </div>
                            </div>
                            {commentaires.length > 0 && (
                                <>
                                    <h5>Commentaires</h5>

                                    <div className="summary-step1">
                                        <div className="summary-box">
                                            {commentaires.map((c, i) => {
                                                const user = usersMap?.[c.userId];

                                                return (
                                                    <p key={i}>
                                                        <strong>
                                                            {user
                                                                ? `${user.firstName} ${user.lastName}`
                                                                : "Utilisateur inconnu"}
                                                        </strong>
                                                        {" : "}
                                                        {c.content}
                                                    </p>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                            <h5>Fichiers joints</h5>

                            <div className="files-container">

                                {/* CNIE / PDF */}
                                {demande.cnieFileUrl && (
                                    <div className="file-card">

                                        <button
                                            className="download-btn"
                                            onClick={() => downloadCnie(demande.cnieFileUrl)}
                                        >
                                            <i className="bx bx-arrow-to-bottom" />
                                        </button>

                                        <div className="file-preview">
                                            <i className="fa-solid fa-file-pdf"></i>
                                        </div>

                                        <div className="file-footer">
                                            <p className="file-name">
                                                CNIE / Passport
                                            </p>
                                        </div>

                                    </div>
                                )}

                                {/* PHOTO */}
                                {demande.photoFileUrl && (
                                    <div className="file-card">

                                        <button
                                            className="download-btn"
                                            onClick={() => downloadFile(demande.photoFileUrl, "photo.jpg")}
                                        >
                                            <i className="bx bx-arrow-to-bottom" />
                                        </button>

                                        <div className="file-preview">
                                            <img
                                                src={demande.photoFileUrl}
                                                alt="Photo"
                                            />
                                        </div>

                                        <div className="file-footer">
                                            <p className="file-name">
                                                Photo
                                            </p>
                                        </div>

                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DemandeurDetails;