import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./login.css";
import {
  NotificationContainer,
  NotificationManager,
} from "react-notifications";

function Login() {
  const navigate = useNavigate();
  const api = "http://127.0.0.1:8000";
  const [isSignUp, SetIsSignUp] = useState(false);
  const [password, setPassword] = useState("");
  const [loginInfo, setLoginInfo] = useState({
    username: "",
    password: "",
  });

  const handleLogIn = async () => {
    const formData = new FormData();
    formData.append("username", loginInfo.username);
    formData.append("password", loginInfo.password);
    try {
      await axios.post(`${api}/token`, formData).then(async (res) => {
        localStorage.setItem("token", res?.data?.access_token);
        NotificationManager.success("Librarian signed in sussessfully");
        navigate("/home");
        // window.location.reload();
      });
    } catch (err) {
      NotificationManager.error("Error in user sign in process!");
    }
  };

  const handleSignUp = async () => {
    if (password !== loginInfo.password) {
      NotificationManager.error("Please re-enter password and confirm!");
    } else {
      const formData = new FormData();
      formData.append("username", loginInfo.username);
      formData.append("password", loginInfo.password);

      try {
        await axios.post(`${api}/librarians/sign_up`, formData).then((res) => {
          localStorage.setItem("token", res?.data?.access_token);
          window.location.reload();
          NotificationManager.success("Librarian signed up sussessfully");
          navigate("/home");
        });
      } catch (err) {
        NotificationManager.error("Error in sign up process!");
      }
    }
  };

  return (
    <>
      <NotificationContainer />
      <div id="wrapper">
        <div className="main-content">
          <div className="header">
            {isSignUp ? (
              <>
                <h5>New Librarian,</h5>
                <h6>Please sign up to start your job.</h6>
              </>
            ) : (
              <>
                <h5>Hey Librarian,</h5>
                <h6>Please log in to proceed your job.</h6>
              </>
            )}
            <br />
          </div>
          <div className="l-part">
            <input
              type="text"
              placeholder="Username"
              className="input-1"
              value={loginInfo.username}
              onChange={(e) =>
                setLoginInfo({ ...loginInfo, username: e.target.value })
              }
              required
            />
            <div className="overlap-text">
              <input
                type="password"
                placeholder="Password"
                className="input-2"
                value={isSignUp ? password : loginInfo.password}
                onChange={(e) => {
                  isSignUp
                    ? setPassword(e.target.value)
                    : setLoginInfo({ ...loginInfo, password: e.target.value });
                }}
                required
              />
              {isSignUp && (
                <input
                  type="password"
                  placeholder="Re-Enter Password"
                  className="input-2"
                  value={loginInfo.password}
                  onChange={(e) =>
                    setLoginInfo({ ...loginInfo, password: e.target.value })
                  }
                  required
                />
              )}
            </div>
            {isSignUp ? (
              <input
                type="button"
                value="Sign up"
                className="btn"
                disabled={Object.values(loginInfo).includes("")}
                onClick={() => handleSignUp()}
              />
            ) : (
              <input
                type="button"
                value="Log in"
                className="btn"
                disabled={Object.values(loginInfo).includes("")}
                onClick={() => handleLogIn()}
              />
            )}
          </div>
        </div>
        {!isSignUp && (
          <div className="sub-content">
            <div className="s-part">
              Don't have an account?
              <span onClick={() => SetIsSignUp(true)}>Sign up</span>
            </div>
          </div>
        )}
        <div className="sub-content">
          <div className="s-part">
            Not a librarian and just want to check out book?
            <span onClick={() => navigate("/user-home")}>check out books</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
