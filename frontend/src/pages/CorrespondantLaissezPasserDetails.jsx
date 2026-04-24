import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../assets/styles/main.css";

const CorrespondantLaissezPasserDetails = () => {
    const { id } = useParams();

    const [demande, setDemande] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [laissezPasser, setLaissezPasser] = useState(null);

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

                // 1. FETCH LAISSEZ-PASSER BY ID
                const resLP = await axios.get(
                    `http://localhost:8080/api/laissezpasser/${id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                const lp = resLP.data;
                setLaissezPasser(lp);

                // 2. FETCH DEMANDE USING demandeId FROM LP
                let demandeData = null;

                if (lp?.demandeId) {
                    const [resDemande, resComments] = await Promise.all([
                        axios.get(`http://localhost:8080/api/demandes/${lp.demandeId}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        })
                    ]);

                    demandeData = resDemande.data;
                }

                // 4. SET STATE
                setDemande(demandeData);

            } catch (err) {
                console.error(err);
                setError("Erreur lors du chargement des détails");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading)
        return (
            <div className="circle-loader-container">
                <div className="circle-loader"></div>
                <p>Chargement...</p>
            </div>
        );

    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (!demande) return <p>Aucune donnée</p>;

    const getStatusConfig = (status) => {
        switch (status) {
            case "EXPIRE":
                return { label: "Expiré", className: "badge-attent" };
            case "ACTIF":
                return { label: "Actif", className: "badge-approve" };
            case "ANNULE":
                return { label: "Annulé", className: "badge-reject" };
            default:
                return { label: "-", className: "" };
        }
    };
    const status = getStatusConfig(laissezPasser?.statut);

    return (
        <>
            <Helmet>
                <title>Correspondant de Sûreté RAM Badges | Laissez-Passer Détails</title>
            </Helmet>
            <div className="background">
                <div className="overlay">
                    <div
                        className="back-arrow"
                        onClick={() => navigate("/correspondantdesurete/laissez-passer")}
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                    </div>
                    <div className="container">
                        <div className="demande-card">
                            <div className="card-top">
                                <div className="card-info">
                                    <span className="card-label">Laissez-Passer du</span>
                                    <span className="card-value">{demande
                                        ? `${demande.firstName} ${demande.lastName}`
                                        : "-"}</span>
                                </div>
                                <div className="card-info">
                                    <span className="card-label">N° du Laissez-Passer</span>
                                    <span className="card-value">{laissezPasser?.numLaissezPasser || "—"}</span>
                                </div>
                                <div className="card-info">
                                    <span className="card-label">Direction</span>
                                    <span className="card-value">{demande.direction}</span>
                                </div>
                                <span className={`status-badge ${status.className}`}>
    {status.label}
</span>
                                <div className="card-info">
                                    <span className="card-label">Valable jusqu'au </span>
                                    <span className="card-value">
                        {new Date(laissezPasser?.dateExpiration).toLocaleDateString('fr-FR')}
                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="step-form">
                            <div className="summary-step1">
                                <div className="summary-box">
                                    <h5>Informations personnelles</h5>
                                    <p><strong>Prénom:</strong> {demande.firstName}</p>
                                    <p><strong>Nom:</strong> {demande.lastName}</p>
                                    <p><strong>Nationalité:</strong> {demande.nationalite || "—"}</p>
                                    <p><strong>N° CNIE:</strong> {demande.cnie || "—"}</p>
                                    <p><strong>Date d'expiration :</strong> {demande.dateExpiration ? new Date(demande.dateExpiration).toLocaleDateString('fr-FR') : "—"}</p>
                                </div>

                                <div className="summary-box">
                                    <h5>Zones d'accès</h5>
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
                                {/* PHOTO LAISSEZ-PASSER */}
                                {laissezPasser?.imageUrl && (
                                    <div className="file-card">

                                        <button
                                            className="download-btn"
                                            onClick={() => downloadFile(laissezPasser?.imageUrl, "photolaissezpasser.jpg")}
                                        >
                                            <i className="bx bx-arrow-to-bottom" />
                                        </button>

                                        <div className="file-preview">
                                            <img
                                                src={laissezPasser?.imageUrl}
                                                alt="Photo"
                                            />
                                        </div>

                                        <div className="file-footer">
                                            <p className="file-name">
                                                Badge Laissez-Passer
                                            </p>
                                        </div>

                                    </div>
                                )}
                                {/* QUITUS DE PAIEMENT */}
                                {laissezPasser?.quitusPaiementUrl && (
                                    <div className="file-card">

                                        <button
                                            className="download-btn"
                                            onClick={() => downloadCnie(laissezPasser?.quitusPaiementUrl)}
                                        >
                                            <i className="bx bx-arrow-to-bottom" />
                                        </button>

                                        <div className="file-preview">
                                            <i className="fa-solid fa-file-pdf"></i>
                                        </div>

                                        <div className="file-footer">
                                            <p className="file-name">
                                                Quitus de Paiement
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
export default CorrespondantLaissezPasserDetails;