import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import jsPDF from "jspdf";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import html2canvas from "html2canvas";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import PropTypes from "prop-types";

const VoteResults = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voterStats, setVoterStats] = useState({
    total: 0,
    voted: 0,
    percentage: 0,
  });

  const getVoterTurnoutStats = () => {
    const votersCollection = collection(db, "voters");
    return onSnapshot(
      votersCollection,
      (snapshot) => {
        const voters = snapshot.docs.map((doc) => doc.data());
        console.log("Voters snapshot data:", voters);
        const totalVoters = voters.length;
        // Accept both string 'yes' and boolean true for isVoted
        const votedCount = voters.filter(
          (voter) => voter.isVoted === "yes" || voter.isVoted === true
        ).length;
        const percentage =
          totalVoters > 0 ? ((votedCount / totalVoters) * 100).toFixed(2) : 0;
        setVoterStats({ total: totalVoters, voted: votedCount, percentage });
      },
      (error) => {
        console.error("Error fetching voter stats:", error);
      }
    );
  };

  useEffect(() => {
    fetchVoteResults();
    const unsubscribe = getVoterTurnoutStats();
    return () => unsubscribe();
  }, []);

  // Removed fetchVoterStats function as it is no longer used

  // Fix: Ensure portfolioName fallback and placeholder image are always set
  const fetchVoteResults = async () => {
    try {
      const candidatesCollection = collection(db, "candidates");
      const snapshot = await getDocs(candidatesCollection);
      const candidates = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Group candidates by portfolio
      const portfolioMap = {};
      candidates.forEach((candidate) => {
        const portfolioName =
          candidate.portfolioName || candidate.position || "Unknown";
        if (!portfolioMap[portfolioName]) {
          portfolioMap[portfolioName] = [];
        }
        portfolioMap[portfolioName].push({
          candidate: candidate.fullName || candidate.name || "Unknown",
          votes: candidate.votes || 0,
          picture:
            candidate.imageUrl ||
            candidate.image ||
            "https://placehold.co/150x150?text=No+Image",
          id: candidate.id,
        });
      });

      // Calculate percentages and determine winners
      const portfolioResults = await Promise.all(
        Object.entries(portfolioMap).map(async ([name, candidates]) => {
          if (candidates.length === 1) {
            // Get all voters
            const votersCollection = collection(db, "voters");
            const snapshot = await getDocs(votersCollection);
            const voters = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            // Count only voters who actually voted (isVoted === "yes")
            const totalYesVoters = voters.filter(
              (v) => v.isVoted === "yes"
            ).length;

            const candidate = candidates[0];
            const candidateVotes = candidate.votes || 0;

            // For unopposed candidates, percentage is based on actual voters who voted
            const approvalPercentage = 
              candidateVotes > 0
                ? ((totalYesVoters / candidateVotes) * 100).toFixed(3)
                : 0;

            // For unopposed candidates, return "Approved" if totalYesVoters > candidateVotes, else "Unapproved"
            const resultStatus = totalYesVoters > candidateVotes ? "Approved" : "Unapproved";

            const results = [
              {
                ...candidate,
                votes: candidateVotes,
                totalVoters: totalYesVoters,
                percentage: approvalPercentage,
                status: resultStatus,
                rank: 1,
                isUnopposed: true,
              },
            ];

            const winnerCandidate = totalYesVoters > candidateVotes ? results[0] : null;

            return {
              name,
              results,
              totalVotes: candidateVotes,
              winner: winnerCandidate,
            };
          } else {
            // Use candidate.votes directly for multiple candidates
            const totalVotesCount = candidates.reduce(
              (sum, c) => sum + (c.votes || 0),
              0
            );

            // Calculate percentages and prepare results
            const results = candidates.map((candidate) => {
              const votes = candidate.votes || 0;
              const percentage =
                totalVotesCount > 0
                  ? ((votes / totalVotesCount) * 100).toFixed(2)
                  : 0;
              return {
                ...candidate,
                votes,
                percentage,
                percentageValue: percentage,
              };
            });

            // Sort by votes (descending) and add rank
            results.sort((a, b) => b.votes - a.votes);
            results.forEach((result, index) => {
              result.rank = index + 1;
            });

            // Determine winner
            let winner = null;
            if (results.length > 0) {
              const maxVotes = results[0].votes;
              const isTie =
                results.filter((r) => r.votes === maxVotes).length > 1;
              if (maxVotes > 0 && !isTie) {
                winner = results[0];
              }
            }

            return {
              name,
              results,
              totalVotes: totalVotesCount,
              winner,
            };
          }
        })
      );

      setPortfolios(portfolioResults);
    } catch (err) {
      console.error("Error fetching vote results:", err);
      setError("Failed to load vote results");
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioClick = (portfolio) => {
    setSelectedPortfolio(portfolio);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPortfolio(null);
  };

  const handlePrint = () => {
    const chartContainer = document.getElementById("chart-container");
    if (chartContainer) {
      chartContainer.style.display = "none";
    }
    const input = document.getElementById("portfolio-results");
    html2canvas(input, { scale: 2 }).then(() => {
      // const imgData = canvas.toDataURL("image/png"); // Removed unused variable
      const pdf = new jsPDF("p", "mm", "a4");
      let yPosition = 20;

      // Title
      pdf.setFontSize(18);
      pdf.setFont("Times New Roman", "bold");
      pdf.text(`${selectedPortfolio.name} CANDIDATES RESULTS`, 10, yPosition);
      yPosition += 10;

      // Table Headers
      pdf.setFontSize(12);
      pdf.text("Rank", 10, yPosition);
      pdf.text("Candidate", 30, yPosition);
      pdf.text("Votes", 140, yPosition);
      pdf.text("Percentage", 160, yPosition);
      yPosition += 10;
      pdf.line(10, yPosition, 200, yPosition); // Line under headers
      yPosition += 5;

      // Table Rows
      selectedPortfolio.results.forEach((result) => {
        pdf.text(`${result.rank}`, 10, yPosition);
        pdf.text(`${result.candidate}`, 30, yPosition);
        pdf.text(`${result.votes}`, 140, yPosition);
        pdf.text(`${result.percentage}%`, 160, yPosition);
        yPosition += 10;
      });

      // Save PDF
      pdf.save(`${selectedPortfolio.name}_results.pdf`);
      if (chartContainer) {
        chartContainer.style.display = "block";
      }
    });
  };

  // Remove duplicate COLORS and getCellColor declarations
  const COLORS = [
    "#f0f0f0",
    "#e0e0e0",
    "#d0d0d0",
    "#c0c0c0",
    "#b0b0b0",
    "#a0a0a0",
  ];
  const getCellColor = (entry, index, results) => {
    if (!results || results.length === 0) return COLORS[index % COLORS.length];
    const maxVotes = Math.max(...results.map((r) => r.votes));
    // If multiple candidates have the same max votes, color all dark gray
    return entry.votes === maxVotes && maxVotes > 0
      ? "#424242"
      : COLORS[index % COLORS.length];
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      <Box sx={{ mb: 3, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom sx={{ color: "#424242" }}>
          Election Results Analysis
        </Typography>
        <Card
          sx={{
            maxWidth: 600,
            mx: "auto",
            mb: 2,
            bgcolor: "#ffffff",
            border: "1px solid #e0e0e0",
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ color: "#616161" }} gutterBottom>
              Voter Turnout Statistics
            </Typography>
            <Typography variant="h4" sx={{ color: "#424242" }}>
              {voterStats.percentage}%
            </Typography>
            <Typography variant="h5" sx={{ color: "#757575" }}>
              {voterStats.voted} out of {voterStats.total} voters have cast
              their ballots
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : (
        <>
          {/* Portfolio Selection Interface */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Select Portfolio to View Analysis
            </Typography>
            <List sx={{ bgcolor: "background.paper" }}>
              {portfolios.map((portfolio, index) => (
                <ListItem key={index} disablePadding>
                  <ListItemButton
                    onClick={() => handlePortfolioClick(portfolio)}
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      mb: 1,
                      borderRadius: 1,
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <ListItemText
                      primary={portfolio.name}
                      secondary={`${portfolio.totalVotes} total votes`}
                    />
                    {portfolio.winner && (
                      <Chip
                        label="Winner"
                        color="success"
                        size="large"
                        variant="outlined"
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Single Portfolio Display */}
          {selectedPortfolio && (
            <Box sx={{ mt: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {selectedPortfolio.name} - Detailed Analysis
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                      <Typography variant="h6" gutterBottom>
                        Vote Distribution
                      </Typography>
                      <Box sx={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={selectedPortfolio.results}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ candidate, percentage }) =>
                                `${candidate}: ${percentage}%`
                              }
                              outerRadius={120}
                              fill="#8884d8"
                              dataKey="votes"
                            >
                              {selectedPortfolio.results.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={getCellColor(
                                    entry,
                                    index,
                                    selectedPortfolio.results
                                  )}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value, name, props) => [
                                `${value} votes`,
                                props.payload.candidate,
                              ]}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="h6" gutterBottom>
                        Results Summary
                      </Typography>
                      <Typography variant="body1">
                        Total Votes:{" "}
                        <strong>{selectedPortfolio.totalVotes}</strong>
                      </Typography>
                      {selectedPortfolio.winner && (
                        <Typography variant="body1">
                          Winner:{" "}
                          <strong>{selectedPortfolio.winner.candidate}</strong>{" "}
                          ({selectedPortfolio.winner.percentage}%)
                        </Typography>
                      )}
                      <List dense>
                        {selectedPortfolio.results.map((result, idx) => (
                          <ListItem key={idx}>
                            <ListItemText
                              primary={`${result.rank}. ${result.candidate}`}
                              secondary={`${result.votes} votes (${result.percentage}%)`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => setSelectedPortfolio(null)}
                      color="secondary"
                    >
                      Clear Selection
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Detailed Results for {selectedPortfolio?.name}
          {selectedPortfolio?.winner && (
            <Chip
              label={`Winner: ${selectedPortfolio.winner.candidate}`}
              size="large"
              sx={{ ml: 2, bgcolor: "#888888", color: "#ffffff" }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedPortfolio && (
            <Box id="portfolio-results">
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Vote Distribution (Pie Chart)
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={selectedPortfolio.results}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ candidate, percentage }) =>
                          `${candidate}: ${percentage}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="votes"
                      >
                        {selectedPortfolio.results.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getCellColor(
                              entry,
                              index,
                              selectedPortfolio.results
                            )}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [
                          `${value} votes`,
                          props.payload.candidate,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Vote Comparison (Bar Chart)
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedPortfolio.results}>
                      <XAxis
                        dataKey="candidate"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => [`${value} votes`, name]}
                      />
                      <Bar dataKey="votes">
                        {selectedPortfolio.results.map((entry, index) => (
                          <Cell
                            key={`cell-bar-${index}`}
                            fill={getCellColor(
                              entry,
                              index,
                              selectedPortfolio.results
                            )}
                          />
                        ))}
                        <LabelList dataKey="votes" position="top" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>

              <Typography variant="h6" gutterBottom>
                Detailed Results:
              </Typography>
              {selectedPortfolio.results.map((result, index) => (
                <Box
                  key={index}
                  display="flex"
                  alignItems="center"
                  mt={2}
                  p={2}
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    bgcolor: result.rank === 1 ? "#888888" : "background.paper",
                    color: result.rank === 1 ? "#ffffff" : "inherit",
                  }}
                >
                  <Avatar
                    src={result.picture}
                    alt={result.candidate}
                    sx={{ width: 64, height: 64, marginRight: 2 }}
                  />
                  <Box flexGrow={1}>
                    <Typography variant="h6">
                      {result.rank}. {result.candidate}
                      {result.rank === 1}
                    </Typography>
                    <Typography variant="body1">
                      Votes: <strong>{result.votes}</strong>
                    </Typography>
                    <Typography variant="body1">
                      Percentage: <strong>{result.percentage}%</strong>
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePrint} variant="contained" color="secondary">
            Print Result
          </Button>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
VoteResults.propTypes = {
  // If you use this component elsewhere and pass props, define them here.
  // The payload prop is used in the Tooltip formatter, so we define its shape.
  payload: PropTypes.shape({
    candidate: PropTypes.string,
  }),
};

export default VoteResults;
