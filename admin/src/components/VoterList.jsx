import { useEffect, useState } from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  TextField,
  Button,
  Snackbar,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Visibility, Edit, Delete, Search, Print } from "@mui/icons-material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import MuiAlert from "@mui/material/Alert";

const VoterList = () => {
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingVoterId, setEditingVoterId] = useState(null);
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [selectedVoterIds, setSelectedVoterIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    const fetchVoters = async () => {
      setLoading(true);
      try {
        const votersCollection = collection(db, "voters");
        const votersSnapshot = await getDocs(votersCollection);
        const votersList = votersSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => a.indexNumber.localeCompare(b.indexNumber));
        setVoters(votersList);
      } catch (error) {
        console.error("Error fetching voters:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVoters();
  }, []);

  const handleSelectAllChange = (event) => {
    const checked = event.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedVoterIds(filteredVoters.map((voter) => voter.id));
    } else {
      setSelectedVoterIds([]);
    }
  };

  const handleCheckboxChange = (voterId) => {
    setSelectedVoterIds((prevSelected) =>
      prevSelected.includes(voterId)
        ? prevSelected.filter((id) => id !== voterId)
        : [...prevSelected, voterId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedVoterIds.length === 0) return;
    if (
      window.confirm("Are you sure you want to delete the selected voters?")
    ) {
      try {
        await Promise.all(
          selectedVoterIds.map((id) => deleteDoc(doc(db, "voters", id)))
        );
        setVoters((prev) =>
          prev.filter((voter) => !selectedVoterIds.includes(voter.id))
        );
        setSelectedVoterIds([]);
        setSelectAll(false);
        setSnackbarMessage("Selected voters deleted successfully");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      } catch (error) {
        console.error("Error deleting voters:", error);
        setSnackbarMessage("Error deleting selected voters");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    }
  };

  const handleView = (voter) => {
    setSelectedVoter(voter);
  };

  const handleEdit = (voter) => {
    setSelectedVoter(voter);
    setEditingVoterId(voter.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this voter?")) {
      try {
        await deleteDoc(doc(db, "voters", id));
        setVoters(voters.filter((voter) => voter.id !== id));
        setSnackbarMessage("Voter deleted successfully");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      } catch (error) {
        console.error("Error deleting voter:", error);
        setSnackbarMessage("Error deleting voter");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    }
  };

  const filteredVoters = voters.filter(
    (voter) =>
      voter.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.year.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.indexNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToExcel = () => {
    const votersToExport = filteredVoters.map((voter) => ({
      Name: voter.fullName,
      "Index Number": voter.indexNumber,
      Class: voter.className,
      Year: voter.year,
      "Is Voted": voter.isVoted ? "Yes" : "No",
    }));

    const worksheet = XLSX.utils.json_to_sheet(votersToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Voters");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(data, "voter_list.xlsx");
  };

  const handleUpdateVoter = async () => {
    if (selectedVoter) {
      try {
        const voterRef = doc(db, "voters", selectedVoter.id);
        await updateDoc(voterRef, {
          fullName: selectedVoter.fullName,
          className: selectedVoter.className,
          year: selectedVoter.year,
        });

        // Synchronize candidate name if voter is registered as candidate
        const candidatesRef = collection(db, "candidates");
        const candidateQuery = query(
          candidatesRef,
          where("indexNumber", "==", selectedVoter.indexNumber)
        );
        const candidateSnapshot = await getDocs(candidateQuery);
        if (!candidateSnapshot.empty) {
          const candidateDoc = candidateSnapshot.docs[0];
          const candidateRef = doc(db, "candidates", candidateDoc.id);
          await updateDoc(candidateRef, {
            fullName: selectedVoter.fullName,
          });
        }

        setVoters(
          voters.map((voter) =>
            voter.id === selectedVoter.id ? selectedVoter : voter
          )
        );
        setEditingVoterId(null);
        setSelectedVoter(null);
        setSnackbarMessage("Voter updated successfully");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      } catch (error) {
        console.error("Error updating voter:", error);
        setSnackbarMessage("Error updating voter");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    }
  };

  const handleClearAllCodes = async () => {
    if (window.confirm("Are you sure you want to clear all voter codes?")) {
      try {
        const updatePromises = voters.map((voter) => {
          const voterRef = doc(db, "voters", voter.id);
          return updateDoc(voterRef, { code: "" });
        });
        await Promise.all(updatePromises);
        setVoters(voters.map((voter) => ({ ...voter, code: "" })));
        setSnackbarMessage("All voter codes have been cleared.");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      } catch (error) {
        console.error("Error clearing codes:", error);
        setSnackbarMessage("Error clearing voter codes.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    }
  };

  const handleResetAllVotes = async () => {
    if (window.confirm("Are you sure you want to reset all votes to 'No'?")) {
      try {
        const updatePromises = voters.map((voter) => {
          const voterRef = doc(db, "voters", voter.id);
          return updateDoc(voterRef, { isVoted: false });
        });
        await Promise.all(updatePromises);
        setVoters(voters.map((voter) => ({ ...voter, isVoted: false })));
        setSnackbarMessage("All votes have been reset to 'No'.");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      } catch (error) {
        console.error("Error resetting votes:", error);
        setSnackbarMessage("Error resetting votes.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <div style={{ padding: "20px" }}>
      <Typography
        variant="h4"
        gutterBottom
        textAlign="center"
        fontWeight="bold"
      >
        Voters List
      </Typography>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<Print />}
          onClick={exportToExcel}
        >
          Export to Excel
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleClearAllCodes}
          style={{ marginLeft: "auto" }}
        >
          Clear All Codes
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleResetAllVotes}
        >
          Reset All Votes
        </Button>
        <Button variant="contained" color="error" onClick={handleBulkDelete}>
          Delete Selected
        </Button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <TextField
          label="Search by Name or Index Number"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "480px" }}
          InputProps={{
            startAdornment: (
              <IconButton size="small" edge="start">
                <Search />
              </IconButton>
            ),
          }}
        />
      </div>
      <FormControlLabel
        control={
          <Checkbox checked={selectAll} onChange={handleSelectAllChange} />
        }
        label="Select All"
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>
                <strong>Full Name</strong>
              </TableCell>
              <TableCell>
                <strong>Index Number</strong>
              </TableCell>
              <TableCell>
                <strong>Class</strong>
              </TableCell>
              <TableCell>
                <strong>Year</strong>
              </TableCell>
              <TableCell>
                <strong>Voted</strong>
              </TableCell>
              <TableCell>
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVoters.map((voter) => (
              <TableRow key={voter.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedVoterIds.includes(voter.id)}
                    onChange={() => handleCheckboxChange(voter.id)}
                  />
                </TableCell>
                <TableCell>
                  {editingVoterId === voter.id ? (
                    <TextField
                      value={selectedVoter?.fullName || voter.fullName}
                      onChange={(e) =>
                        setSelectedVoter({
                          ...selectedVoter,
                          fullName: e.target.value,
                        })
                      }
                      size="small"
                    />
                  ) : (
                    voter.fullName
                  )}
                </TableCell>
                <TableCell>{voter.indexNumber}</TableCell>
                <TableCell>
                  {editingVoterId === voter.id ? (
                    <TextField
                      value={selectedVoter?.className || voter.className}
                      onChange={(e) =>
                        setSelectedVoter({
                          ...selectedVoter,
                          className: e.target.value,
                        })
                      }
                      size="small"
                    />
                  ) : (
                    voter.className
                  )}
                </TableCell>
                <TableCell>
                  {editingVoterId === voter.id ? (
                    <TextField
                      value={selectedVoter?.year || voter.year}
                      onChange={(e) =>
                        setSelectedVoter({
                          ...selectedVoter,
                          year: e.target.value,
                        })
                      }
                      size="small"
                    />
                  ) : (
                    voter.year
                  )}
                </TableCell>
                <TableCell>{voter.isVoted ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleView(voter)} color="primary">
                    <Visibility />
                  </IconButton>
                  {editingVoterId === voter.id ? (
                    <>
                      <IconButton
                        onClick={handleUpdateVoter}
                        color="success"
                        size="small"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          setEditingVoterId(null);
                          setSelectedVoter(null);
                        }}
                        color="error"
                        size="small"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </IconButton>
                    </>
                  ) : (
                    <IconButton
                      onClick={() => handleEdit(voter)}
                      color="secondary"
                    >
                      <Edit />
                    </IconButton>
                  )}
                  <IconButton
                    onClick={() => handleDelete(voter.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default VoterList;
