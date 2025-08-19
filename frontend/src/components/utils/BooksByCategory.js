import React, { useEffect, useState } from "react";
import axios from "axios";
import "./booksByCategory.css";
import { NotificationManager } from "react-notifications";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import { checkToken } from "../utils/commonFunctionalities";

function BooksByCategory() {
  const navigate = useNavigate();
  const { category } = useParams();
  const api = "http://127.0.0.1:8000";
  const token = localStorage.getItem("token");
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const [booksBycategory, setBookByCategory] = useState([]);

  const getBooksByCategory = async (category) => {
    if (category) {
      try {
        await axios
          .get(`${api}/bookSearch/get_books_by_category=${category}`, {
            headers,
          })
          .then((res) => {
            res?.data && setBookByCategory(res.data);
          });
      } catch (err) {
        NotificationManager.error(err);
      }
    }
  };

  const handleSearchBook = async (search, categoryId) => {
    if (search !== "" && search.length > 1 && categoryId) {
      try {
        await axios(`${api}/books/get_books_by_category=${categoryId}`).then(
          (res) => {
            res?.data && setBookByCategory(res.data);
          }
        );
      } catch (err) {
        NotificationManager.error(err);
      }
    } else if (search === "" && category) {
      getBooksByCategory(category);
    }
  };

  useEffect(() => {
    if (category) {
      getBooksByCategory(category);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <div>
      <div className="cat-nav">
        <div className="input-box">
          <input
            type="text"
            className="form-control"
            onChange={(e) => handleSearchBook(e.target.value, category)}
          />
          <SearchIcon className="input-box-icon" />
        </div>
        <button
          onClick={() =>
            checkToken() ? navigate("/home") : navigate("/user-home")
          }
        >
          Back to Home
        </button>
      </div>
      <div className="catbook-container">
        <h2>Available Books:</h2>
        <ul className="responsive-table">
          <li className="table-header">
            <div className="col col-1">Book Id</div>
            <div className="col col-2">Book Title</div>
            <div className="col col-3">Book Author</div>
            <div className="col col-4">Book Publisher</div>
            <div className="col col-5">Book Copies</div>
          </li>
          {booksBycategory?.length > 0 ? (
            booksBycategory?.map((book) => {
              return (
                <li key={book?.id} className="table-row">
                  <div className="col col-1" data-label="Book Id">
                    {book?.id}
                  </div>
                  <div className="col col-2" data-label="Book Title">
                    {book?.title}
                  </div>
                  <div className="col col-3" data-label="Book Author">
                    {book?.author}
                  </div>
                  <div className="col col-4" data-label="Book Publisher">
                    {book?.publisher}
                  </div>
                  <div className="col col-5" data-label="Book Copies">
                    {book?.copies}
                  </div>
                </li>
              );
            })
          ) : (
            <div className="no-cat-book">
              No books available in this categories
            </div>
          )}
        </ul>
      </div>
    </div>
  );
}

export default BooksByCategory;
