/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./userHome.css";
import "../admin/login.css";
import {
  NotificationContainer,
  NotificationManager,
} from "react-notifications";
import BookDetails from "../utils/BookDetails";

function IssueBook() {
  const navigate = useNavigate();
  const api = "http://127.0.0.1:8000";

  const [searchedBooks, setSearchedBooks] = useState([]);
  const [openIssueBook, setOpenIssueBook] = useState("");
  const [issueDetails, setIssueDetails] = useState({
    title: "",
    author: "",
    publisher: "",
  });

  const getBooksToShow = async () => {
    if (
      issueDetails.title !== "" &&
      issueDetails.author === "" &&
      issueDetails.publisher === ""
    ) {
      try {
        await axios
          .get(`${api}/bookSearch/get_book_by_title=${issueDetails.title}`)
          .then((res) => {
            res.data && setSearchedBooks(res.data);
          });
      } catch (err) {
        NotificationManager.error("Error in getting searched books!");
      }
    } else if (
      issueDetails.title === "" &&
      issueDetails.author !== "" &&
      issueDetails.publisher === ""
    ) {
      try {
        await axios
          .get(`${api}/bookSearch/get_book_by_author=${issueDetails.author}`)
          .then((res) => {
            res.data && setSearchedBooks(res.data);
          });
      } catch (err) {
        NotificationManager.error("Error in getting searched books!");
      }
    } else if (
      issueDetails.title === "" &&
      issueDetails.author === "" &&
      issueDetails.publisher !== ""
    ) {
      try {
        await axios
          .get(
            `${api}/bookSearch/get_book_by_publisher=${issueDetails.publisher}`
          )
          .then((res) => {
            res.data && setSearchedBooks(res.data);
          });
      } catch (err) {
        NotificationManager.error("Error in getting searched books!");
      }
    } else if (
      issueDetails.title !== "" &&
      issueDetails.author !== "" &&
      issueDetails.publisher === ""
    ) {
      try {
        await axios
          .get(
            `${api}/bookSearch/get_book_by_title_and_author/${issueDetails.title}/${issueDetails.author}`
          )
          .then((res) => {
            res.data && setSearchedBooks(res.data);
          });
      } catch (err) {
        NotificationManager.error("Error in getting searched books!");
      }
    } else if (
      issueDetails.title !== "" &&
      issueDetails.author === "" &&
      issueDetails.publisher !== ""
    ) {
      try {
        await axios
          .get(
            `${api}/bookSearch/get_book_by_title_and_publisher/${issueDetails?.title}/${issueDetails?.publisher}`
          )
          .then((res) => {
            res.data && setSearchedBooks(res.data);
          });
      } catch (err) {
        NotificationManager.error("Error in getting searched books!");
      }
    } else if (!Object.values(issueDetails).includes("")) {
      try {
        await axios
          .get(
            `${api}/bookSearch/get_book_by_title_author_publisher/${issueDetails?.title}/${issueDetails?.author}/${issueDetails?.publisher}`
          )
          .then((res) => {
            res.data && setSearchedBooks(res.data);
          });
      } catch (err) {
        NotificationManager.error("Error in getting searched books!");
      }
    }
  };

  const handleClearForm = () => {
    const clearIssueDetails = {
      title: "",
      author: "",
      publisher: "",
    };

    setIssueDetails(clearIssueDetails);
    setSearchedBooks([]);
  };

  useEffect(() => {
    getBooksToShow();
  }, [issueDetails]);

  return (
    <div>
      <NotificationContainer />
      <div className="issue-book-container">
        <h3>Enter Details</h3>
        <div className="book-issue-form">
          <form>
            <div>
              <input
                type="text"
                placeholder="Book Title"
                className="input-1"
                value={issueDetails.title}
                onChange={(e) =>
                  setIssueDetails({ ...issueDetails, title: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Author"
                className="input-1"
                value={issueDetails.author}
                onChange={(e) =>
                  setIssueDetails({ ...issueDetails, author: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Publisher"
                className="input-1"
                value={issueDetails.publisher}
                onChange={(e) =>
                  setIssueDetails({
                    ...issueDetails,
                    publisher: e.target.value,
                  })
                }
              />
              <div className="issue-bbok-button-div">
                <input
                  type="button"
                  value="clear form"
                  disabled={issueDetails?.title === ""}
                  onClick={() => handleClearForm()}
                />
                <input
                  type="button"
                  value="Back to Home"
                  onClick={() => navigate("/user-home")}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
      <div className="books-table">
        <div className="table-wrapper">
          <h3>Book Table</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Book Id</th>
                <th>Title</th>
                <th>Author</th>
                <th>Publisher</th>
                <th>category</th>
                <th>copies</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {searchedBooks?.length > 0 &&
                searchedBooks
                  ?.filter((book) => book?.copies !== 0)
                  ?.map((book) => {
                    return (
                      <tr
                        key={book?.id}
                        data-toggle="modal"
                        data-target="#myModal"
                      >
                        <td>{book?.id}</td>
                        <td>{book?.title}</td>
                        <td>{book?.author}</td>
                        <td>{book?.publisher}</td>
                        <td>{book?.category}</td>
                        <td>{book?.copies}</td>
                        <td>
                          <button
                            className="nav-button"
                            onClick={() => setOpenIssueBook(book?.id)}
                          >
                            Issue
                          </button>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
          {searchedBooks?.length === 0 && <h4>No books found!</h4>}
          {!searchedBooks && <h4>Enter details to see book availability</h4>}
        </div>
      </div>
      {openIssueBook && (
        <BookDetails book={openIssueBook} setOpenIssueBook={setOpenIssueBook} />
      )}
    </div>
  );
}

export default IssueBook;
