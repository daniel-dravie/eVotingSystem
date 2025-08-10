import { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Typography,
  Container,
  Grid,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Snackbar,
  Alert as MuiAlert,
  Paper,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { PhotoCamera } from "@mui/icons-material";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig";

const CandidateRegistration = () => {
  const [name, setName] = useState("");
  const [indexNumber, setIndexNumber] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [portfolios, setPortfolios] = useState([]);
  const [sex, setSex] = useState("");
  const [picture, setPicture] = useState(null);
  const [picturePreview, setPicturePreview] = useState(null);
  const [indexNumberError, setIndexNumberError] = useState("");
  const [pictureError, setPictureError] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [loading, setLoading] = useState(false);
  const [voterValidation, setVoterValidation] = useState(null);

  // Fetch portfolios from Firebase
  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const portfoliosCollection = collection(db, "portfolios");
        const portfoliosSnapshot = await getDocs(portfoliosCollection);
        const portfoliosList = portfoliosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPortfolios(portfoliosList);
      } catch (error) {
        console.error("Error fetching portfolios:", error);
        showSnackbar("Failed to fetch portfolios.", "error");
      }
    };

    fetchPortfolios();
  }, []);

  // Validate voter exists when index number changes
  useEffect(() => {
    const validateVoter = async () => {
      if (indexNumber.length === 6) {
        try {
          const votersQuery = query(
            collection(db, "voters"),
            where("indexNumber", "==", indexNumber)
          );
          const votersSnapshot = await getDocs(votersQuery);
          
          if (votersSnapshot.empty) {
            setIndexNumberError("Voter not found. Please register as a voter first.");
            setVoterValidation(null);
          } else {
            const voterData = votersSnapshot.docs[0].data();
            setVoterValidation(voterData);
            setName(voterData.fullName);
            setIndexNumberError("");
          }
        } catch (error) {
          console.error("Error validating voter:", error);
          setIndexNumberError("Error validating voter.");
        }
      }
    };

    if (indexNumber.length === 6) {
      validateVoter();
    }
  }, [indexNumber]);

  // Handle Index Number Validation
  const handleIndexNumberChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,6}$/.test(value)) {
      setIndexNumber(value);
      if (value.length !== 6) {
        setIndexNumberError("Index Number must be exactly 6 digits.");
      } else {
        setIndexNumberError("");
      }
    }
  };

  // Handle File Change - Enhanced image validation
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Strict image type validation
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      const maxSize = 5 * 1024 * 1024; // 5MB limit
      
      if (!validTypes.includes(file.type)) {
        setPictureError("Only JPG, JPEG, PNG, and WebP images are allowed.");
        return;
      }
      
      if (file.size > maxSize) {
        setPictureError("Image size must be less than 5MB.");
        return;
      }
      
      // Additional image validation
      const img = new Image();
      img.onload = () => {
        setPicture(file);
        setPictureError("");
        
        // Display Image Preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPicturePreview(e.target.result);
        };
        reader.readAsDataURL(file);
      };
      img.onerror = () => {
        setPictureError("Invalid image file.");
      };
      img.src = URL.createObjectURL(file);
    }
  };

  // Handle Form Submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name || !indexNumber || !portfolio || !sex || !voterValidation) {
      return showSnackbar("All fields except image are required and voter must be registered.", "warning");
    }

    setLoading(true);

    try {
      let imageUrl = "";

      // Upload image to Firebase Storage if picture is provided
      if (picture) {
        const storageRef = ref(storage, `candidates/${picture.name}`);
        const uploadTask = uploadBytesResumable(storageRef, picture);
        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            null,
            (error) => reject(error),
            async () => {
              imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      // Create candidate document in Firebase
      const newCandidate = {
        fullName: name,
        indexNumber: indexNumber,
        portfolioName: portfolio,
        sex: sex,
        imageUrl: imageUrl,
        votes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, "candidates"), newCandidate);

      showSnackbar("Candidate registered successfully!", "success");

      // Reset form
      setName("");
      setIndexNumber("");
      setPortfolio("");
      setSex("");
      setPicture(null);
      setPicturePreview(null);
      setVoterValidation(null);

    } catch (error) {
      console.error("Error registering candidate:", error);
      showSnackbar("Failed to register candidate.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  // Disable submit button if form is invalid
  const isFormValid = 
    name &&
    indexNumber &&
    !indexNumberError &&
    portfolio &&
    sex &&
    !pictureError &&
    voterValidation;

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Register Candidate
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Index Number"
                variant="outlined"
                fullWidth
                value={indexNumber}
                onChange={handleIndexNumberChange}
                error={!!indexNumberError}
                helperText={indexNumberError || (voterValidation ? "Voter found ✓" : "Enter 6-digit index number")}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Full Name"
                variant="outlined"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={!!voterValidation}
                helperText={voterValidation ? "Auto-filled from voter record" : ""}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                label="Portfolio"
                variant="outlined"
                fullWidth
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                required
              >
                {portfolios.length > 0 ? (
                  portfolios.map((portfolio) => (
                    <MenuItem key={portfolio.id} value={portfolio.name}>
                      {portfolio.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No portfolios available</MenuItem>
                )}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <FormControl component="fieldset" required>
                <FormLabel component="legend">Sex</FormLabel>
                <RadioGroup
                  row
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                >
                  <FormControlLabel value="Male" control={<Radio />} label="Male" />
                  <FormControlLabel value="Female" control={<Radio />} label="Female" />
                </RadioGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12} textAlign="center">
              <input
                type="file"
                accept="image/jpeg, image/png, image/jpg"
                onChange={handleFileChange}
                style={{ display: "none" }}
                id="upload-button"
              />
              <label htmlFor="upload-button">
                <Avatar
                  src={picturePreview || ""}
                  sx={{
                    width: 100,
                    height: 100,
                    cursor: "pointer",
                    bgcolor: "primary.main",
                    "&:hover": {
                      opacity: 0.8,
                    },
                    margin: "0 auto",
                  }}
                >
                  <PhotoCamera />
                </Avatar>
              </label>
              {pictureError && (
                <Typography color="error" variant="body2" align="center">
                  {pictureError}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={!isFormValid || loading}
              >
                {loading ? <CircularProgress size={24} /> : "Register Candidate"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
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
    </Container>
  );
};

export default CandidateRegistration;
