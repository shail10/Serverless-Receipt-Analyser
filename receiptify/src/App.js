import React, { useEffect, useState } from 'react';
import UploadImage from './uploadImage/UploadImage';
import Signup from './auth/signup';
import Login from './auth/Login';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'

const App = () => {
  const [user, setUser] = useState(null);
  const [showSignup, setShowSignup] = useState(true);
  console.log(showSignup);
  console.log(user);
  
  useEffect(()=>{
    const user = JSON.parse(localStorage.getItem("user"));
    if(user){
      setUser(user);
    }
  },[])
  
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
      />
      {!user ? (
        showSignup ? (
          <>
            <Signup onSignupSuccess={setUser} />
            <p className="auth-switch">
              Already have an account?{" "}
              <span className="auth-link" onClick={() => setShowSignup(false)}>Login</span>
            </p>
          </>
        ) : (
          <>
            <Login onLoginSuccess={setUser} />
            <p className="auth-switch">
              Don’t have an account?{" "}
              <span className="auth-link" onClick={() => setShowSignup(true)}>Sign up</span>
            </p>
          </>
        )
      ) : (
        <UploadImage user={user} />
      )}
    </>
  );

  // return <UploadImage user={user} />;
};

export default App;
