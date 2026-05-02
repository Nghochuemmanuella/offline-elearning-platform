import React, { useState } from 'react';
import localDB from './db';
import bcrypt from 'bcryptjs';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

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
    backgroundColor: '#000000',
    border: '2px solid #00ff2f',
    padding: '12px',
    width: '100%',
    cursor: 'pointer',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: '20px',
    boxShadow: '0 0 10px #00ff2f'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    margin: '10px 0',
    backgroundColor: '#111',
    border: '1px solid #333',
    color: '#00ff2f',
    outline: 'none'
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000'
    }}>
      <div style={{
        width: '350px',
        padding: '40px',
        border: '3px solid #00ff2f',
        textAlign: 'center',
        boxShadow: '10px 10px 0px #00ff2f'
      }}>
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
          <input 
            type="password" 
            placeholder="PASSWORD" 
            style={inputStyle} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          
          <button type="submit" style={neonStyle}>
            {isLogin ? 'ENTER ENGINE' : 'CREATE ACCOUNT'}
          </button>
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