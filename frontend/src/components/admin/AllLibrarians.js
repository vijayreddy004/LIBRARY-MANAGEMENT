import React, { useEffect, useState } from "react";
import axios from "axios";
import { NotificationManager } from "react-notifications";

function AllLibrarians() {
  const api = "http://127.0.0.1:8000";
  const token = localStorage.getItem("token");
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const [allLibrarians, setAllLibrarians] = useState([]);

  const getAllLibrarians = async () => {
    try {
      await axios.get(`${api}/librariains/get_all`, { headers }).then((res) => {
        res?.data && setAllLibrarians(res.data);
      });
    } catch (err) {
      NotificationManager.error("Error in getting all librarians!");
    }
  };

  useEffect(() => {
    getAllLibrarians();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="home-container">
      <div
        className="books-table"
        style={{ marginInline: "0px", marginBlockStart: "0px" }}
      >
        <div className="table-wrapper">
          <h3>All librarians</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Index</th>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allLibrarians?.length > 0 &&
                allLibrarians.map((librarian, index) => {
                  return (
                    <tr
                      key={librarian?.librarian_id}
                      data-toggle="modal"
                      data-target="#myModal"
                    >
                      <td>{index + 1}</td>
                      <td>{librarian?.librarian_name}</td>
                      <td>{librarian?.active === true ? "(You)" : "--"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {allLibrarians?.length === 0 && <h4>No librariain found!</h4>}
        </div>
      </div>
    </div>
  );
}

export default AllLibrarians;
