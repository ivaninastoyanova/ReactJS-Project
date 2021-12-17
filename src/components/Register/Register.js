// import { Link, useNavigate } from 'react-router-dom';
// import * as authService from '../../services/authService';
import { useContext, useState } from 'react';
// import AuthContext from '../../contexts/AuthContext';

import { useNavigate } from 'react-router';
import { Link } from 'react-router-dom';

import * as authService from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import './Register.css';


const Register = () =>  {

    // const [err, setError] = useState(null);

    // const navigate = useNavigate();
    // const { setUser } = useContext(AuthContext);

    // function onRegister(ev) {
    //     ev.preventDefault();
    //     const { email, password } = Object.fromEntries(new  FormData(ev.currentTarget));
        
    //     authService.register(email,  password)
    //         .then(data => {
    //             setUser(data);
    //             navigate('/');
    //         })
    //         .catch(err => {
    //             setError(err.message);
                
    //         });
    // }
    const [err, setError] = useState(null);
    const navigate = useNavigate();
    const { login } = useAuthContext();

    const registerSubmitHandler = (e) => {
        e.preventDefault();

        let { email, password } = Object.fromEntries(new FormData(e.currentTarget));

        authService.register(email, password)   
            .then(authData => {
                login(authData);
                navigate('/catalog');
            })
            .catch(err => {
                setError(err);
            });
    }

    return (
        <>
            <section id="register">
                <article className="register-header">
                    <h1>Sign Up</h1>
                </article>

                { err != null 
                ? <article className="errorMsg">
                    <span>{err}</span>
                  </article>
                : ''
                }
                

                <article className='register-form-container'>
                    <form method="POST" onSubmit={registerSubmitHandler} className="registerForm">
                        <div className="formGroup">
                            <label htmlFor="email">Email:</label>
                            <i class="inputIcon fas fa-envelope"></i>
                            <input type="text" id="email" name="email" placeholder='email@example.com' />
                        </div>
                        <div className="formGroup">
                            <label htmlFor="password">Password:</label>
                            <i className="inputIcon fas fa-lock"></i>
                            <input type="password" id="password" name="password" placeholder="********" />
                        </div>
                        <div className="formGroup">
                            <button className="submitBtn">Sign up now <i class="fas fa-chevron-right"></i></button>
                        </div>
                    </form>
                </article>

                <article className="register-footer">
                    <p>Have an account? <Link className="signin-text" to="/login">Sign in</Link></p>
                </article>
            </section>
        </>
    )
}

export default Register;