// components/Auth.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './css/Auth.module.css';
import makeApiCall from '../api/Api';

const Auth = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    identifier: '',
    username: '',
    email: '',
    password: '',
    rePassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken && refreshToken) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!isLogin && formData.password !== formData.rePassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await makeApiCall('/login', 'post', {
        identifier: formData.identifier,
        password: formData.password
      });

      // Store tokens securely
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // Store user data (without sensitive info)
      const userData = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        role: response.user.role
      };
      localStorage.setItem('userData', JSON.stringify(userData));

      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await makeApiCall('/signup', 'post', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      // After successful signup, switch to login form
      setIsLogin(true);
      setFormData({
        identifier: formData.email,
        username: '',
        email: '',
        password: '',
        rePassword: ''
      });
      setError('');
    } catch (error) {
      setError(error.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles['auth-container']}>
      <div className={styles['login-container']}>
        <h1>{isLogin ? 'Welcome Back' : 'Create an Account'}</h1>
        {error && <div className={styles['error-message']}>{error}</div>}

        <form className={styles['login-form']} onSubmit={isLogin ? handleLogin : handleSignup}>
          {!isLogin && (
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
            />
          )}
          <input
            type={isLogin ? "text" : "email"}
            name={isLogin ? "identifier" : "email"}
            placeholder={isLogin ? "Username or Email" : "Email"}
            value={isLogin ? formData.identifier : formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
          {!isLogin && (
            <input
              type="password"
              name="rePassword"
              placeholder="Confirm Password"
              value={formData.rePassword}
              onChange={handleChange}
              required
              minLength={6}
            />
          )}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p className={styles['toggle-auth']}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            className={styles['toggle-button']}
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
        {isLogin && (
          <button type="button" className={styles['forgot-password']}>
            Forgot Password?
          </button>
        )}
      </div>
    </div>
  );
};

export default Auth;