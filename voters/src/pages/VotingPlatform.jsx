import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Paper,
} from "@mui/material";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const VotingPlatform = () => {
  const { currentUser, voterData, logout } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedVotes, setSelectedVotes] = useState({});
  const [openSummaryDialog, setOpenSummaryDialog] = useState(false);
  const [voting, setVoting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [voterDocId, setVoterDocId] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    fetchCandidatesAndPortfolios();
    fetchVoterDocId();
  }, [currentUser, navigate]);

  // Fetch the voter's Firestore document ID
  const fetchVoterDocId = async () => {
    try {
      if (!voterData?.indexNumber) return;
      const votersCollection = collection(db, "voters");
      const snapshot = await getDocs(votersCollection);
      const docMatch = snapshot.docs.find(
        (d) => d.data().indexNumber === voterData.indexNumber
      );
      if (docMatch) setVoterDocId(docMatch.id);
    } catch (e) {
      console.error("Error fetching voter doc ID:", e);
    }
  };

  const fetchCandidatesAndPortfolios = async () => {
    try {
      const candidatesCollection = collection(db, "candidates");
      const candidateSnapshot = await getDocs(candidatesCollection);
      const candidateList = candidateSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCandidates(candidateList);

      // Extract unique portfolios from candidates
      const uniquePortfolios = [
        ...new Set(candidateList.map((c) => c.portfolioName || c.position)),
      ];
      setPortfolios(uniquePortfolios);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCandidatesForPortfolio = (portfolio) => {
    // Support both portfolioName and position for compatibility
    return candidates.filter(
      (candidate) =>
        candidate.portfolioName === portfolio ||
        candidate.position === portfolio
    );
  };

  const handleSelectCandidate = (portfolio, candidate) => {
    setSelectedVotes((prev) => ({
      ...prev,
      [portfolio]: { ...candidate, vote: "yes" },
    }));
    // Move to next portfolio after short delay
    setTimeout(() => {
      if (activeStep < portfolios.length - 1) {
        setActiveStep((prev) => prev + 1);
      } else {
        setOpenSummaryDialog(true);
      }
    }, 300);
  };

  const handleYesNoVote = (portfolio, candidate, vote) => {
    setSelectedVotes((prev) => ({
      ...prev,
      [portfolio]: { ...candidate, vote },
    }));
    setTimeout(() => {
      if (activeStep < portfolios.length - 1) {
        setActiveStep((prev) => prev + 1);
      } else {
        setOpenSummaryDialog(true);
      }
    }, 300);
  };

  const handleSkipVote = (portfolio) => {
    setSelectedVotes((prev) => ({
      ...prev,
      [portfolio]: { vote: "skip", skipped: true },
    }));
    setTimeout(() => {
      if (activeStep < portfolios.length - 1) {
        setActiveStep((prev) => prev + 1);
      } else {
        setOpenSummaryDialog(true);
      }
    }, 300);
  };

  const handleBack = () => {
    if (activeStep > 0) setActiveStep((prev) => prev - 1);
  };

  const handleReview = () => {
    setOpenSummaryDialog(true);
  };

  const handleEditVote = (portfolio) => {
    setActiveStep(portfolios.indexOf(portfolio));
    setOpenSummaryDialog(false);
  };

  // Simplified: Count "yes" votes as 1 for both opposed and unopposed candidates
  const handleConfirmVotes = async () => {
    if (voterData?.isVoted) return;

    setVoting(true);
    try {
      // Fetch all candidates
      const candidateSnapshot = await getDocs(collection(db, "candidates"));
      const candidateDocs = candidateSnapshot.docs;

      // Update votes for each selected candidate - count "yes" as 1 vote
      const votePromises = Object.entries(selectedVotes).map(
        async ([portfolio, candidate]) => {
          if (candidate.vote === "yes") {
            const candidateDoc = candidateDocs.find(
              (d) => d.id === candidate.id
            );
            let currentVotes = 0;
            if (candidateDoc && candidateDoc.data().votes) {
              currentVotes = candidateDoc.data().votes;
            }
            const candidateRef = doc(db, "candidates", candidate.id);
            // Simply increment by 1 for "yes" votes (both opposed and unopposed)
            return updateDoc(candidateRef, {
              votes: currentVotes + 1,
            });
          }
          return Promise.resolve();
        }
      );

      await Promise.all(votePromises);

      // Update voter's isVoted status and clear code
      if (voterDocId) {
        const voterRef = doc(db, "voters", voterDocId);
        await updateDoc(voterRef, {
          isVoted: true,
          code: "",
          votes: selectedVotes,
          votedAt: new Date().toISOString(),
        });
      }

      setSuccessMessage(
        "Your votes have been successfully recorded! Thank you for participating."
      );
      setOpenSummaryDialog(false);

      // Logout immediately after voting
      setTimeout(async () => {
        await logout();
        navigate("/login");
      }, 300);
    } catch (error) {
      console.error("Error voting:", error);
      setSuccessMessage("Error recording votes. Please try again.");
    } finally {
      setVoting(false);
    }
  };

  const currentPortfolio = portfolios[activeStep];
  const candidatesForCurrent = getCandidatesForPortfolio(currentPortfolio);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" component="h1">
          Voting Platform
        </Typography>
        <Box>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome, {voterData?.fullName || voterData?.name || "Voter"}
          </Typography>
        </Box>
      </Box>

      {voterData?.isVoted && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Voter has already voted
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {portfolios.map((portfolio) => (
            <Step key={portfolio}>
              <StepLabel>{portfolio}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Voting Section */}
      {!voterData?.isVoted && (
        <Box>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Vote for {currentPortfolio}
          </Typography>

          <Grid container spacing={4}>
            {candidatesForCurrent.length === 1 ? (
              <Grid item xs={12} sm={8} md={6} key={candidatesForCurrent[0].id}>
                <Card
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: 2,
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={
                      candidatesForCurrent[0].imageUrl ||
                      candidatesForCurrent[0].image ||
                      "https://placehold.co/200x200?text=Candidate"
                    }
                    alt={
                      candidatesForCurrent[0].fullName ||
                      candidatesForCurrent[0].name
                    }
                    sx={{ objectFit: "cover", width: 200, mb: 2 }}
                  />
                  <CardContent sx={{ textAlign: "center" }}>
                    <Typography gutterBottom variant="h6" component="div">
                      {candidatesForCurrent[0].fullName ||
                        candidatesForCurrent[0].name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {candidatesForCurrent[0].description}
                    </Typography>
                    <Chip
                      label={
                        candidatesForCurrent[0].portfolioName ||
                        candidatesForCurrent[0].position
                      }
                      color="primary"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                  <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                    <Button
                      variant={
                        selectedVotes[currentPortfolio]?.vote === "yes"
                          ? "contained"
                          : "outlined"
                      }
                      color="success"
                      onClick={() =>
                        handleYesNoVote(
                          currentPortfolio,
                          candidatesForCurrent[0],
                          "yes"
                        )
                      }
                    >
                      Yes
                    </Button>
                    <Button
                      variant={
                        selectedVotes[currentPortfolio]?.vote === "no"
                          ? "contained"
                          : "outlined"
                      }
                      color="error"
                      onClick={() =>
                        handleYesNoVote(
                          currentPortfolio,
                          candidatesForCurrent[0],
                          "no"
                        )
                      }
                    >
                      No
                    </Button>
                    <Button
                      variant={
                        selectedVotes[currentPortfolio]?.vote === "skip"
                          ? "contained"
                          : "outlined"
                      }
                      color="warning"
                      onClick={() => handleSkipVote(currentPortfolio)}
                    >
                      Skip
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ) : (
              candidatesForCurrent.map((candidate) => (
                <Grid item xs={12} sm={6} md={4} key={candidate.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      border:
                        selectedVotes[currentPortfolio]?.id === candidate.id
                          ? 2
                          : 0,
                      borderColor: "primary.main",
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={
                        candidate.imageUrl ||
                        candidate.image ||
                        "https://placehold.co/200x200?text=Candidate"
                      }
                      alt={candidate.fullName || candidate.name}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="div">
                        {candidate.fullName || candidate.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {candidate.description}
                      </Typography>
                      <Chip
                        label={candidate.portfolioName || candidate.position}
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                    <Box sx={{ p: 2 }}>
                      <Button
                        variant={
                          selectedVotes[currentPortfolio]?.id === candidate.id
                            ? "outlined"
                            : "contained"
                        }
                        color={
                          selectedVotes[currentPortfolio]?.id === candidate.id
                            ? "secondary"
                            : "primary"
                        }
                        fullWidth
                        onClick={() =>
                          handleSelectCandidate(currentPortfolio, candidate)
                        }
                      >
                        {selectedVotes[currentPortfolio]?.id === candidate.id
                          ? "Selected"
                          : "Select"}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>

          {/* Navigation buttons */}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => handleSkipVote(currentPortfolio)}
            >
              Skip Vote
            </Button>
            <Button
              variant="contained"
              onClick={handleReview}
              disabled={Object.keys(selectedVotes).length !== portfolios.length}
            >
              Review Votes
            </Button>
          </Box>
        </Box>
      )}

      {/* Summary Dialog */}
      <Dialog
        open={openSummaryDialog}
        onClose={() => setOpenSummaryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle >Review Your Votes</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom align="center">
            Please review your selections before confirming:
          </Typography>
          <List>
            {portfolios.map((portfolio) => {
              const candidate = selectedVotes[portfolio];
              const candidatesForPortfolio =
                getCandidatesForPortfolio(portfolio);
              const hasMultipleCandidates = candidatesForPortfolio.length > 1;

              return (
                <ListItem
                  key={portfolio}
                  secondaryAction={
                    <Button
                      size="small"
                      onClick={() => handleEditVote(portfolio)}
                    >
                      Change
                    </Button>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography
                          component="span"
                          sx={{ fontWeight: "bold" }}
                        >
                          {portfolio}:
                        </Typography>
                        {candidate ? (
                          <Typography
                            component="span"
                            sx={{
                              ml: 1,
                              color: "primary.main",
                              fontWeight: "bold",
                            }}
                          >
                            {candidate.fullName || candidate.name}
                            {!hasMultipleCandidates && candidate.vote
                              ? ` (${candidate.vote.toUpperCase()})`
                              : ""}
                          </Typography>
                        ) : (
                          <Typography
                            component="span"
                            sx={{ ml: 1, color: "text.secondary" }}
                          >
                            No selection
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={candidate?.description}
                  />
                </ListItem>
              );
            })}
          </List>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Total votes: {Object.keys(selectedVotes).length} /{" "}
            {portfolios.length}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSummaryDialog(false)}>Go Back</Button>
          <Button
            onClick={handleConfirmVotes}
            color="primary"
            variant="contained"
            disabled={
              voting || Object.keys(selectedVotes).length !== portfolios.length
            }
          >
            {voting ? <CircularProgress size={24} /> : "Confirm All Votes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VotingPlatform;
