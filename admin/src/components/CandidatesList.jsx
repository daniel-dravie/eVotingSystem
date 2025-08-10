import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField,
  Paper,
  Avatar,
  Typography,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField as MuiTextField,
} from "@mui/material";
import { Search, Print, Edit, Delete, Visibility } from "@mui/icons-material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const CandidatesList = () => {
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const candidatesCollection = collection(db, "candidates");
        const candidatesSnapshot = await getDocs(candidatesCollection);
        const candidatesList = candidatesSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => a.portfolioName?.localeCompare(b.portfolioName));

        setCandidates(candidatesList);
      } catch (err) {
        console.error("Error fetching candidates:", err.message);
        setError("Failed to fetch candidates.");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this candidate?")) {
      try {
        await deleteDoc(doc(db, "candidates", id));
        setCandidates((prevCandidates) =>
          prevCandidates.filter((candidate) => candidate.id !== id)
        );
        alert("Candidate deleted successfully");
      } catch (error) {
        console.error("Error deleting candidate:", error.message);
        alert("Error deleting candidate. Please try again.");
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (
      selectedCandidateIds.length === 0 ||
      !window.confirm("Are you sure you want to delete selected candidates?")
    ) {
      return;
    }

    try {
      const deletePromises = selectedCandidateIds.map((id) =>
        deleteDoc(doc(db, "candidates", id))
      );
      await Promise.all(deletePromises);
      setCandidates((prev) =>
        prev.filter((candidate) => !selectedCandidateIds.includes(candidate.id))
      );
      setSelectedCandidateIds([]);
      setSelectAll(false);
      alert("Selected candidates deleted successfully");
    } catch (error) {
      console.error("Error deleting selected candidates:", error.message);
      alert("Failed to delete some or all candidates.");
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedCandidateIds((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((selectedId) => selectedId !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCandidateIds([]);
    } else {
      const allIds = filteredCandidates.map((candidate) => candidate.id);
      setSelectedCandidateIds(allIds);
    }
    setSelectAll(!selectAll);
  };

  const handleUpdateCandidate = async () => {
    if (selectedCandidate) {
      try {
        const candidateRef = doc(db, "candidates", selectedCandidate.id);
        await updateDoc(candidateRef, {
          fullName: selectedCandidate.fullName,
          indexNumber: selectedCandidate.indexNumber,
          portfolioName: selectedCandidate.portfolioName,
          sex: selectedCandidate.sex,
        });
        setCandidates(
          candidates.map((candidate) =>
            candidate.id === selectedCandidate.id
              ? selectedCandidate
              : candidate
          )
        );
        setOpenEditDialog(false);
        alert("Candidate updated successfully");
      } catch (error) {
        console.error("Error updating candidate:", error);
        alert("Error updating candidate");
      }
    }
  };

  const handleEdit = (candidate) => {
    setSelectedCandidate(candidate);
    setOpenEditDialog(true);
  };

  const handleView = (candidate) => {
    setSelectedCandidate(candidate);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCandidate(null);
  };

  const exportToExcel = () => {
    const candidatesToExport = candidates.map((candidate) => ({
      Name: candidate.fullName,
      IndexNumber: candidate.indexNumber,
      Position: candidate.portfolioName,
      Sex: candidate.sex,
    }));

    const worksheet = XLSX.utils.json_to_sheet(candidatesToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "candidates");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(data, "Candidate_list.xlsx");
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <CircularProgress />
        <Typography>Loading candidates...</Typography>
      </div>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.indexNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.portfolioName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: "20px" }}>
      <Typography
        variant="h4"
        gutterBottom
        textAlign={"center"}
        fontWeight={"bold"}
      >
        Candidates List
      </Typography>

      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}
      >
        <TextField
          label="Search for candidates"
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
        <Button
          variant="contained"
          color="primary"
          startIcon={<Print />}
          onClick={exportToExcel}
          style={{ marginLeft: "auto" }}
        >
          Export to Excel
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={selectedCandidateIds.length === 0}
          onClick={handleDeleteSelected}
          style={{ marginLeft: "10px" }}
        >
          Delete Selected
        </Button>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </TableCell>
              {["Image", "Name", "Index No.", "Sex", "Position", "Actions"].map(
                (header) => (
                  <TableCell key={header}>
                    <Typography sx={{ fontWeight: "bold" }}>
                      {header}
                    </Typography>
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedCandidateIds.includes(candidate.id)}
                      onChange={() => handleCheckboxChange(candidate.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Avatar
                      alt={candidate.fullName}
                      src={
                        candidate.imageUrl &&
                        candidate.imageUrl.startsWith("http")
                          ? candidate.imageUrl
                          : "https://placehold.co/150x150"
                      }
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/150x150";
                      }}
                      style={{ width: 50, height: 50 }}
                    />
                  </TableCell>
                  <TableCell>{candidate.fullName}</TableCell>
                  <TableCell>{candidate.indexNumber}</TableCell>
                  <TableCell>{candidate.sex}</TableCell>
                  <TableCell>{candidate.portfolioName}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleView(candidate)}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      onClick={() => handleEdit(candidate)}
                      color="secondary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(candidate.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography>No candidates found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Candidate Dialog with Flyer Generator */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Candidate Details</DialogTitle>
        <DialogContent>
          {selectedCandidate && (
            <>
              <DialogContentText>
                <Avatar
                  alt={selectedCandidate.fullName}
                  src={
                    selectedCandidate.imageUrl &&
                    selectedCandidate.imageUrl.startsWith("http")
                      ? selectedCandidate.imageUrl
                      : "https://placehold.co/150x150"
                  }
                  style={{ width: 100, height: 100, marginBottom: "10px" }}
                />
                <Typography>
                  <strong>Name: </strong>
                  {selectedCandidate.fullName}
                </Typography>
                <Typography>
                  <strong>Index Number: </strong>
                  {selectedCandidate.indexNumber}
                </Typography>
                <Typography>
                  <strong>Position: </strong>
                  {selectedCandidate.portfolioName}
                </Typography>
                <Typography>
                  <strong>Sex: </strong>
                  {selectedCandidate.sex}
                </Typography>
              </DialogContentText>

            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

    

      {/* Edit Candidate Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit Candidate</DialogTitle>
        <DialogContent>
          {selectedCandidate && (
            <div>
              <MuiTextField
                label="Full Name"
                fullWidth
                value={selectedCandidate.fullName}
                onChange={(e) =>
                  setSelectedCandidate({
                    ...selectedCandidate,
                    fullName: e.target.value,
                  })
                }
                style={{ marginBottom: "10px" }}
              />
              <MuiTextField
                label="Index Number"
                fullWidth
                value={selectedCandidate.indexNumber}
                onChange={(e) =>
                  setSelectedCandidate({
                    ...selectedCandidate,
                    indexNumber: e.target.value,
                  })
                }
                style={{ marginBottom: "10px" }}
              />
              <MuiTextField
                label="Position"
                fullWidth
                value={selectedCandidate.portfolioName}
                onChange={(e) =>
                  setSelectedCandidate({
                    ...selectedCandidate,
                    portfolioName: e.target.value,
                  })
                }
                style={{ marginBottom: "10px" }}
              />
              <MuiTextField
                label="Sex"
                fullWidth
                value={selectedCandidate.sex}
                onChange={(e) =>
                  setSelectedCandidate({
                    ...selectedCandidate,
                    sex: e.target.value,
                  })
                }
                style={{ marginBottom: "10px" }}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleUpdateCandidate} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CandidatesList;
