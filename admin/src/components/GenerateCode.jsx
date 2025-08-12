import { useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  Snackbar,
  Alert,
  Container,
  Paper,
  Grid,
} from "@mui/material";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const GenerateCode = () => {
  const [indexNumber, setIndexNumber] = useState("");
  const [voterName, setVoterName] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [existingCode, setExistingCode] = useState("");
  const [showExistingCode, setShowExistingCode] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  const generateCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const checkExistingCode = async () => {
    if (!/^\d{6}$/.test(indexNumber)) {
      setSnackbarMessage("Index number must be exactly 6 digits.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return null;
    }

    try {
      const q = query(collection(db, "voters"), where("indexNumber", "==", indexNumber));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setSnackbarMessage("Index number not found in voters register");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return null;
      }

      const voterDoc = querySnapshot.docs[0];
      const voterData = voterDoc.data();
      setVoterName(voterData.fullName || "");

      return voterData.code || null;
    } catch (error) {
      console.error("Error checking existing code:", error);
      setSnackbarMessage("Failed to check existing code.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return null;
    }
  };

  const handleGenerateCode = async () => {
    if (!/^\d{6}$/.test(indexNumber)) {
      setSnackbarMessage("Index number must be exactly 6 digits.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    try {
      const q = query(collection(db, "voters"), where("indexNumber", "==", indexNumber));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setSnackbarMessage("Index number does not exist in the voters register");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      const voterDoc = querySnapshot.docs[0];
      const voterData = voterDoc.data();
      setVoterName(voterData.fullName || "");

      if (voterData.isVoted === true || voterData.isVoted === "yes") {
        setSnackbarMessage("This candidate has already voted!");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      if (voterData.code) {
        setExistingCode(voterData.code);
        setSnackbarMessage("Code already exists for this candidate!");
        setSnackbarSeverity("info");
        setSnackbarOpen(true);
        return;
      }

      const newCode = generateCode();

      await updateDoc(doc(db, "voters", voterDoc.id), {
        code: newCode,
        updatedAt: new Date(),
      });

      setGeneratedCode(newCode);
      setExistingCode(newCode);
      setSnackbarMessage(`Code generated: ${newCode}`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error generating code:", error);
      setSnackbarMessage("Failed to generate code.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleRetrieveExistingCodes = async () => {
    const code = await checkExistingCode();
    if (code) {
      setExistingCode(code);
      setShowExistingCode(true);
    }
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 5 }}>
        <Typography variant="h4" gutterBottom align="center">
          Generate Code
        </Typography>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerateCode();
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Index Number"
                variant="outlined"
                fullWidth
                value={indexNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d{0,6}$/.test(value)) {
                    setIndexNumber(value);
                    setGeneratedCode("");
                    setExistingCode("");
                    setShowExistingCode(false);
                    setVoterName("");
                  }
                }}
                inputProps={{
                  inputMode: "numeric",
                  pattern: "\\d{6}",
                  maxLength: 6,
                }}
                required
                helperText="Enter a 6-digit number"
              />
            </Grid>

            {voterName && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="textSecondary">
                  Voter Name: <strong>{voterName}</strong>
                </Typography>
              </Grid>
            )}

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={!/^\d{6}$/.test(indexNumber)}
              >
                Generate Code
              </Button>
            </Grid>
          </Grid>
        </Box>

        {generatedCode && (
          <Box sx={{ marginTop: 2, textAlign: "center", fontWeight: "bold" }}>
            <Typography variant="h6" color="#000000">
              Generated Code: {generatedCode}
            </Typography>
          </Box>
        )}

        {showExistingCode && existingCode && (
          <Box sx={{ marginTop: 2, textAlign: "center", fontWeight: "bold" }}>
            <Typography variant="h6" color="#000000">
              Existing Code: {existingCode}
            </Typography>
          </Box>
        )}

        <Box sx={{ marginTop: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            onClick={handleRetrieveExistingCodes}
            sx={{ marginTop: 1 }}
          >
            Retrieve Existing Codes
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default GenerateCode;
