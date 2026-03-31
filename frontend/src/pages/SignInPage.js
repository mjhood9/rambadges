import SignInForm from '../components/auth/SignInForm';
import '../assets/styles/SignInPage.css';
import signinImg from '../assets/img/signin.jpg';
import ramLogo from '../assets/img/ramlogo.png';
import oneworldLogo from '../assets/img/oneworld.png';
import { Helmet } from 'react-helmet-async';

const SignInPage = () => {
    return (
        <>
        <Helmet>
            <title>RAM Badges | Connexion</title>
        </Helmet>
        <div className="sign-in-page">
            <div className="page-left">

                {/* Logo top left */}
                <div className="logos">
                    <img src={ramLogo} alt="Royal Air Maroc" className="ram-logo-img"/>
                    <img src={oneworldLogo} alt="OneWorld" className="oneworld-logo-img"/>
                </div>

                {/* Form centered in page */}
                <div className="form-container">
                    <h1 className="page-title text-center mt-5 mb-5">Accédez à votre compte</h1>
                    <SignInForm/>
                </div>

            </div>
            <div className="page-right">
                <img src={signinImg} alt="Sign In" className="signin-img"/>
            </div>
        </div>
        </>
    );
};

export default SignInPage;