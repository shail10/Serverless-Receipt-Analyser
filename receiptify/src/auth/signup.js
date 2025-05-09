import React, { useState } from 'react'
import { auth } from '../firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import './auth.css'

const Signup = ({ onSignupSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      onSignupSuccess(userCredential.user)
      localStorage.setItem('user', JSON.stringify(userCredential.user))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className='auth-container'>
      <div className='logo'>Receiptify</div>
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup}>
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
        <button type='submit'>Sign Up</button>
        {error && <p className='error'>{error}</p>}
      </form>
    </div>
  )
}

export default Signup
