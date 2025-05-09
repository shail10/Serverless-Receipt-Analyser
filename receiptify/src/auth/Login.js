import React, { useState } from 'react'
import { auth } from '../firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import './auth.css'

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      onLoginSuccess(userCredential.user)
      localStorage.setItem('user', JSON.stringify(userCredential.user))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className='auth-container'>
      <div className='logo'>Receiptify</div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type='submit'>Login</button>
        {error && <p className='error'>{error}</p>}
      </form>
    </div>
  )
}

export default Login
