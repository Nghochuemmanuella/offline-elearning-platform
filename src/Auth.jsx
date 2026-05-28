import React, { useState } from 'react';
import localDB from './db';
import bcrypt from 'bcryptjs';
import ForgotPassword from './ForgotPassword';
const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, we just simulate a successful login
    // Later, we will connect this to your database
    onLogin({ email: email, password: password });
  };

  const handleRegister = async (e) => {
  e.preventDefault();
  
  // Basic validation rules
  if (password.length < 8 || !/\d/.test(password)) {
    alert("Password must be 8+ characters and include a number.");
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    _id: `user_${email}`,
    type: 'user',
    name: name,
    email: email,
    password: hashedPassword,
    role: 'student', 
    createdAt: new Date().toISOString()
  };

  try {
    await localDB.put(newUser);
    alert("Registration Successful! You can now login.");
    setIsLogin(true); // Switch back to login view
  } catch (err) {
    alert("User already exists or database error.");
  }
};

  const neonStyle = {
    color: '#00ff2f',
    backgroundColor: '#0a0a0a',
    border: '1px solid rgba(0,255,47,0.35)',
    borderRadius: '10px',
    padding: '13px',
    width: '100%',
    cursor: 'pointer',
    fontWeight: '900',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    marginTop: '20px',
    boxShadow: '0 4px 16px rgba(0,255,47,0.15)',
    transition: 'opacity 0.15s ease',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    margin: '8px 0',
    backgroundColor: '#111',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#00ff2f',
    outline: 'none',
    WebkitTextFillColor: '#00ff2f',
    WebkitBoxShadow: '0 0 0px 1000px #111 inset',
    boxSizing: 'border-box',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
  };
  if (showForgot) return <ForgotPassword onBack={() => setShowForgot(false)} />;


  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000'
    }}>
      <div style={{
  width: '90%',
  maxWidth: '380px',
  padding: '36px 32px',
  border: '1px solid rgba(0,255,47,0.2)',
  borderRadius: '20px',
  textAlign: 'center',
  boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,255,47,0.08)',
  backgroundColor: '#0a0a0a',
}}>
        <img src="/logo192.png" alt="EduBridge" style={{ width: '100px', marginBottom: '20px' }} />
        <h1 style={{ color: '#00ff2f', marginBottom: '30px', letterSpacing: '3px' }}>
          {isLogin ? 'LOGIN' : 'SIGN UP'}
        </h1>

        <form onSubmit={isLogin ? handleSubmit : handleRegister}>
          {!isLogin && (
            <input 
              type="text" 
              placeholder="FULL NAME" 
              style={inputStyle} 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          )}
          <input 
            type="email" 
            placeholder="EMAIL ADDRESS" 
            style={inputStyle} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
         <div style={{ position: 'relative', width: '100%', margin: '8px 0', boxSizing: 'border-box', overflow: 'hidden' }}>
  <input 
    type={showPassword ? 'text' : 'password'} 
    placeholder="PASSWORD" 
    style={{ 
      width: '100%',
      padding: '12px 40px 12px 14px',
      backgroundColor: '#111',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      color: '#00ff2f',
      outline: 'none',
      WebkitTextFillColor: '#00ff2f',
      WebkitBoxShadow: '0 0 0px 1000px #111 inset',
      boxSizing: 'border-box',
      fontFamily: 'monospace',
      fontSize: '0.9rem',
    }} 
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required 
  />
  <span
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: 'absolute', right: '12px', top: '50%',
      transform: 'translateY(-50%)', cursor: 'pointer',
      color: '#00ff2f', fontSize: '1rem', userSelect: 'none',
    }}
  >
    {showPassword ? '🙈' : '👁️'}
  </span>
</div>
          
          <button type="submit" style={neonStyle}>
            {isLogin ? 'ENTER ENGINE' : 'CREATE ACCOUNT'}
          </button>
          {isLogin && (
  <p style={{ marginTop: '12px', fontSize: '0.75rem', color: '#555', cursor: 'pointer' }}
    onClick={() => setShowForgot(true)} >
    FORGOT PASSWORD? <span style={{ color: '#00ff2f' }}>GET HELP →</span>
  </p>
)}
        </form>

        <p style={{ color: '#666', marginTop: '20px', fontSize: '0.8rem' }}>
          {isLogin ? "NEW TO EDUBRIDGE?" : "ALREADY HAVE AN ACCOUNT?"}
          <span 
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: '#00ff2f', cursor: 'pointer', marginLeft: '5px', fontWeight: 'bold' }}
          >
            {isLogin ? 'SIGN UP' : 'LOGIN'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;