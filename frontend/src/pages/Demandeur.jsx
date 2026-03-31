import {Helmet} from "react-helmet-async";
import "../assets/styles/main.css";

const Demandeur = () => {
    return (
        <>
            <Helmet>
                <title>Bienvenue Employés Au RAM Badges</title>
            </Helmet>
            <div className="background">
                <div className="overlay">
                    <div className="container">
                        {/* your content */}
                    </div>
                </div>
            </div>
        </>
    );
};
export default Demandeur;