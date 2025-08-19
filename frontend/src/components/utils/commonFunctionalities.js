import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { NotificationManager } from "react-notifications";

const api = "http://127.0.0.1:8000";
const token = localStorage.getItem("token");
const headers = {
  Authorization: `Bearer ${token}`,
};

// check for token active or not
export const checkToken = () => {
  let decodedToken = token && jwtDecode(token);
  let currentDate = new Date();

  if (token) {
    if (decodedToken?.exp * 1000 < currentDate.getTime()) {
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
};

export const handleLogout = async () => {
  try {
    await axios.post(`${api}/librarians/sign_out`).then((res) => {
      NotificationManager.success("Librarian signed out sussessfully");
      localStorage.clear();
      // window.location.reload();
    });
  } catch (err) {
    NotificationManager.error(err);
  }
};

// check user exists in db or not
export const checkUser = async (username) => {
  if (username !== "") {
    try {
      let userRes = await axios.get(
        `${api}/users/check_user_in_db=${username}`
      );
      return userRes?.data;
    } catch (err) {
      NotificationManager.error(err);
    }
  }
};
