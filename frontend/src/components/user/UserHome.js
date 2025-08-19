import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./userHome.css";
import axios from "axios";
import {
  NotificationContainer,
  NotificationManager,
} from "react-notifications";
import ClassIcon from "@mui/icons-material/Class";
import SearchIcon from "@mui/icons-material/Search";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";

function UserHome() {
  const navigate = useNavigate();
  const api = "http://127.0.0.1:8000";

  const [bookCategories, setBookCategories] = useState([]);
  const [books, setBooks] = useState([]);

  const getAllBooks = () => {
    try {
      axios.get(`${api}/books/get_details`).then((res) => {
        res?.data && setBooks(res.data);
      });
    } catch (err) {
      NotificationManager.error(err);
    }
  };

  const getBookCategories = () => {
    try {
      axios.get(`${api}/categories/get_all`).then((res) => {
        res?.data && setBookCategories(res.data);
      });
    } catch (err) {
      NotificationManager.error(err);
    }
  };

  const getSearchedBooks = async (search) => {
    if (search !== "") {
      try {
        await axios
          .get(`${api}/bookSearch/get_searched_Books/search=${search}`)
          .then((res) => {
            res.data && setBooks(res.data);
          });
      } catch (err) {
        NotificationManager.error(err);
      }
    } else {
      getAllBooks();
    }
  };

  useEffect(() => {
    getAllBooks();
    getBookCategories();
  }, []);

  return (
    <div>
      <div className="user-home">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container-fluid">
            <div className="header_logo">
              <AutoStoriesIcon />
              <span>Library</span>
            </div>
            <div
              className="collapse navbar-collapse nav_buttons"
              id="navbarSupportedContent"
            >
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Search book here"
                    className="form-control"
                    onChange={(e) => getSearchedBooks(e.target.value)}
                  />
                  <SearchIcon className="input-box-icon" />
                </div>
                <li className="nav-item">
                  <button
                    className="nav-button"
                    onClick={() => navigate("/user/issue-book")}
                  >
                    Issue Book
                  </button>
                  <button className="nav-button" onClick={() => navigate("/")}>
                    Back
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <NotificationContainer />
        <div>
          <div className="books-table">
            <div className="table-wrapper">
              <h2>Book Table</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Book Id</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Publisher</th>
                    <th>category</th>
                    <th>copies</th>
                  </tr>
                </thead>
                <tbody>
                  {books?.length > 0 ? (
                    books.map((book) => {
                      return (
                        <tr key={book?.id}>
                          <td>{book?.id}</td>
                          <td>{book?.title}</td>
                          <td>{book?.author}</td>
                          <td>{book?.publisher}</td>
                          <td>{book?.category}</td>
                          <td>{book?.copies}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td>Books not available!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginTop: "5%" }}>
            <h2>Book Categories</h2>
            <div className="cat-container">
              {bookCategories?.length > 0 ? (
                bookCategories.map((cat) => {
                  return (
                    <div
                      key={cat?.id}
                      className="items"
                      onClick={() => navigate(`/books_by_category/${cat?.id}`)}
                    >
                      <div className="icon-wrapper">
                        <ClassIcon className="category" />
                      </div>
                      <div className="project-name">
                        <p>{cat?.name}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-cat-home">Library out of service!</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserHome;
