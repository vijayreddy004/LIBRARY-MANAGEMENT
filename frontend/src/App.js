import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import Home from "./components/utils/Home";
import Login from "./components/admin/Login";
import Welcome from "./components/utils/Welcome";
import UserHome from "./components/user/UserHome";
import UserInfo from "./components/user/UserInfo";
import IssueBook from "./components/user/IssueBook";
import UserBookDetails from "./components/user/UserBookDetails";
import BooksByCategory from "./components/utils/BooksByCategory";
import {
  checkToken,
  handleLogout,
} from "./components/utils/commonFunctionalities";

const App = () => {
  const tokenIsValid = checkToken();

  useEffect(() => {
    if (localStorage.length > 0) {
      if (!tokenIsValid) {
        handleLogout();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Router>
      <AppRoutes tokenIsValid={tokenIsValid} />
    </Router>
  );
};

const PrivateRoute = ({ tokenIsValid, children }) => {
  return tokenIsValid ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <>
      <Routes>
        <Route exact path="/" element={<Welcome />}></Route>
        <Route exact path="/login" element={<Login />}></Route>
        <Route
          exact
          path="/home"
          element={
            // <PrivateRoute>
            <Home />
            // </PrivateRoute>
          }
        ></Route>
        <Route
          exact
          path="/books_by_category/:category"
          element={<BooksByCategory />}
        ></Route>
        <Route exact path="/user-home" element={<UserHome />}></Route>
        <Route exact path="/user/issue-book" element={<IssueBook />}></Route>
        <Route exact path="/user-info" element={<UserInfo />}></Route>
        <Route exact path="/user-books" element={<UserBookDetails />}></Route>
      </Routes>
    </>
  );
};
export default App;
