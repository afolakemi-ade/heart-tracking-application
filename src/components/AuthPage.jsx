import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Mail, Heart } from 'lucide-react';

// Initialize mockUsers from localStorage or use default
const initializeUsers = () => {
  const savedUsers = localStorage.getItem('registeredUsers');
  return savedUsers ? JSON.parse(savedUsers) : [
    { email: 'demo@cardiofola.com', password: 'demo123', name: 'Demo User' }
  ];
};

const AuthPage = ({ setIsAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mockUsers, setMockUsers] = useState(initializeUsers());
  const navigate = useNavigate();

  // Update localStorage when mockUsers changes
  useEffect(() => {
    localStorage.setItem('registeredUsers', JSON.stringify(mockUsers));
  }, [mockUsers]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleRegister = () => {
    const userExists = mockUsers.some(user => user.email === formData.email);
    if (userExists) {
      setError('Email already registered');
      return false;
    }
    
    setMockUsers([...mockUsers, {
      email: formData.email,
      password: formData.password, // In production, store hashed passwords only
      name: formData.name
    }]);
    
    return true;
  };

  const handleLogin = () => {
    const user = mockUsers.find(user => user.email === formData.email);
    
    if (!user) {
      setError('Account not found. Please register first.');
      return false;
    }
    
    if (user.password !== formData.password) {
      setError('Incorrect password');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation (unchanged)
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      setIsLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (!isLogin && !formData.name) {
      setError('Name is required for registration');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const authSuccess = isLogin ? handleLogin() : handleRegister();
      
      if (authSuccess) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('currentUser', JSON.stringify(formData.email));
        setIsAuthenticated(true);
        navigate('/HeartTrackingApp');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <Heart size={48} color="#e74c3c" />
          <h2 style={styles.title}>CardioFola</h2>
        </div>
        
        <h3 style={styles.subtitle}>{isLogin ? 'Sign In' : 'Create Account'}</h3>
        
        {error && <p style={styles.error}>{error}</p>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.inputGroup}>
              <User size={20} style={styles.icon} />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          )}
          
          <div style={styles.inputGroup}>
            <Mail size={20} style={styles.icon} />
            <input
              type="email"
              name="email"
              placeholder="Your email address"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
          
          <div style={styles.inputGroup}>
            <Lock size={20} style={styles.icon} />
            <input
              type="password"
              name="password"
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              minLength={6}
              required
            />
          </div>
          
          <button 
            type="submit" 
            style={{
              ...styles.button,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        
        <p style={styles.switchText}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }} 
            style={styles.switchButton}
            type="button"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '98vw',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      
    position:"fixed",
  },
  card: {
    background: 'white',
     borderRadius: '30px',
    padding: '40px',
    width: '100vw',
    maxWidth: '400px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  title: {
    color: '#2c3e50',
    margin: 0,
    fontSize: '2rem',
  },
  subtitle: {
    color: '#555',
    marginBottom: '25px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
    left: '15px',
    color: '#777',
  },
  input: {
    width: '100%',
    padding: '12px 15px 12px 45px',
    border: '2px solid #e1e8ed',
    borderRadius: '8px',
    fontSize: '1rem',
    background: '#fafafa',
    boxSizing: 'border-box',
  },
  button: {
    padding: '15px',
    background: 'linear-gradient(135deg, #3498db, #9b59b6)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
  },
  error: {
    color: '#e74c3c',
    marginBottom: '15px',
  },
  switchText: {
    color: '#555',
    marginTop: '20px',
  },
  switchButton: {
    background: 'none',
    border: 'none',
    color: '#3498db',
    cursor: 'pointer',
    fontWeight: '600',
    padding: '0 5px',
  },
};

export default AuthPage;