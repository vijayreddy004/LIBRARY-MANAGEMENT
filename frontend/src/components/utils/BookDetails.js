import React, { useEffect, useState } from "react";
import axios from "axios";
import "./bookDetails.css";
import { checkUser } from "./commonFunctionalities";
import { NotificationManager } from "react-notifications";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";

function BookDetails({ book, setOpenIssueBook }) {
  const api = "http://127.0.0.1:8000";
  const [username, setUsername] = useState("");
  const [bookDetails, setBookDetails] = useState({});

  const getBookDetails = () => {
    if (book && book !== "myModal") {
      try {
        axios.get(`${api}/books/get_book_by_id=${book}`).then((res) => {
          res?.data && setBookDetails(res.data);
        });
      } catch (err) {
        NotificationManager.error(err);
      }
    }
  };

  const handleIssueBook = async () => {
    let userId = username !== "" && (await checkUser(username));
    let bookIssueDetails = {
      book_id: bookDetails?.id,
      user_id: userId,
    };

    try {
      await axios.post(`${api}/bookIssues/`, bookIssueDetails).then((res) => {
        setOpenIssueBook("");
        NotificationManager.success("Book issued proceeded successfully");
      });
    } catch (err) {
      NotificationManager.error(err.response.data.detail);
    }
  };

  useEffect(() => {
    const myModal = document.querySelector(".details-modal");
    const myInput = document.querySelector(".details-modal-close");

    if (myModal && myInput && bookDetails) {
      setOpenIssueBook("myModal");

      const closeModal = () => {
        setOpenIssueBook("");
      };

      myInput.addEventListener("click", closeModal);

      myModal.addEventListener("click", (event) => {
        if (
          event.target === myModal.querySelector(".details-modal-content") ||
          event.target.closest(".details-modal-content")
        ) {
          return;
        }
        closeModal();
      });

      return () => {
        myInput.removeEventListener("click", closeModal);
        myModal.removeEventListener("click", closeModal);
      };
    }
  }, [bookDetails, setOpenIssueBook]);

  useEffect(() => {
    getBookDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book]);

  return (
    <div>
      <div
        className="details-modal-overlay"
        onClick={() => setOpenIssueBook("")}
      ></div>
      <div className="details-modal">
        <div className="details-modal-title">
          <h1>Issue Book Here</h1>
        </div>
        <div
          className="details-modal-close"
          onClick={() => setOpenIssueBook("")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M13.7071 1.70711C14.0976 1.31658 14.0976 0.683417 13.7071 0.292893C13.3166 -0.0976311 12.6834 -0.0976311 12.2929 0.292893L7 5.58579L1.70711 0.292893C1.31658 -0.0976311 0.683417 -0.0976311 0.292893 0.292893C-0.0976311 0.683417 -0.0976311 1.31658 0.292893 1.70711L5.58579 7L0.292893 12.2929C-0.0976311 12.6834 -0.0976311 13.3166 0.292893 13.7071C0.683417 14.0976 1.31658 14.0976 1.70711 13.7071L7 8.41421L12.2929 13.7071C12.6834 14.0976 13.3166 14.0976 13.7071 13.7071C14.0976 13.3166 14.0976 12.6834 13.7071 12.2929L8.41421 7L13.7071 1.70711Z"
              fill="black"
            />
          </svg>
        </div>
        <div className="details-modal-content">
          <div>
            <div className="card">
              <div className="card-body">
                <div className="book-title">
                  <AutoStoriesIcon />
                  <h5 className="card-title">{bookDetails?.title}</h5>
                </div>
                <h6 className="card-subtitle mb-2 text-body-secondary">
                  by {bookDetails?.author}
                </h6>
                <p className="card-text">
                  published by: {bookDetails?.publisher}
                </p>
                <span>total copies available: {bookDetails?.copies}</span>
              </div>
            </div>
          </div>
          <div className="user-issue">
            <input
              type="text"
              placeholder="User Name"
              className="input-1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <div className="issue-bbok-button-div">
              <input
                type="button"
                value="Issue"
                disabled={username === ""}
                onClick={() => handleIssueBook()}
              />
              <input
                type="button"
                value="Back"
                onClick={() => setOpenIssueBook("")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookDetails;
