import axios from "axios";
import React, { useEffect, useState } from "react";
import { Box, Modal, Typography } from "@mui/material";
import { NotificationManager } from "react-notifications";

function AllUsers() {
  const api = "http://127.0.0.1:8000";
  const token = localStorage.getItem("token");
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const [allUsers, setAllUsers] = useState([]);
  const [openAddEditUserModel, setOpenAddEditUserModel] = useState("");
  const [password, setPassword] = useState("");
  const [newUserDetails, setNewUserDetails] = useState({
    username: "",
    email: "",
    password: "",
    has_issued: false,
  });

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
    width: 550,
    background: "aliceblue",
    borderRadius: 3,
    textAlign: "center",
  };

  const getAllUsers = async () => {
    try {
      await axios.get(`${api}/users/get_users`, { headers }).then((res) => {
        res?.data && setAllUsers(res.data);
      });
    } catch (err) {
      NotificationManager.error("Error in getting all users!");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId !== "") {
      try {
        await axios
          .delete(`${api}/users/delete_user_by_id=${userId}`, { headers })
          .then((res) => {
            res?.data && NotificationManager.success(res.data?.message);
            getAllUsers();
          });
      } catch (err) {
        NotificationManager.error("Error in removing user!");
      }
    }
  };

  const handleAddNewUser = async () => {
    if (
      !Object.values(newUserDetails).includes("") &&
      password === newUserDetails.password
    ) {
      try {
        await axios
          .post(`${api}/users/`, newUserDetails, { headers })
          .then(async (res) => {
            res?.data &&
              NotificationManager.success("New user created successfully");
            getAllUsers();
            setNewUserDetails({});
            setOpenAddEditUserModel("");
          });
      } catch (err) {
        NotificationManager.error(
          "Error in creating new user and showing info!"
        );
      }
    } else {
      NotificationManager.error("Please enter new user details correctly");
    }
  };

  useEffect(() => {
    getAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="home-container">
      <div
        className="books-table"
        style={{ marginInline: "0px", marginBlockStart: "0px" }}
      >
        <div className="table-wrapper">
          <div className="book-tab-div">
            <h3>All Users</h3>
            <button
              className="nav-button"
              onClick={() => setOpenAddEditUserModel("add")}
            >
              Add New User
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Index</th>
                <th>User Name</th>
                <th>Email</th>
                <th>Issue Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {allUsers?.length > 0 &&
                allUsers.map((user, index) => {
                  return (
                    <tr
                      key={user?.id}
                      data-toggle="modal"
                      data-target="#myModal"
                    >
                      <td>{index + 1}</td>
                      <td>{user?.username}</td>
                      <td>{user?.email}</td>
                      <td>{user?.has_issued ? "Issued" : "Not Issued"}</td>
                      <td>
                        <button
                          className="nav-button"
                          onClick={() => handleDeleteUser(user?.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {allUsers?.length === 0 && <h4>No user found!</h4>}
        </div>
      </div>
      <Modal
        open={openAddEditUserModel === "add"}
        onClose={() => setOpenAddEditUserModel("")}
        aria-labelledby="modal-modal-title"
      >
        <Box sx={style}>
          <Typography
            id="modal-modal-title"
            variant="h6"
            component="h2"
            color="black"
            mb="10px"
          >
            Please Fill New User Details
          </Typography>
          <input
            type="text"
            placeholder="User name"
            className="input-1"
            value={newUserDetails?.username}
            onChange={(e) =>
              setNewUserDetails({ ...newUserDetails, username: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="Email"
            className="input-1"
            value={newUserDetails?.email}
            onChange={(e) =>
              setNewUserDetails({ ...newUserDetails, email: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="Password"
            className="input-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Re-enter Password"
            className="input-1"
            value={newUserDetails?.password}
            onChange={(e) =>
              setNewUserDetails({ ...newUserDetails, password: e.target.value })
            }
            required
          />
          <div className="book-add-button">
            <input
              type="button"
              value="Add"
              disabled={Object.values(newUserDetails).includes("")}
              onClick={() => handleAddNewUser()}
            />
            <input
              type="button"
              value="Close"
              onClick={() => setOpenAddEditUserModel("")}
            />
          </div>
        </Box>
      </Modal>
    </div>
  );
}

export default AllUsers;
