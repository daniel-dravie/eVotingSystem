import { useState } from "react";
import {
  Button,
  TextField,
  Typography,
  Container,
  Grid,
  Snackbar,
  Alert,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import Logo7DCreationz from "../components/Logo7DCreationz";
const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      // Query Firestore Admin collection for user with matching email
      const q = query(collection(db, "staff"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setSnackbarMessage("No user found with this email.");
        setOpenSnackbar(true);
        return;
      }

      let userDoc = null;
      querySnapshot.forEach((doc) => {
        userDoc = doc.data();
      });

      if (userDoc.password !== password) {
        setSnackbarMessage("Incorrect password.");
        setOpenSnackbar(true);
        return;
      }

      // Authentication successful
      setSnackbarMessage("Login successful!");
      setOpenSnackbar(true);

      // Store userRole in localStorage
      localStorage.setItem("userRole", userDoc.role || "Admin");

      // Redirect based on role
      if (userDoc.role === "Admin") {
        navigate("/admin-dashboard", { state: { userRole: "Admin" } });
      } else if (userDoc.role === "Staff") {
        navigate("/admin-dashboard", { state: { userRole: "Staff" } });
      } else if (userDoc.role === "Manager") {
        navigate("/admin-dashboard", { state: { userRole: "Manager" } });
      } else {
        navigate("/admin-dashboard");
      }
    } catch {
      setSnackbarMessage("Error during login. Please try again.");
      setOpenSnackbar(true);
    }

    // Reset fields
    setEmail("");
    setPassword("");
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  return (
    <>
   
    <Container maxWidth="sm" style={{ marginTop: "100px" }}  sx={{
          boxShadow: 3,
          padding: 3,
          borderRadius: 2,
          backgroundColor: "#dad6cfff",
        }}>
       <Logo7DCreationz />
      <Box
        sx={{
          boxShadow: 3,
          padding: 3,
          borderRadius: 2,
          backgroundColor: "white",
        }}
      >
       
        <Typography variant="h4" gutterBottom align="center">
        USER LOGIN
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                variant="outlined"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="7dcreationz@example.com"
                InputProps={{
                  startAdornment: <EmailIcon style={{ marginRight: "8px" }} />,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: <LockIcon style={{ marginRight: "8px" }} />,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
              >
                Login
              </Button>
            </Grid>
          </Grid>
        </form>

        {/* Snackbar for success/error message */}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={
              snackbarMessage.includes("successful") ? "success" : "error"
            }
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
    <footer style={{ 
      position: "fixed", 
      bottom: 0, 
      left: 0, 
      width: "100%", 
      padding: "1rem", 
      backgroundColor: "#f5f5f5", 
      textAlign: "center",
      boxShadow: "0 -2px 5px rgba(0,0,0,0.1)"
    }}>
      <Typography variant="body2" color="textSecondary">
        © {new Date().getFullYear()} Danny. All rights reserved.
      </Typography>
    </footer>
    </>
  );
};

export default AdminLogin;
