import axios from "axios";
import React, { useEffect, useState } from "react";
import { Box, Modal, Typography } from "@mui/material";
import { NotificationManager } from "react-notifications";
import { DriveFileRenameOutline, Delete } from "@mui/icons-material";

function AllBooks() {
  const api = "http://127.0.0.1:8000";
  const token = localStorage.getItem("token");
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const [allBooks, setAllBooks] = useState([]);
  const [openAddEditBookModel, setOpenAddEditBookModel] = useState("");
  const [newBookDetails, setNewBookDetails] = useState({
    title: "",
    author: "",
    publisher: "",
    category: "",
    copies: 0,
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

  const getAllBooks = async () => {
    try {
      await axios.get(`${api}/books/get_details`).then((res) => {
        res?.data && setAllBooks(res.data);
      });
    } catch {
      NotificationManager.error("Error in getting all books!");
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (bookId !== "") {
      try {
        await axios
          .delete(`${api}/books/delete_book_by_id=${bookId}`, { headers })
          .then((res) => {
            res?.data && NotificationManager.success(res.data.message);
            getAllBooks();
          });
      } catch {
        NotificationManager.error("Error in deleting book!");
      }
    }
  };

  const handleAddNewBook = async () => {
    if (!Object.values(newBookDetails).includes("")) {
      try {
        await axios
          .post(`${api}/books/`, newBookDetails, { headers })
          .then((res) => {
            getAllBooks();
            setNewBookDetails({});
            setOpenAddEditBookModel("");
          });
      } catch {
        NotificationManager.error("Error in adding book!");
      }
    }
  };

  const handleEditBook = async () => {
    let bookIdToEdit = newBookDetails?.id;
    if (bookIdToEdit !== "") {
      try {
        await axios
          .put(
            `${api}/books/update_book_by_id=${bookIdToEdit}`,
            newBookDetails,
            { headers }
          )
          .then((res) => {
            res?.data && getAllBooks();
            setOpenAddEditBookModel("");
            setNewBookDetails({});
            NotificationManager.success("Book updated successfully");
          });
      } catch {
        NotificationManager.error("Error in updating book!");
      }
    } else {
      NotificationManager.error("Book not found!");
    }
  };

  useEffect(() => {
    getAllBooks();
  }, []);

  return (
    <div className="home-container">
      <div
        className="books-table"
        style={{ marginInline: "0px", marginBlockStart: "0px" }}
      >
        <div className="table-wrapper">
          <div className="book-tab-div">
            <h3>All Books</h3>
            <button
              className="nav-button"
              onClick={() => setOpenAddEditBookModel("add")}
            >
              Add New Book
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Index</th>
                <th>Book Title</th>
                <th>Author</th>
                <th>Publisher</th>
                <th>Category</th>
                <th>copies</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {allBooks?.length > 0 &&
                allBooks.map((book, index) => {
                  return (
                    <tr
                      key={book?.id}
                      data-toggle="modal"
                      data-target="#myModal"
                    >
                      <td>{index + 1}</td>
                      <td>{book?.title}</td>
                      <td>{book?.author}</td>
                      <td>{book?.publisher}</td>
                      <td>{book?.category}</td>
                      <td>{book?.copies}</td>
                      <td>
                        <button
                          className="nav-button"
                          onClick={() => {
                            setNewBookDetails(book);
                            setOpenAddEditBookModel("edit");
                          }}
                        >
                          <DriveFileRenameOutline />
                        </button>
                        <button
                          className="nav-button"
                          onClick={() => handleDeleteBook(book?.id)}
                        >
                          <Delete />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {allBooks?.length === 0 && <h4>No books found!</h4>}
        </div>
      </div>
      <Modal
        open={openAddEditBookModel === "add" || openAddEditBookModel === "edit"}
        onClose={() => {
          setOpenAddEditBookModel("");
          setNewBookDetails({});
        }}
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
            {openAddEditBookModel === "edit"
              ? "Update book details here"
              : "Please Fill New Book Details"}
          </Typography>
          <input
            type="text"
            placeholder="Book Title"
            className="input-1"
            value={newBookDetails?.title}
            onChange={(e) =>
              setNewBookDetails({ ...newBookDetails, title: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="Author"
            className="input-1"
            value={newBookDetails?.author}
            onChange={(e) =>
              setNewBookDetails({ ...newBookDetails, author: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="Publisher"
            className="input-1"
            value={newBookDetails?.publisher}
            onChange={(e) =>
              setNewBookDetails({
                ...newBookDetails,
                publisher: e.target.value,
              })
            }
            required
          />
          <input
            type="text"
            placeholder="Category"
            className="input-1"
            value={newBookDetails?.category}
            onChange={(e) =>
              setNewBookDetails({ ...newBookDetails, category: e.target.value })
            }
            required
          />
          <input
            type="number"
            placeholder="Copies"
            className="input-1"
            value={newBookDetails?.copies === 0 ? "" : newBookDetails?.copies}
            onChange={(e) =>
              setNewBookDetails({ ...newBookDetails, copies: e.target.value })
            }
            required
          />
          <div className="book-add-button">
            <input
              type="button"
              value={openAddEditBookModel === "edit" ? "Edit" : "Add"}
              disabled={Object.values(newBookDetails).includes("")}
              onClick={() => {
                openAddEditBookModel === "edit"
                  ? handleEditBook()
                  : handleAddNewBook();
              }}
            />
            <input
              type="button"
              value="Close"
              onClick={() => {
                setOpenAddEditBookModel("");
                setNewBookDetails({});
              }}
            />
          </div>
        </Box>
      </Modal>
    </div>
  );
}

export default AllBooks;
