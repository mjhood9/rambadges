import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../assets/styles/main.css";
import { jwtDecode } from "jwt-decode";
import SignaturePad from "../components/layout/SignaturePad";

const DirecteurValidation = () => {
    const { id } = useParams();

    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRefuseModal, setShowRefuseModal] = useState(false);
    const [demande, setDemande] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [closing, setClosing] = useState(false);
    const [laissezPasser, setLaissezPasser] = useState(null);

    const [commentaireRefus, setCommentaireRefus] = useState("");
    const [commentaires, setCommentaires] = useState([]);
    const [users, setUsers] = useState([]);

    const token = localStorage.getItem("token");
    const decoded = token ? jwtDecode(token) : null;
    const userId = decoded ? Number(decoded.sub) : null;

    const [signatureDirecteur, setSignatureDirecteur] = useState(null);
    const [signatureError, setSignatureError] = useState("");

    const handleClose = (type) => {
        setClosing(true);

        setTimeout(() => {
            if (type === "accept") {
                setShowAcceptModal(false);
            } else if (type === "refuse") {
                setShowRefuseModal(false);
            }

            setClosing(false);
        }, 300);
    };
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
        const fetchDemande = async () => {
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

                // ✅ laissez-passer (may be null)
                const lpData = resLaissezPasser.data;

                setLaissezPasser(Array.isArray(lpData) ? lpData[0] : lpData || null);

            } catch (err) {
                console.error(err);
                setError("Erreur lors du chargement des détails");
            } finally {
                setLoading(false);
            }
        };

        fetchDemande();
    }, [id]);

    const usersMap = users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
    }, {});

    const handleAccept = async () => {
        try {
            await axios.put(
                `http://localhost:8080/api/demandes/${id}/status`,
                {
                    statusDirecteur: "APPROUVEE",
                    statusCorrespondant: "EN_ATTENTE",
                    commentaire: "",
                    userId: userId,
                    signatureDirecteur: signatureDirecteur
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setShowAcceptModal(false);
            navigate("/directeur/demandes");
        } catch (err) {
            console.error(err);
        }
    };

    const handleRefuse = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("token");

            // 1. update status
            await axios.put(
                `http://localhost:8080/api/demandes/${id}/status`,
                {
                    statusDirecteur: "REJETEE",
                    commentaire: commentaireRefus,
                    userId: userId,
                    status: "REJETEE"
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // 2. save commentaire separately
            await axios.post(
                `http://localhost:8080/api/commentaires`,
                {
                    content: commentaireRefus,
                    userId: userId,
                    demandeId: id
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setShowRefuseModal(false);
            navigate("/directeur/demandes");

        } catch (err) {
            console.error(err);
        }
    };

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
                <title>Directeur RAM Badges | Valider Le Demande</title>
            </Helmet>
            <div className="background">
                <div className="overlay">
                    <div
                        className="back-arrow"
                        onClick={() => navigate("/directeur/demandes")}
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
                                <div className="summary-box" style={{display:"flex", justifyContent:"space-between", gap: "40px"}}>
                                    <div>
                                        <p><strong>Prénom:</strong> {demande.firstName}</p>
                                        <p><strong>Nom:</strong> {demande.lastName}</p>
                                        <p><strong>Nationalité:</strong> {demande.nationalite || "—"}</p>
                                        <p><strong>N° CNIE:</strong> {demande.cnie || "—"}</p>
                                        <p><strong>Date d'expiration :</strong> {demande.dateExpiration ? new Date(demande.dateExpiration).toLocaleDateString('fr-FR') : "—"}</p>
                                    </div>
                                    <div>
                                        <p><strong>Organisme Employeur:</strong> {demande.organisme || "—"}</p>
                                        <p><strong>Service Employeur:</strong> {demande.serviceEmployeur || "—"}</p>
                                        <p><strong>Fonction:</strong> {demande.fonction|| "—"}</p>
                                        <p><strong>Date de Recrutement:</strong> {demande.dateRecrutement ? new Date(demande.dateRecrutement).toLocaleDateString('fr-FR') : "—"}</p>
                                        <p><strong>Direction:</strong> {demande.direction|| "—"}</p>
                                        <p><strong>Emploies precedents:</strong> {demande.employesPrecedents|| "—"}</p>
                                    </div>
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
                            {demande.statusDirecteur === "EN_ATTENTE" && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        gap: "12px",
                                        marginTop: "20px",
                                    }}
                                >
                                    <button
                                        onClick={() => setShowAcceptModal(true)}
                                        style={{
                                            padding: "10px 16px",
                                            borderRadius: "8px",
                                            border: "none",
                                            backgroundColor: "#EFEFEF",
                                            color: "#00a213",
                                            cursor: "pointer",
                                            fontWeight: "600",
                                            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                                        }}
                                    >
                                        Accepter
                                    </button>

                                    <button
                                        onClick={() => setShowRefuseModal(true)}
                                        style={{
                                            padding: "10px 16px",
                                            borderRadius: "8px",
                                            border: "none",
                                            backgroundColor: "#efefef",
                                            color: "#c20831",
                                            cursor: "pointer",
                                            fontWeight: "600",
                                            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                                        }}
                                    >
                                        Refuser
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {showAcceptModal && (
                <div className="modal-overlay" onClick={() => handleClose("accept")}>
                    <div className={`modal-content ${closing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => handleClose("accept")}>×</button>
                        <h2>Confirmer la validation</h2>
                        <p style={{ textAlign: 'center', fontSize: '14px', marginTop: '25px' }}>
                            <label style={{fontWeight: '400'}}>Si vous confirmez, cet élément ne sera plus accessible.</label>
                        </p>
                        <div style={{ marginTop: "20px" }}>
                            <label className="lbl-entite">Signature Directeur</label>

                            <SignaturePad
                                required
                                onChange={(sig) => {
                                    setSignatureDirecteur(sig);
                                    setSignatureError("");
                                }}
                            />

                            {signatureError && (
                                <span style={{ color: "#e53935", fontSize: "12px" }}>
                        {signatureError}
                    </span>
                            )}
                        </div>
                        <div className="modal-actions1">
                            <button type="button" className="cancel-btn" onClick={() => handleClose("accept")}>
                                <i className="fa-solid fa-arrow-left"/> Annuler
                            </button>
                            <button className="submit-btn" onClick={handleAccept}>
                                Confirmer <i className="fa-solid fa-arrow-right"/>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showRefuseModal && (
                <div className="modal-overlay" onClick={() => handleClose("refuse")}>
                    <div
                        className={`modal-content ${closing ? "closing" : ""}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="close-btn" onClick={() => handleClose("refuse")}>
                            ×
                        </button>

                        <h2>Raison du refus</h2>

                        <form className="modal-form" onSubmit={handleRefuse}>
                            <label className="lbl-entite">
                                Ajouter la raison du refus
                            </label>

                            <input
                                type="text"
                                placeholder="Saisissez ici"
                                value={commentaireRefus}
                                onChange={(e) => setCommentaireRefus(e.target.value)}
                                required
                            />

                            <div className="modal-actions1">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => handleClose("refuse")}
                                >
                                    <i className="fa-solid fa-arrow-left" /> Annuler
                                </button>

                                <button type="submit" className="submit-btn">
                                    Confirmer <i className="fa-solid fa-arrow-right" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
export default DirecteurValidation;