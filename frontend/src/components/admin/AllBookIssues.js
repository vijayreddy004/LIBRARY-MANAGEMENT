import axios from "axios";
import React, { useEffect, useState } from "react";
import { NotificationManager } from "react-notifications";

function AllBookIssues() {
  const api = "http://127.0.0.1:8000";
  const token = localStorage.getItem("token");
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const [allBookIssues, setAllBookIssues] = useState([]);

  const getAllBookIssues = async () => {
    try {
      await axios.get(`${api}/bookIssues/get_all`).then((res) => {
        res?.data && setAllBookIssues(res.data);
      });
    } catch {
      NotificationManager.error("Error in getting all book issue details!");
    }
  };

  const handlePendingIssueBook = async (bookIssueId) => {
    if (bookIssueId !== "") {
      try {
        await axios
          .put(`${api}/update_bookIssue=${bookIssueId}`)
          .then((res) => {
            res?.data &&
              NotificationManager.success(
                "Book issue record updated successfully"
              );
            getAllBookIssues();
          });
      } catch (err) {
        NotificationManager.error(err.response.data.detail);
      }
    }
  };

  const handleDeleteIssueBook = async (bookIssueId) => {
    if (bookIssueId !== "") {
      try {
        await axios
          .delete(`${api}/bookIssues/delete_returned_book=${bookIssueId}`, {
            headers,
          })
          .then((res) => {
            res?.data && NotificationManager.success(res.data?.message);
            getAllBookIssues();
          });
      } catch {
        NotificationManager.error("Error in removing returned book record!");
      }
    }
  };

  useEffect(() => {
    getAllBookIssues();
  }, []);

  return (
    <div className="home-container">
      <div
        className="books-table"
        style={{ marginInline: "0px", marginBlockStart: "0px" }}
      >
        <div className="table-wrapper">
          <h3>Book issued by you</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Index</th>
                <th>Book Title</th>
                <th>Issued By User</th>
                <th>Issue Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {allBookIssues?.length > 0 &&
                allBookIssues.map((book, index) => {
                  return (
                    <tr
                      key={book?.id}
                      data-toggle="modal"
                      data-target="#myModal"
                    >
                      <td>{index + 1}</td>
                      <td>{book?.bookname}</td>
                      <td>{book?.username}</td>
                      <td>{book?.issue_status}</td>
                      <td>
                        {book?.issue_status === "pending" ? (
                          <button
                            className="nav-button"
                            onClick={() => handlePendingIssueBook(book?.id)}
                          >
                            Issue
                          </button>
                        ) : book?.issue_status === "returned" ? (
                          <button
                            className="nav-button"
                            onClick={() => handleDeleteIssueBook(book?.id)}
                          >
                            Remove
                          </button>
                        ) : (
                          "--"
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {allBookIssues?.length === 0 && <h4>No books issue record found!</h4>}
        </div>
      </div>
    </div>
  );
}

export default AllBookIssues;
