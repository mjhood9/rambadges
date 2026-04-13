import { useNavigate } from 'react-router-dom';
import { Helmet } from "react-helmet-async";
import "../assets/styles/main.css";

const Demandeur = () => {
    const navigate = useNavigate();

    return (
        <>
            <Helmet>
                <title>Bienvenue Employés Au RAM Badges</title>
            </Helmet>
            <div className="background">
                <div className="overlay">
                    <div className="container">
                        <div className="demandeur-content">
                            <div className="demandeur-welcome">
                                <h2>Bienvenue,</h2>
                                <p>Veuillez sélectionner un service parmi les options ci-dessous afin de poursuivre.</p>
                            </div>

                            <div className="demandeur-options">
                                <div
                                    className="option-card"
                                    onClick={() => navigate('/demandeur/demande')}
                                >
                                    <div className="option-left">
                                        <div className="option-icon">
                                            <i className='bx bx-plus'></i>
                                        </div>
                                        <span className="option-label">Création nouvelle demande</span>
                                    </div>
                                    <i className='bx bx-right-arrow-alt option-arrow'></i>
                                </div>

                                <div
                                    className="option-card"
                                    onClick={() => navigate('/demandeur/dashboard')}
                                >
                                    <div className="option-left">
                                        <div className="option-icon">
                                            <i className="fa-regular fa-eye" style={{fontSize:"12px"}}></i>
                                        </div>
                                        <span className="option-label">Suivi de la demande</span>
                                    </div>
                                    <i className='bx bx-right-arrow-alt option-arrow'></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Demandeur;