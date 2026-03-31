import {Helmet} from "react-helmet-async";
import "../assets/styles/main.css";

const AdminDashboard = () => {
    return (
        <>
            <Helmet>
                <title>Admin RAM Badges | Les Utilisateurs à Gérer</title>
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
export default AdminDashboard;