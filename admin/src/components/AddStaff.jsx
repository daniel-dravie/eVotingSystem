import { useState } from "react";
import {
  Button,
  TextField,
  Typography,
  Container,
  Grid,
  Snackbar,
  Alert as MuiAlert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
} from "@mui/material";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig";
import { PhotoCamera } from "@mui/icons-material";

const AddStaff = () => {
  // Basic Information Fields Only
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Staff");
  const [status, setStatus] = useState("Active");
  
  // Image state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // UI States
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [loading, setLoading] = useState(false);

  // Constants
  const roles = ["Admin", "Manager", "Staff"];
  const genders = ["Male", "Female", "Other"];
  // Removed unused statuses constant as it is not used in the form

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const validateForm = () => {
    if (!firstName || !lastName || !email || !phone || !password || !role || !gender) {
      showSnackbar("Please fill in all required fields.", "warning");
      return false;
    }

    if (password !== confirmPassword) {
      showSnackbar("Passwords do not match.", "warning");
      return false;
    }

    if (password.length < 6) {
      showSnackbar("Password must be at least 6 characters.", "warning");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showSnackbar("Please enter a valid email address.", "warning");
      return false;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      showSnackbar("Please enter a valid 10-digit phone number.", "warning");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      let imageUrl = "";
      if (imageFile) {
        // Upload image to Firebase Storage
        const storageRef = ref(storage, `staff/${imageFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);
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

      // Create staff document with basic information and image URL
      const staffData = {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email,
        gender,
        phone,
        password, // Note: In production, hash this password
        role,
        status,
        imageUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, "staff"), staffData);

      showSnackbar("Staff added successfully!", "success");
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error("Error adding staff:", error);
      showSnackbar("Failed to add staff. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setGender("");
    setPassword("");
    setConfirmPassword("");
    setPhone("");
    setRole("Staff");
    setStatus("Active");
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 3, marginBottom: 3 }}>
        <Typography variant="h4" gutterBottom align="center" color="primary">
          Add Staff Member
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name *"
                variant="outlined"
                fullWidth
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name *"
                variant="outlined"
                fullWidth
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email *"
                variant="outlined"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number *"
                variant="outlined"
                type="tel"
                fullWidth
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={gender}
                  label="Gender"
                  onChange={(e) => setGender(e.target.value)}
                >
                  {genders.map((g) => (
                    <MenuItem key={g} value={g}>{g}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={role}
                  label="Role"
                  onChange={(e) => setRole(e.target.value)}
                >
                  {roles.map((r) => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Password *"
                variant="outlined"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Confirm Password *"
                variant="outlined"
                type="password"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6} textAlign="center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setImagePreview(ev.target.result);
                    reader.readAsDataURL(file);
                    setImageFile(file);
                  }
                }}
                style={{ display: "none" }}
                id="upload-image"
              />
              <label htmlFor="upload-image" style={{ cursor: "pointer" }}>
                <Avatar
                  src={imagePreview || "/default-avatar.png"}
                  alt="Staff"
                  sx={{
                    width: 100,
                    height: 100,
                    margin: "0 auto",
                    bgcolor: "primary.main",
                    cursor: "pointer",
                    "&:hover": { opacity: 0.8 }
                  }}
                >
                  <PhotoCamera />
                </Avatar>
              </label>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? "Adding..." : "Add Staff"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
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

export default AddStaff;
