// import { useContext, useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import AuthContext from '../../contexts/AuthContext';
// import * as authService from '../../services/authService';
import './Login.css';

import { useNavigate } from 'react-router-dom';

import { useAuthContext } from '../../contexts/AuthContext';
import { useNotificationContext, types } from '../../contexts/NotificationContext';

import * as authService from '../../services/authService';
import { Link } from 'react-router-dom';

const Login = () => {

    // const [err, setError] = useState(null);

    // const navigate = useNavigate();
    // const { setUser } = useContext(AuthContext);

    // function onLogin(ev) {
    //     ev.preventDefault();
    //     const { email, password } = Object.fromEntries(new FormData(ev.currentTarget));
    //     authService.login(email, password)
    //         .then(data => {
    //             setUser(data);
    //             navigate('/');
    //         })
    //         .catch(err => {
    //             setError(err.message);
    //         });
    // }
    const { login } = useAuthContext();
    const { addNotification } = useNotificationContext();
    const navigate = useNavigate();

    const onLoginHandler = (e) => {
        e.preventDefault();

        let formData = new FormData(e.currentTarget);

        let email = formData.get('email');
        let password = formData.get('password');

        authService.login(email, password)
            .then((authData) => {
                login(authData);
                addNotification('You logged in successfully', types.success);
                navigate('/catalog');
            })
            .catch(err => {
                // TODO: show notification
                console.log(err);
            });
    }

    return (
        <>
            <section id="login">
                <article className="login-header">
                    <h1>Sign In</h1>
                </article>
{/* 
                { err != null 
                ? <article className="errorMsg">
                    <span>{err}</span>
                  </article>
                : ''
                } */}

                <article className='login-form-container'>
                    <form onSubmit={onLoginHandler} method="POST" className="loginForm">
                        <div className="formGroup">
                            <label htmlFor="email">Email:</label>
                            <i className="inputIcon fas fa-user"></i>
                            <input type="text" id="email" name="email" placeholder='email@example.com' />
                        </div>
                        <div className="formGroup">
                            <label htmlFor="password">Password:</label>
                            <i className="inputIcon fas fa-lock"></i>
                            <input type="password" id="password" name="password" placeholder="********" />
                        </div>
                        <div className="formGroup">
                            <button className="submitBtn">Sign in now <i className="fas fa-chevron-right"></i></button>
                        </div>
                    </form>
                </article>

                <article className="login-footer">
                    <p>Don't have an account? <Link className="signup-text" to="/register">Sign up</Link></p>
                </article>
            </section>
        </>
    )
}
export default Login;