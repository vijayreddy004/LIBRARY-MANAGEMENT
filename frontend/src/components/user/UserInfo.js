import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Modal, Typography } from "@mui/material";
import { checkUser, checkToken } from "../utils/commonFunctionalities";
import {
  NotificationContainer,
  NotificationManager,
} from "react-notifications";

function UserInfo() {
  const navigate = useNavigate();
  const api = "http://127.0.0.1:8000";
  const token = localStorage.getItem("token");
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const [openUserModal, setOpenUserModal] = useState(true);
  const [openUserRegisterModal, setOpenUserRegisterModal] = useState(false);
  const [username, setUsername] = useState("");
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    has_issued: false,
  });
  const [bookDetailsByUser, setBookDetailsByUser] = useState([]);

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 500,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "20px",
  };

  const handleClose = () => {
    openUserRegisterModal
      ? setOpenUserRegisterModal(false)
      : setOpenUserModal(false);
  };

  const getBookDetailsByUser = async () => {
    let userId = username !== "" && (await checkUser(username));
    try {
      await axios.get(`${api}/get_bookIssues_by_user=${userId}`).then((res) => {
        res?.data && setBookDetailsByUser(res.data);
        handleClose();
      });
    } catch {
      NotificationManager.error("Error in showing user library info!");
    }
  };

  const checkUserAndShowInfo = async () => {
    let userId = username !== "" && (await checkUser(username));
    if (userId === 0) {
      setOpenUserRegisterModal(true);
    } else {
      await getBookDetailsByUser();
    }
  };

  const handleNewUserAndShowInfo = async () => {
    let isActiveToken = checkToken();
    if (isActiveToken) {
      try {
        await axios
          .post(`${api}/users/`, newUser, { headers })
          .then(async (res) => {
            NotificationManager.success("New user created successfully");
            setOpenUserRegisterModal(false);
            setOpenUserModal(false);
            await getBookDetailsByUser();
            setNewUser({});
          });
      } catch (err) {
        NotificationManager.error(
          "Error in creating new user and showing info!"
        );
      }
    } else {
      NotificationManager.info(
        "Please wait for librarian to let you registered"
      );
    }
  };

  const handleReturnBook = async (book) => {
    if (book.issue_status === "issued") {
      try {
        await axios
          .put(`${api}/bookIssues/return_bookIssue=${book.id}`)
          .then((res) => {
            res?.data && NotificationManager.success(res.data?.message);
            getBookDetailsByUser();
          });
      } catch (err) {
        NotificationManager.error(err);
      }
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <div className="header_logo">
            <span style={{ color: "azure", fontFamily: "math" }}>
              Welcome to library, <b>{!openUserModal && username}</b>
            </span>
          </div>
          <div
            className="collapse navbar-collapse nav_buttons"
            id="navbarSupportedContent"
          >
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <button className="nav-button" onClick={() => navigate("/")}>
                  Back
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <NotificationContainer />
      <div className="books-table">
        <div className="table-wrapper">
          <h3>Book issued by you</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Index</th>
                <th>Book Title</th>
                <th>Issue Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookDetailsByUser?.length > 0 &&
                bookDetailsByUser
                  ?.filter((book) => book?.issue_status !== "returned")
                  ?.map((book, index) => {
                    return (
                      <tr
                        key={book?.id}
                        data-toggle="modal"
                        data-target="#myModal"
                      >
                        <td>{index + 1}</td>
                        <td>{book?.bookname}</td>
                        <td>{book?.issue_status}</td>
                        <td>
                          {book?.issue_status === "issued" ? (
                            <button
                              className="nav-button"
                              onClick={() => handleReturnBook(book)}
                            >
                              Return
                            </button>
                          ) : (
                            "--"
                          )}
                        </td>
                      </tr>
                    );
                  })}
              {bookDetailsByUser?.filter(
                (book) => book?.issue_status !== "returned"
              ).length === 0 && (
                <tr>
                  <td colSpan="4">No book found</td>
                </tr>
              )}
            </tbody>
          </table>
          {bookDetailsByUser?.length === 0 && <h4>No books found!</h4>}
        </div>
      </div>
      <Modal
        open={openUserRegisterModal ? openUserRegisterModal : openUserModal}
        onClose={
          openUserRegisterModal
            ? () => setOpenUserRegisterModal(false)
            : handleClose
        }
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography
            id="modal-modal-title"
            variant="h6"
            component="h2"
            color="black"
          >
            {openUserRegisterModal ? "New User Info" : "User Info"}
          </Typography>
          {openUserRegisterModal ? (
            <>
              <input
                type="text"
                placeholder="User Name"
                className="input-1"
                value={newUser.username}
                onChange={(e) => {
                  setNewUser({ ...newUser, username: e.target.value });
                  setUsername(e.target.value);
                }}
                required
              />
              <input
                type="email"
                placeholder="User Email"
                className="input-1"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="input-1"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                required
              />
              <input
                type="button"
                value="Register to proceed"
                onClick={() => handleNewUserAndShowInfo()}
              />
              <input
                type="button"
                value="Close"
                onClick={() => setOpenUserRegisterModal(false)}
              />
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="User Name"
                className="input-1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <div
                style={{ display: "grid", justifyItems: "center", gap: "10px" }}
              >
                <input
                  type="button"
                  value="view info"
                  onClick={() => checkUserAndShowInfo()}
                />
                <div className="s-part">
                  New user?
                  <span
                    onClick={() => {
                      setOpenUserRegisterModal(true);
                    }}
                  >
                    Sign up
                  </span>
                </div>
              </div>
            </>
          )}
        </Box>
      </Modal>
    </>
  );
}

export default UserInfo;
