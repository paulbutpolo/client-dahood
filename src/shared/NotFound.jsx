import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NotFound.module.css';

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className={styles['notfound-container']}>
      <h1 className={styles['notfound-heading']}>404 - Page Not Found</h1>
      <p className={styles['notfound-text']}>The page you are looking for does not exist</p>
      <button className={styles['notfound-button']} onClick={handleGoHome}>
        Go Back to Dashboard
      </button>
    </div>
  );
};

export default NotFound;