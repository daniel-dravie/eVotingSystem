import { useEffect, useState } from "react";
import {
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert,
  Container
} from "@mui/material";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";

const VoteCountingScreen = () => {
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [previousVotes, setPreviousVotes] = useState(0);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    fetchTotalVotes();
    
    // Set up polling every 5 seconds for real-time updates
    const intervalId = setInterval(() => {
      fetchTotalVotes();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchTotalVotes = async () => {
    try {
      // Query voters collection where isVoted is true
      const votersRef = collection(db, "voters");
      const votedQuery = query(votersRef, where("isVoted", "==", true));
      const querySnapshot = await getDocs(votedQuery);

      const voteCount = querySnapshot.size;

      // Check if a new vote has been cast
      if (voteCount > previousVotes && previousVotes !== 0) {
        // Audio voice confirmation using Web Speech API
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance();
          utterance.text = `Vote confirmed! Total votes now: ${voteCount}`;
          utterance.rate = 0.9;
          utterance.pitch = 1;
          utterance.volume = 1;
          speechSynthesis.speak(utterance);
        }
        
        // Show snackbar notification
        setSnackbarMessage(`New vote cast! Total votes: ${voteCount}`);
        setOpenSnackbar(true);
      }

      // Update previous votes and current votes
      setPreviousVotes(voteCount);
      setTotalVotes(voteCount);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching vote count:", error);
      setSnackbarMessage("Error fetching vote count");
      setOpenSnackbar(true);
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  return (
   <Container maxWidth="md">
      <Typography variant="h4" gutterBottom align="center" color="#1f1d1dff">
        Total Votes Cast
      </Typography>

      <Card sx={{  margin: "auto", boxShadow: 3 }} maxWidth="md">
        <CardContent>
          {loading ? (
            <CircularProgress color="primary" />
          ) : (
            <Typography fontSize={300} color="#000000" align="center">
              {totalVotes}
            </Typography>
          )}
        </CardContent>
      </Card>

     

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="info"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
   </ Container>
  );
};

export default VoteCountingScreen;
