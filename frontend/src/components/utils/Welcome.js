import "./welcome.css";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { checkToken, handleLogout } from "./commonFunctionalities";

function Welcome() {
  const navigate = useNavigate();
  const [isToken, setIsToken] = useState(checkToken());

  useEffect(() => {
    const handleTokenChange = () => {
      setIsToken(checkToken());
      window.location.reload();
    };

    window.addEventListener("storage", handleTokenChange);

    return () => {
      window.removeEventListener("storage", handleTokenChange);
    };
  }, []);

  return (
    <div className="welcome-page">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <div className="welcome_logo">
            <AutoStoriesIcon />
            <span>Library</span>
          </div>
          <div
            className="collapse navbar-collapse nav_buttons"
            id="navbarSupportedContent"
          >
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <span
                  className="nav-link"
                  aria-current="page"
                  onClick={() => navigate("/user-info")}
                >
                  User Info
                </span>
              </li>
              <li className="nav-item">
                <span
                  className="nav-link"
                  aria-current="page"
                  onClick={() => navigate("/user-home")}
                >
                  Check out Books
                </span>
              </li>
              {isToken && (
                <li className="nav-item">
                  <span
                    className="nav-link"
                    aria-current="page"
                    onClick={() => navigate("/home")}
                  >
                    For Librarian
                  </span>
                </li>
              )}
              <li className="nav-item">
                {isToken ? (
                  <span
                    className="nav-link"
                    onClick={() => {
                      handleLogout().then(() => {
                        let tokenIsActive = checkToken();
                        setIsToken(tokenIsActive);
                        window.location.reload();
                      });
                    }}
                  >
                    Logout
                  </span>
                ) : (
                  <span className="nav-link" onClick={() => navigate("/login")}>
                    Login
                  </span>
                )}
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div className="welcome_msg_div">
        <header>
          <h1>Welcome to Our Library</h1>
        </header>
        <main>
          <div className="welcome-message">
            <span>
              <p>
                Dear Visitors, Welcome to our sanctuary of stories and
                knowledge! Step into a world where every page holds adventure,
                insight, and inspiration. From classics to bestsellers, our
                shelves are filled with treasures waiting to be discovered.
                Whether you're seeking solace in a novel, embarking on a quest
                for knowledge, or escaping into a different realm, our library
                offers a haven for book lovers. Our team is here to assist you
                on your literary journey, providing recommendations and warm
                smiles. Take a moment to explore, find your next literary
                companion, and immerse yourself in the magic of reading.
                Welcome!
              </p>
            </span>
          </div>
        </main>
      </div>
      <footer>
        <p>Contact Us | Privacy Policy | Terms of Service</p>
      </footer>
    </div>
  );
}

export default Welcome;
