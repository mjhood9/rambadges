import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import '../../assets/styles/SignInForm.css';

const SignInForm = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { handleSignIn, loading, error } = useAuth();

    return (
        <div className="sign-in-card">

            {error && (
                <div className="alert-error">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit(handleSignIn)}>
                <div className="form-group">
                    <label>Courriel</label>
                    <div className="input-wrap">
                        <input
                            type="email"
                            placeholder="exemple@ram.ma"
                            className={errors.email ? 'input-error' : ''}
                            {...register('email', {
                                required: 'Email requis',
                                pattern: {
                                    value: /^\S+@\S+$/i,
                                    message: 'Email invalide'
                                }
                            })}
                        />
                        <i className="fa-regular fa-envelope input-icon"></i>
                    </div>
                    {errors.email && <span className="error-msg">{errors.email.message}</span>}
                </div>

                <div className="form-group">
                    <label>Mot de passe</label>
                    <div className="input-wrap">
                        <input
                            type="password"
                            placeholder="••••••••"
                            className={errors.password ? 'input-error' : ''}
                            {...register('password', {
                                required: 'Mot de passe requis',
                                minLength: {
                                    value: 6,
                                    message: 'Minimum 6 caractères'
                                }
                            })}
                        />
                        <i className="bx bx-lock input-icon" style={{fontSize: '22px'}}/>
                    </div>
                    {errors.password && <span className="error-msg">{errors.password.message}</span>}
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? <span className="spinner"></span> : 'Se connecter'}
                </button>
            </form>
        </div>
    );
};

export default SignInForm;