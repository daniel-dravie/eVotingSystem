import { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Typography,
  Container,
  Grid,
  Snackbar,
  Alert as MuiAlert,
  Paper,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  writeBatch,
  doc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { validateFullName } from "../utils/validationService";
import * as XLSX from "xlsx";

// Fallback if validationService isn't imported
const fallbackValidateFullName = (name) => ({
  isValid: !!name && name.trim().length > 0,
  sanitizedName: name.trim(),
  error: !name || name.trim().length === 0 ? "Name is required" : "",
});
const validateFullNameFn =
  typeof validateFullName === "function"
    ? validateFullName
    : fallbackValidateFullName;

const RegisterVoter = () => {
  const [selectedYear, setSelectedYear] = useState("");
  const [nextIndexNumber, setNextIndexNumber] = useState(510001);
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [yearToClassesMap, setYearToClassesMap] = useState({});
  const [filteredClasses, setFilteredClasses] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classesCollection = collection(db, "classes");
        const classesSnapshot = await getDocs(classesCollection);
        const classesList = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAvailableClasses(classesList);

        // Extract unique years from classes
        const years = [
          ...new Set(classesList.map((cls) => cls.year)),
        ].sort();
        setAvailableYears(years);

        // Create year-to-classes mapping for proper filtering
        const yearToClasses = {};
        classesList.forEach((cls) => {
          if (!yearToClasses[cls.year]) {
            yearToClasses[cls.year] = [];
          }
          yearToClasses[cls.year].push(cls);
        });
        setYearToClassesMap(yearToClasses);

        // Set default year if available
        if (years.length > 0) {
          setSelectedYear(years[0]);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        showSnackbar("Failed to fetch classes", "error");
      }
    };
    fetchClasses();
  }, []);

  // Filter classes based on selected year
  useEffect(() => {
    if (selectedYear && yearToClassesMap[selectedYear]) {
      setFilteredClasses(yearToClassesMap[selectedYear]);
    } else {
      setFilteredClasses([]);
    }
    
    
    // Reset class selection when year changes
    setClassName("");
  }, [selectedYear, yearToClassesMap]);

  useEffect(() => {
    const fetchNextIndexNumber = async () => {
      if (!selectedYear) return;

      try {
        const yearPrefix = selectedYear.slice(-2); // Get last 2 digits of year
        const q = query(
          collection(db, "voters"),
          where("indexNumber", ">=", `${yearPrefix}0001`),
          where("indexNumber", "<=", `${yearPrefix}9999`),
          orderBy("indexNumber", "desc"),
          limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const lastVoter = querySnapshot.docs[0].data();
          const lastNumber = parseInt(lastVoter.indexNumber.slice(2));
          setNextIndexNumber(
            parseInt(
              selectedYear.slice(-2) + String(lastNumber + 1).padStart(4, "0")
            )
          );
        } else {
          // Start with year prefix + 00001
          setNextIndexNumber(parseInt(selectedYear.slice(-2) + "0001"));
        }
      } catch (error) {
        console.error("Error fetching next index number:", error);
        showSnackbar("Failed to fetch next index number.", "error");
      }
    };
    fetchNextIndexNumber();
  }, [selectedYear]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!fullName) {
      showSnackbar("Please fill in the full name.", "warning");
      return;
    }
    if (!className) {
      showSnackbar("Please select a class.", "warning");
      return;
    }
    if (!selectedYear) {
      showSnackbar("Please select a year.", "warning");
      return;
    }

    const validation = validateFullNameFn(fullName);
    if (!validation.isValid) {
      showSnackbar(`Invalid full name: ${validation.error}`, "error");
      return;
    }

    setLoading(true);
    try {
      const newVoter = {
        indexNumber: nextIndexNumber.toString(),
        fullName: validation.sanitizedName,
        code,
        className,
        year: selectedYear,
        userRole: "Voter",
        isVoted: false,
      };

      const indexQuery = query(
        collection(db, "voters"),
        where("indexNumber", "==", nextIndexNumber.toString())
      );
      const indexSnapshot = await getDocs(indexQuery);
      if (!indexSnapshot.empty) {
        showSnackbar("Index Number already exists!", "error");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "voters"), newVoter);

      setNextIndexNumber((prevIndex) => prevIndex + 1);
      setFullName("");
      setCode("");
      setClassName("");

      showSnackbar("Voter successfully registered!");
    } catch (error) {
      console.error("Error registering voter:", error);
      showSnackbar("Failed to register voter.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      let currentIndex = nextIndexNumber;
      const batch = writeBatch(db);
      let addedCount = 0;
      let skippedCount = 0;

      for (const row of jsonData) {
        const rawName = row["Full Name"] || row["full name"] || row["name"];
        const year = row["Year"] || row["year"];
        const className = row["Class"] || row["class"];

        if (!rawName || !year || !className) {
          skippedCount++;
          continue;
        }

        const validation = validateFullNameFn(rawName);
        if (!validation.isValid) {
          skippedCount++;
          continue;
        }

        const newVoter = {
          indexNumber: currentIndex.toString(),
          fullName: validation.sanitizedName,
          code: Math.floor(100000 + Math.random() * 900000).toString(), // Random 6-digit code
          className: className.toString(),
          year: year.toString(),
          userRole: "Voter",
          isVoted: false,
        };

        const newDocRef = doc(collection(db, "voters"));
        batch.set(newDocRef, newVoter);
        currentIndex++;
        addedCount++;
      }

      await batch.commit();
      setNextIndexNumber(currentIndex);

      let message = `${addedCount} voters successfully registered from Excel!`;
      if (skippedCount > 0) {
        message += ` ${skippedCount} entries were skipped due to missing data.`;
      }
      showSnackbar(message, "success");
    } catch (error) {
      console.error("Error uploading Excel file:", error);
      showSnackbar("Failed to process Excel file.", "error");
    } finally {
      setLoading(false);
    }
  };

 const downloadTemplate = () => {
  if (!selectedYear || !className) {
    showSnackbar("Please select a Year and Class before downloading.", "warning");
    return;
  }

  // Template will have one blank row ready for user to fill
  const worksheetData = [
    ["Full Name", "Year", "Class"],
    ["", selectedYear, className],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  worksheet["!tables"] = [
    {
      name: "VotersTable",
      ref: XLSX.utils.encode_range(range),
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium9",
        showRowStripes: true,
      },
      columns: [
        { name: "Full Name", totalsRowLabel: null },
        { name: "Year", totalsRowLabel: null },
        { name: "Class", totalsRowLabel: null },
      ],
    },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "VotersTemplate");
  XLSX.writeFile(workbook, "Voter_Upload_Template.xlsx");
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
    <Container maxWidth="md">
      <Box mt={4}>
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            Register Voter
          </Typography>
          <Typography variant="h6" gutterBottom>
            Next Index Number: {nextIndexNumber}
          </Typography>

          {/* Single Voter Form */}
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Full Name"
                  variant="outlined"
                  fullWidth
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    required
                  >
                    {availableYears.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    required
                    disabled={!selectedYear}
                  >
                    {filteredClasses.map((cls) => (
                      <MenuItem key={cls.id} value={cls.className}>
                        {cls.className}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : "Register Voter"}
                </Button>
              </Grid>
            </Grid>
          </form>

          {/* Bulk Upload */}
          <Box mt={5}>
            <Typography variant="h6" gutterBottom>
              Bulk Upload via Excel
            </Typography>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              disabled={loading}
              style={{ marginTop: "10px", marginBottom: "10px" }}
            />
            <Box mt={2}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={downloadTemplate}
              >
                Download Excel Template
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
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
    </Container>
  );
};

export default RegisterVoter;
