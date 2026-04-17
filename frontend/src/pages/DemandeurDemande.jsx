import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import "../assets/styles/main.css";
import 'react-datepicker/dist/react-datepicker.css';
import CustomDatePicker from "../components/layout/CustomDatePicker";
import {jwtDecode} from "jwt-decode";
import SignaturePad from "../components/layout/SignaturePad";
import { useNavigate } from "react-router-dom";

const DemandeurDemande = () => {
    const [showModal, setShowModal] = useState(true); // modal shows on mount
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [closing, setClosing] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [entites, setEntites] = useState([]);
    const [isImportantAccepted, setIsImportantAccepted] = useState(false);
    const [currentUser, setCurrentUser] = useState({
        id: null,
        firstName: "",
        lastName: ""
    });

    const navigate = useNavigate();

    const validateForm = () => {
        const requiredFields = [
            "nationalite",
            "cnie",
            "lieuNaissance",
            "filsDe",
            "ben",
            "etDe",
            "bent",
            "situationFamiliale",
            "adressePersonnelle",
            "ville",
            "serviceEmployeur",
            "fonction",
            "direction",
            "objetAutorisation",
            "signature"
        ];

        for (let field of requiredFields) {
            if (!formData[field] || formData[field].length === 0) {
                return false;
            }
        }

        if (!formData.portes.length || !formData.secteur.length || !formData.zones.length) {
            return false;
        }

        return true;
    };
    // Close modal with animation
    const handleClose = () => {
        setClosing(true);
        setTimeout(() => {
            setShowModal(false);
            setClosing(false);
        }, 400);
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        navigate("/demandeur/dashboard");
    };

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const decoded = jwtDecode(token);

                // ✅ directly use userId from JWT
                const userId = decoded.userId || decoded.sub;

                if (!userId) {
                    console.error("No userId found in token");
                    return;
                }

                const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });

                if (!response.ok) throw new Error("Failed to fetch user");

                const user = await response.json();

                setCurrentUser({
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName
                });

                setFormData((prev) => ({
                    ...prev,
                    userId: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName
                }));

            } catch (error) {
                console.error("Error loading current user:", error);
            }
        };

        fetchCurrentUser();

        const fetchEntites = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch("http://localhost:8080/api/entites", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });

                const data = await res.json();
                setEntites(data);
            } catch (error) {
                console.error("Error fetching entites:", error);
            }
        };

        fetchEntites();
    }, []);

    const steps = [
        { number: 1, label: 'Informations personnelles' },
        { number: 2, label: "Zones d'accès" },
        { number: 3, label: 'Documents requis' },
        { number: 4, label: 'Confirmation' }
    ];

    const visibleSteps = steps.slice(0, 3);

    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState({
        userId: null,
        firstName: "",
        lastName: "",
        nationalite: "",
        cnie: "",
        lieuNaissance: "",
        filsDe: "",
        ben: "",
        etDe: "",
        bent: "",
        situationFamiliale: "",
        conjointNom: "",
        conjointFonction: "",
        nombreEnfants: "",
        adressePersonnelle: "",
        adressePrecedente: "",
        ville: "",
        organisme:"Royal Air Maroc",
        serviceEmployeur: "",
        fonction: "",
        direction: "",
        employesPrecedents: "",
        passportNumber: "",
        passportEmisA: "",
        permisNumber: "",
        permisEmisA: "",
        permisPortArme: "",
        serviceMilitaire: "",
        niveauInstruction: "",
        ecole: "",
        appartenances: "",
        partiPolitique: "",
        syndicat: "",
        association: "",
        antecedents: "",
        datesMotifs: "",
        objetAutorisation: "",
        zones: [],
        portes: [],
        secteur: [],
        // dates
        dateExpiration: null,
        dateNaissance: null,
        dateRecrutement: null,
        dateExpirationPassport: null,
        dateDebutPassport: null,
        dateDebutPermis: null,

        // files
        cnieFile: null,
        photoFile: null,
        signature:"",
    });
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckbox = (e) => {
        const { name, value, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: checked
                ? [...prev[name], value]
                : prev[name].filter((v) => v !== value)
        }));
    };

    const handleFile = (e) => {
        const { name, files } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: files[0]
        }));
    };
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.readAsDataURL(file);

            reader.onload = () => resolve(reader.result); // base64 string
            reader.onerror = (error) => reject(error);
        });
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            setErrorMessage("Veuillez remplir tous les champs obligatoires.");
            setShowErrorModal(true);
            return;
        }

        try {
            setLoading(true);
            setShowLoadingModal(true);

            const token = localStorage.getItem("token");

            const cnieFileString = formData.cnieFile
                ? await fileToBase64(formData.cnieFile)
                : null;

            const photoFileString = formData.photoFile
                ? await fileToBase64(formData.photoFile)
                : null;

            const payload = {
                ...formData,
                userId: currentUser.id,
                cnieFile: cnieFileString,
                photoFile: photoFileString
            };

            const res = await fetch("http://localhost:8080/api/demandes", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error("Erreur serveur lors de la soumission");
            }

            setShowLoadingModal(false);
            setShowSuccessModal(true);

        } catch (err) {
            console.error(err);

            setShowLoadingModal(false);
            setErrorMessage(err.message || "Erreur inconnue");
            setShowErrorModal(true);

        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="step-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nom <span className="text-danger">*</span></label>
                                <div className="input-wrap">
                                    <input type="text" disabled required value={currentUser.lastName || ""}/>
                                    <i className='bx bx-user' style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '18px' }}></i>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Prénom <span className="text-danger">*</span></label>
                                <div className="input-wrap">
                                    <input type="text" required disabled value={currentUser.firstName || ""}/>
                                    <i className='bx bx-user' style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '18px' }}></i>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Nationalité <span className="text-danger">*</span></label>
                                <div className="input-wrap">
                                    <input type="text" required name="nationalite"
                                           value={formData.nationalite}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>N° Cnie <span className="text-danger">*</span></label>
                                <div className="input-wrap">
                                    <input type="text" required name="cnie"
                                           value={formData.cnie}
                                           onChange={handleChange} />
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="input-wrap">
                                    <CustomDatePicker
                                        label="Date d'expiration"
                                        required
                                        selected={formData.dateExpiration}
                                        onChange={(date) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                dateExpiration: date
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <div className="input-wrap">
                                    <CustomDatePicker
                                        label="Date de Naissance"
                                        required
                                        selected={formData.dateNaissance}
                                        onChange={(date) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                dateNaissance: date
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Lieu de Naissance <span className="text-danger">*</span></label>
                                <div className="input-wrap">
                                    <input type="text" required name="lieuNaissance"
                                           value={formData.lieuNaissance}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                            </div>
                            <div className="form-group">
                            </div>
                            <div className="form-group">
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Fils / Fille de<span className="text-danger">*</span></label>
                                <div className="input-wrap">
                                    <input type="text" required name="filsDe"
                                           value={formData.filsDe}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Ben <span className="text-danger">*</span></label>
                                <div className="input-wrap">
                                    <input type="text" required name="ben"
                                           value={formData.ben}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Et de <span className="text-danger">*</span></label>
                                <div className="input-wrap">
                                    <input type="text" required name="etDe"
                                           value={formData.etDe}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Bent <span className="text-danger">*</span></label>
                                <div className="input-wrap">
                                    <input type="text" required name="bent"
                                           value={formData.bent}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Situation Familiale <span className="text-danger">*</span></label>
                                <div className="select-wrap">
                                    <select onClick={() => setIsOpen(!isOpen)}
                                            onBlur={() => setIsOpen(false)}
                                            name="situationFamiliale" required
                                            value={formData.situationFamiliale}
                                            onChange={handleChange}>
                                        <option value=""></option>
                                        <option value="Célibataire">Célibataire</option>
                                        <option value="Marié(e)">Marié(e)</option>
                                        <option value="Divorcé(e)">Divorcé(e)</option>
                                    </select>
                                    <i className={`bx bx-chevron-down select-arrow ${isOpen ? 'open' : ''}`}></i>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Nom de conjoint</label>
                                <div className="input-wrap">
                                    <input type="text" name="conjointNom"
                                           value={formData.conjointNom}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Fonction de conjoint</label>
                                <div className="input-wrap">
                                    <input type="text" name="conjointFonction"
                                           value={formData.conjointFonction}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Nombre d'enfants</label>
                                <div className="input-wrap">
                                    <input type="text" name="nombreEnfants"
                                           value={formData.nombreEnfants}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Adresse Personnelle <span className="text-danger">*</span></label>
                                <div className="input-wrap">
                                    <input type="text" required name="adressePersonnelle"
                                           value={formData.adressePersonnelle}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Adresse Precedente</label>
                                <div className="input-wrap">
                                    <input type="text" name="adressePrecedente"
                                           value={formData.adressePrecedente}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Ville <span className="text-danger">*</span></label>
                                <div className="input-wrap">
                                    <input type="text" name="ville"
                                           value={formData.ville}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                            </div>
                            <div className="form-group">
                            </div>
                            <div className="form-group">
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Organisme Employeur<span className="text-danger">*</span></label>
                                <div className="input-wrap">
                                    <input type="text" disabled required value={formData.organisme} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Service Employeur <span className="text-danger">*</span></label>
                                <div className="input-wrap">
                                    <input type="text" required name="serviceEmployeur"
                                           value={formData.serviceEmployeur}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Fonction <span className="text-danger">*</span></label>
                                <div className="input-wrap">
                                    <input type="text" required name="fonction"
                                           value={formData.fonction}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="input-wrap">
                                    <CustomDatePicker
                                        label="Date de Recrutement"
                                        required
                                        selected={formData.dateRecrutement}
                                        onChange={(date) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                dateRecrutement: date
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Direction <span className="text-danger">*</span></label>
                                <div className="select-wrap">
                                    <select
                                        onClick={() => setIsOpen(!isOpen)}
                                        onBlur={() => setIsOpen(false)}
                                        name="direction"
                                        required
                                        value={formData.direction}
                                        onChange={handleChange}
                                    >
                                        <option value=""></option>

                                        {entites.map((entite) => (
                                            <option key={entite.id} value={entite.name}>
                                                {entite.name}
                                            </option>
                                        ))}
                                    </select>
                                    <i className={`bx bx-chevron-down select-arrow ${isOpen ? 'open' : ''}`}></i>
                                </div>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Emploies precedents</label>
                                <div className="input-wrap">
                                    <input type="text" name="employesPrecedents"
                                           value={formData.employesPrecedents}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                            </div>

                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>N° Passport</label>
                                <div className="input-wrap">
                                    <input type="text" name="passportNumber"
                                           value={formData.passportNumber}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <CustomDatePicker
                                    label="Date d'expiration"
                                    selected={formData.dateExpirationPassport}
                                    onChange={(date) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            dateExpirationPassport: date
                                        }))
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <CustomDatePicker
                                    label="Emis Le"
                                    selected={formData.dateDebutPassport}
                                    onChange={(date) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            dateDebutPassport: date
                                        }))
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label>Emis A</label>
                                <div className="input-wrap">
                                    <input type="text" name="passportEmisA"
                                           value={formData.passportEmisA}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Permis de conduire N°</label>
                                <div className="input-wrap">
                                    <input type="text" name="permisNumber"
                                           value={formData.permisNumber}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <CustomDatePicker
                                    label="Emis Le"
                                    selected={formData.dateDebutPermis}
                                    onChange={(date) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            dateDebutPermis: date
                                        }))
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label>Emis A</label>
                                <div className="input-wrap">
                                    <input type="text" name="permisEmisA"
                                           value={formData.permisEmisA}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                            </div>
                            <div className="form-group">
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Permis du port d'arme</label>
                                <div className="input-wrap">
                                    <input type="text" name="permisPortArme"
                                           value={formData.permisPortArme}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Service militaire</label>
                                <div className="input-wrap">
                                    <input type="text" name="serviceMilitaire"
                                           value={formData.serviceMilitaire}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                            </div>
                            <div className="form-group">
                            </div>
                            <div className="form-group">
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Niveau d'instruction</label>
                                <div className="input-wrap">
                                    <input type="text" name="niveauInstruction"
                                           value={formData.niveauInstruction}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Etablissements scolaires frequents</label>
                                <div className="input-wrap">
                                    <input type="text" name="ecole"
                                           value={formData.ecole}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Appartenances</label>
                                <div className="input-wrap">
                                    <input type="text" name="appartenances"
                                           value={formData.appartenances}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Partie politique</label>
                                <div className="input-wrap">
                                    <input type="text" name="partiPolitique"
                                           value={formData.partiPolitique}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Syndicat</label>
                                <div className="input-wrap">
                                    <input type="text" name="syndicat"
                                           value={formData.syndicat}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Association</label>
                                <div className="input-wrap">
                                    <input type="text" name="association"
                                           value={formData.association}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Antécédents judiciaires</label>

                                <div className="input-wrap radio-group">
                                    <label className="radio-box">
                                        <input type="radio" name="antecedents" value="oui" checked={formData.antecedents === "oui"}
                                               onChange={handleChange}/>
                                        <span>Oui</span>
                                    </label>

                                    <label className="radio-box">
                                        <input type="radio" name="antecedents" value="non" checked={formData.antecedents === "non"}
                                               onChange={handleChange}/>
                                        <span>Non</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Dates et motifs</label>
                                <div className="input-wrap">
                                    <input type="text" name="datesMotifs"
                                           value={formData.datesMotifs}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="form-group">
                            </div>
                            <div className="form-group">
                            </div>
                            <div className="form-group">
                            </div>
                            <div className="form-group">
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="step-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Objet d'Autorisation d'Accès <span className="text-danger">*</span></label>
                                <div className="input-wrap">
                                    <input type="text" required placeholder="Objet d'Autorisation d'Accès" name="objetAutorisation"
                                           value={formData.objetAutorisation}
                                           onChange={handleChange}/>
                                </div>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Portes d'accès demandées <span className="text-danger">*</span></label>

                                <div className="input-wrap checkbox-group">
                                    <label className="checkbox-box">
                                        <input type="checkbox" required name="portes" value="01" checked={formData.portes.includes("01")}
                                               onChange={handleCheckbox} />
                                        <span>01</span>
                                    </label>

                                    <label className="checkbox-box">
                                        <input type="checkbox" required name="portes" value="02" checked={formData.portes.includes("02")}
                                               onChange={handleCheckbox}/>
                                        <span>02</span>
                                    </label>

                                    <label className="checkbox-box">
                                        <input type="checkbox" required name="portes" value="03" checked={formData.portes.includes("03")}
                                               onChange={handleCheckbox}/>
                                        <span>03</span>
                                    </label>

                                    <label className="checkbox-box">
                                        <input type="checkbox" required name="portes" value="04" checked={formData.portes.includes("04")}
                                               onChange={handleCheckbox}/>
                                        <span>04</span>
                                    </label>

                                    <label className="checkbox-box">
                                        <input type="checkbox" required name="portes" value="05" checked={formData.portes.includes("05")}
                                               onChange={handleCheckbox}/>
                                        <span>05</span>
                                    </label>

                                    <label className="checkbox-box">
                                        <input type="checkbox" required name="portes" value="06" checked={formData.portes.includes("06")}
                                               onChange={handleCheckbox}/>
                                        <span>06</span>
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Zones de Sûreté Demandés <span className="text-danger">*</span></label>

                                <div className="input-wrap radio-group">
                                    <label className="radio-box">
                                        <input type="radio" required name="zones" value="ZSAR" checked={formData.zones === "ZSAR"}
                                               onChange={handleChange}/>
                                        <span>ZSAR</span>
                                    </label>

                                    <label className="radio-box">
                                        <input type="radio" required name="zones" value="ZS" checked={formData.zones === "ZS"}
                                               onChange={handleChange}/>
                                        <span>ZS</span>
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Secteurs de Sûreté <span className="text-danger">*</span></label>

                                <div className="input-wrap checkbox-group">
                                    <label className="checkbox-box">
                                        <input type="checkbox" required name="secteur" value="A" checked={formData.secteur.includes("A")}
                                               onChange={handleCheckbox}/>
                                        <span>A</span>
                                    </label>

                                    <label className="checkbox-box">
                                        <input type="checkbox" required name="secteur" value="B" checked={formData.secteur.includes("B")}
                                               onChange={handleCheckbox}/>
                                        <span>B</span>
                                    </label>

                                    <label className="checkbox-box">
                                        <input type="checkbox" name="secteur" value="C" checked={formData.secteur.includes("C")}
                                               onChange={handleCheckbox}/>
                                        <span>C</span>
                                    </label>

                                    <label className="checkbox-box">
                                        <input type="checkbox" required name="secteur" value="D" checked={formData.secteur.includes("D")}
                                               onChange={handleCheckbox}/>
                                        <span>D</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Signature <span className="text-danger">*</span></label>
                                <small>Signer ici avec votre souris ou votre pavé tactile.</small>
                                <div className="input-wrap">
                                    <SignaturePad required onChange={(sig) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            signature: sig
                                        }))
                                    } />
                                </div>
                            </div>
                            <div className="form-group">
                            </div>
                            <div className="form-group">
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="step-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>CNIE / Passport <span className="text-danger">*</span></label>
                                <div className="upload-wrap">
                                    <input
                                        type="file"
                                        accept=".pdf" required
                                        id="doc-cnie"
                                        name="cnieFile"
                                        hidden
                                        onChange={handleFile}
                                    />
                                    <label htmlFor="doc-cnie" className="upload-btn">
                                        <i className="fa-solid fa-cloud-arrow-down"></i>
                                        Choisir un fichier (pdf)
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Photo <span className="text-danger">*</span></label>
                                <div className="upload-wrap">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="doc-photo" required
                                        name="photoFile"
                                        hidden
                                        onChange={handleFile}                                    />
                                    <label htmlFor="doc-photo" className="upload-btn">
                                        <i className="fa-solid fa-cloud-arrow-down"></i>
                                        Choisir une photo (jpg, png)
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                {formData.cnieFile && (
                                    <p>{formData.cnieFile.name}</p>
                                )}
                            </div>
                            <div className="form-group">
                                {formData.photoFile && (
                                    <p>{formData.photoFile.name}</p>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="step-form">
                        <h3 className="text-center" style={{color: "#C20831", fontSize:"17px"}}>Veuillez vérifier votre saisie avant de soumettre</h3>
                            <h5>Informations personnelles</h5>
                            <div className="summary-step1">
                                <div className="summary-box">
                                    <p><strong>Prénom:</strong> {formData.firstName}</p>
                                    <p><strong>Nom:</strong> {formData.lastName}</p>
                                    <p><strong>Nationalité:</strong> {formData.nationalite || "—"}</p>
                                    <p><strong>N° CNIE:</strong> {formData.cnie || "—"}</p>
                                    <p><strong>Date d'expiration :</strong> {formData.dateExpiration?.toLocaleDateString() || "—"}</p>
                                    <br/>
                                    <p><strong>Date de Naissance:</strong> {formData.dateNaissance?.toLocaleDateString() || "—"}</p>
                                    <p><strong>Lieu de Naissance:</strong> {formData.lieuNaissance || "—"}</p>
                                    <br/>
                                    <p><strong>Fils(le) de:</strong> {formData.filsDe || "—"}</p>
                                    <p><strong>Ben:</strong> {formData.ben || "—"}</p>
                                    <p><strong>Et de:</strong> {formData.etDe || "—"}</p>
                                    <p><strong>Bent:</strong> {formData.bent || "—"}</p>
                                </div>

                                <div className="summary-box">
                                    <p><strong>Situation Familiale:</strong> {formData.situationFamiliale || "—"}</p>
                                    <p><strong>Nom de conjoint :</strong> {formData.conjointNom || "—"}</p>
                                    <p><strong>Fonction de conjoint :</strong> {formData.conjointFonction || "—"}</p>
                                    <p><strong>Nombre d'enfant :</strong> {formData.nombreEnfants || "—"}</p>
                                    <p><strong>Adresse Personnelle :</strong> {formData.adressePersonnelle || "—"}</p>
                                    <p><strong>Adresse Precedente :</strong> {formData.adressePrecedente || "—"}</p>
                                    <p><strong>Ville :</strong> {formData.ville || "—"}</p>
                                </div>

                                <div className="summary-box">
                                    <p><strong>N° Passport:</strong> {formData.passportNumber || "—"}</p>
                                    <p><strong>Date d'expiration:</strong> {formData.dateExpirationPassport?.toLocaleDateString() || "—"}</p>
                                    <p><strong>Emis Le:</strong> {formData.dateDebutPassport?.toLocaleDateString() || "—"}</p>
                                    <p><strong>Emis A:</strong> {formData.passportEmisA|| "—"}</p>
                                    <br/>
                                    <p><strong>Permis de conduire N°:</strong> {formData.permisNumber || "—"}</p>
                                    <p><strong>Emis Le:</strong> {formData.dateDebutPermis?.toLocaleDateString() || "—"}</p>
                                    <p><strong>Emis A:</strong> {formData.permisEmisA|| "—"}</p>
                                    <br/>
                                    <p><strong>Permis du porte d'arme:</strong> {formData.permisPortArme || "—"}</p>
                                    <p><strong>Service militaire:</strong> {formData.serviceMilitaire|| "—"}</p>
                                </div>
                                <div className="summary-box">
                                    <p><strong>Organisme Employeur:</strong> {formData.organisme || "—"}</p>
                                    <p><strong>Service Employeur:</strong> {formData.serviceEmployeur || "—"}</p>
                                    <p><strong>Fonction:</strong> {formData.fonction|| "—"}</p>
                                    <p><strong>Date de Recrutement:</strong> {formData.dateRecrutement?.toLocaleDateString() || "—"}</p>
                                    <p><strong>Direction:</strong> {formData.direction|| "—"}</p>
                                    <p><strong>Emploies precedents:</strong> {formData.employesPrecedents|| "—"}</p>
                                </div>
                                <div className="summary-box">
                                    <p><strong>Niveau d'instruction:</strong> {formData.niveauInstruction || "—"}</p>
                                    <p><strong>Etablissements scolaires frequents:</strong> {formData.ecole || "—"}</p>
                                    <br/>
                                    <p><strong>Appartenances:</strong> {formData.appartenances|| "—"}</p>
                                    <p><strong>Parti politique:</strong> {formData.partiPolitique|| "—"}</p>
                                    <p><strong>Syndicat:</strong> {formData.syndicat|| "—"}</p>
                                    <p><strong>Association:</strong> {formData.association|| "—"}</p>
                                    <p><strong>Antécédents judiciaires:</strong> {formData.antecedents|| "—"}</p>
                                    <p><strong>Dates et motifs:</strong> {formData.datesMotifs|| "—"}</p>
                                </div>

                            </div>
                            <h5>Zones d'accès</h5>
                        <div className="summary-step1">
                            <div className="summary-box">
                                <p><strong>Objet de l'autorisation d'accès:</strong> {formData.objetAutorisation || "—"}</p>
                                <p><strong>Portes d'accès demandées:</strong> {formData.portes?.join(", ") || "—"}</p>
                                <p><strong>Zones de Sûreté Demandées:</strong> {formData.zones || "—"}</p>
                                <p><strong>Secteurs de sûreté:</strong> {formData.portes?.join(", ") || "—"}</p>
                            </div>

                            <div className="summary-box">
                                <h5>Signature du concerne</h5>
                                {formData.signature ? (
                                    <img
                                        src={formData.signature}
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
                        <h5>Fichiers joints</h5>

                        <div className="files-container">

                            {/* CNIE FILE */}
                            {formData.cnieFile && (
                                <div className="file-card">
                                    <a
                                        href={URL.createObjectURL(formData.cnieFile)}
                                        download={formData.cnieFile.name}
                                        className="download-btn"
                                    >
                                        <i className="bx bx-arrow-to-bottom"/>
                                    </a>

                                    <div className="file-preview">
                                        <i className="fa-solid fa-file-pdf"></i>
                                    </div>

                                    <div className="file-footer">
                                        <p className="file-name" title={formData.cnieFile.name}>
                                            CNIE / Passport
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* PHOTO FILE */}
                            {formData.photoFile && (
                                <div className="file-card">
                                    <a
                                        href={URL.createObjectURL(formData.photoFile)}
                                        download={formData.photoFile.name}
                                        className="download-btn"
                                    >
                                        <i className="bx bx-arrow-to-bottom"/>
                                    </a>

                                    <div className="file-preview">
                                        <img
                                            src={URL.createObjectURL(formData.photoFile)}
                                            alt="Photo"
                                        />
                                    </div>

                                    <div className="file-footer">
                                        <p className="file-name" title={formData.photoFile.name}>
                                            Photo
                                        </p>
                                    </div>
                                </div>
                            )}

                        </div>
                        <div>
                                <p><strong style={{ fontSize: "16px" }}>IMPORTANT</strong></p>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "8px",
                                    marginTop: "10px",
                                    lineHeight: "1.4"
                                }}
                            >
                                <input
                                    type="checkbox"
                                    required
                                    checked={isImportantAccepted}
                                    onChange={(e) => setIsImportantAccepted(e.target.checked)}
                                    style={{
                                        marginTop: "3px",
                                        cursor: "pointer"
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: "13px",
                                        color: "#c20831",
                                        fontWeight: "600"
                                    }}
                                >
    Je certifie et atteste que les renseignements fournis ci-dessus sont exacts.
    Toute fausse déclaration m’expose à des poursuites judiciaires.
  </span>
                            </div>
                        </div>
                            </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Helmet>
                <title>RAM Badges | Saisir Votre Demande</title>
            </Helmet>

            <div className="background">
                <div className="overlay">
                    <div className="container">
                        <div className="stepper">
                            {visibleSteps.map((step, index) => (
                                <div
                                    key={step.number}
                                    style={{ display: 'flex', alignItems: 'center' }}
                                >
                                    <div
                                        className={`step ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'done' : ''}`}
                                    >
                                        <div className={`step-section ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'done' : ''}`}>
                                            {currentStep > step.number
                                                ? <i className='bx bx-check'></i>
                                                : step.number
                                            }
                                        </div>
                                        <span className={`step-label ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'done' : ''}`}>
                    {step.label}
                </span>
                                    </div>
                                    {index < visibleSteps.length - 1 && (
                                        <div className={`step-line ${currentStep > step.number ? 'done' : ''}`}></div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Step Form Content */}
                        {renderStepContent()}

                        {/* Step navigation buttons */}
                        <div className="step-actions">
                            <button
                                className="btn-prev"
                                onClick={() => setCurrentStep(p => Math.max(1, p - 1))}
                                disabled={currentStep === 1}
                            >
                                <i className='bx bx-left-arrow-alt' style={{ marginRight: "18px" }}></i>
                                Précédent
                            </button>

                            {currentStep < steps.length - 1 && (
                                <button
                                    className="btn-suivant"
                                    onClick={() => setCurrentStep(p => Math.min(steps.length, p + 1))}
                                >
                                    Suivant
                                    <i className='bx bx-right-arrow-alt' style={{ marginLeft: "18px" }}></i>
                                </button>
                            )}

                            {currentStep === steps.length - 1 && (
                                <button
                                    className="btn-enregistrement"
                                    onClick={() => setCurrentStep(steps.length)}
                                >
                                    Enregistrer
                                    <i className='bx bx-right-arrow-alt' style={{ marginLeft: "18px" }}></i>
                                </button>
                            )}

                            {currentStep === steps.length && (
                                <button
                                    className="btn-enregistrement"
                                    onClick={handleSubmit}
                                    disabled={!isImportantAccepted}
                                    style={{
                                        opacity: !isImportantAccepted ? 0.5 : 1,
                                        cursor: !isImportantAccepted ? "not-allowed" : "pointer"
                                    }}
                                >
                                    Soumettre
                                    <i className='bx bx-right-arrow-alt' style={{ marginLeft: "18px" }}></i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleClose}>
                    <div
                        className={`modal-content ${closing ? "closing" : ""}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="close-btn" onClick={handleClose}>
                            ×
                        </button>
                        <h2>Documents requis à préparer</h2>
                        <form className="modal-form">
                            <label className="lbl-demande">Documents PDF:</label>
                            <ul>
                                <li>Photocopie de CNIE/PASSPORT/CD<small className="text-secondary"> (Aggrafées sur Dossiers) *</small></li>
                            </ul>
                            <label className="lbl-demande1">Image:</label>
                            <ul>
                                <li>1 Photo*</li>
                            </ul>
                            <div className="modal-actions1">
                                <button
                                    type="button"
                                    className="submit-btn1"
                                    onClick={handleClose}
                                >
                                    <i className="fa-solid fa-arrow-right" /> Fermer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showLoadingModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{ textAlign: "center", padding: "30px" }}>
                            <div className="spinner"></div>
                            <p>Envoi de votre demande...</p>
                        </div>
                    </div>
                </div>
            )}
            {showErrorModal && (
                <div className="modal-overlay" onClick={() => setShowErrorModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setShowErrorModal(false)}>
                            ×
                        </button>

                        <h3 style={{ color: "red" }}>Erreur</h3>
                        <p>{errorMessage}</p>

                        <button
                            className="submit-btn1"
                            onClick={() => setShowErrorModal(false)}
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}
            {showValidationModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Champs manquants</h3>
                        <p>Veuillez remplir tous les champs obligatoires.</p>

                        <button onClick={() => setShowValidationModal(false)}>
                            OK
                        </button>
                    </div>
                </div>
            )}
            {showSuccessModal && (
                <div className="modal-overlay" onClick={handleSuccessClose}>
                    <div
                        className={`modal-content ${closing ? "closing" : ""}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="close-btn" onClick={handleSuccessClose}>
                            ×
                        </button>

                        <form className="modal-form" style={{ display: "flex", justifyContent: "center" }}>
                            <p className="lbl-success">
                                Votre demande a été enregistrée et soumise pour validation.
                            </p>

                            <div className="modal-actions1">
                                <button
                                    type="button"
                                    className="submit-btn1"
                                    onClick={handleSuccessClose}
                                >
                                    <i className="fa-solid fa-arrow-right" /> Fermer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default DemandeurDemande;