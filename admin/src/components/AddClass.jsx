import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  MenuItem,
  Snackbar,
  Alert as MuiAlert,
} from "@mui/material";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const AddClass = () => {
  const [className, setClassName] = useState("");
  const [year, setYear] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      setFilteredClasses(classes.filter(cls => cls.year === selectedYear));
    } else {
      setFilteredClasses(classes);
    }
  }, [selectedYear, classes]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const classesCollection = collection(db, "classes");
      const classesSnapshot = await getDocs(classesCollection);
      const classesList = classesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClasses(classesList);
    } catch (error) {
      console.error("Error fetching classes:", error);
      showSnackbar("Failed to fetch classes", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    if (!className || !year) {
      showSnackbar("Please provide both class name and year stage", "warning");
      return;
    }

    setLoading(true);
    try {
      // Check if class with same name and year exists
      const q = query(
        collection(db, "classes"),
        where("className", "==", className),
        where("year", "==", year)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        showSnackbar("Class with this name and year stage already exists", "error");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "classes"), { className, year });
      setClassName("");
      setYear("");
      showSnackbar("Class added successfully");
      fetchClasses();
    } catch (error) {
      console.error("Error adding class:", error);
      showSnackbar("Failed to add class", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (id) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        await deleteDoc(doc(db, "classes", id));
        showSnackbar("Class deleted successfully");
        fetchClasses();
      } catch (error) {
        console.error("Error deleting class:", error);
        showSnackbar("Failed to delete class", "error");
      }
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Manage Classes
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={5}>
            <TextField
              label="Class Name"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={5}>
            <TextField
  select
  label="Year"
  value={year}
  onChange={(e) => setYear(e.target.value)}
  fullWidth
>
  <MenuItem value="">Select Year</MenuItem>
  <MenuItem value="2021">2021</MenuItem>
  <MenuItem value="2022">2022</MenuItem>
  <MenuItem value="2023">2023</MenuItem>
  <MenuItem value="2024">2024</MenuItem>
  <MenuItem value="2025">2025</MenuItem>
  <MenuItem value="2026">2026</MenuItem>
</TextField>
          </Grid>
          <Grid item xs={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddClass}
              disabled={loading}
              fullWidth
            >
              Add
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filter Classes by Year
        </Typography>
        <TextField
          select
          label="Select Year"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        >
          <MenuItem value="">All Years</MenuItem>
          <MenuItem value="2021">2021</MenuItem>
          <MenuItem value="2022">2022</MenuItem>
          <MenuItem value="2023">2023</MenuItem>
          <MenuItem value="2024">2024</MenuItem>
          <MenuItem value="2025">2025</MenuItem>
          <MenuItem value="2026">2026</MenuItem>
        </TextField>

        <Typography variant="h6" gutterBottom align="center">
          Existing Classes
        </Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : filteredClasses.length === 0 ? (
          <Typography color="#f70606ff">
            {selectedYear ? `No classes found for ${selectedYear}` : "No classes found"}
          </Typography>
        ) : (
          filteredClasses.map(({ id, className, year }) => (
            <Box
              key={id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
                p: 1,
                border: "1px solid #ccc",
                borderRadius: 1,
              }}
            >
              <Typography>
                {className} - {year}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleDeleteClass(id)}
              >
                Delete
              </Button>
            </Box>
          ))
        )}
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
      >
        <MuiAlert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default AddClass;
