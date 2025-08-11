import { useState, useEffect } from "react";
import {
  AppBar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  TextField,
  Fade,
  Collapse,Grid,
  Card, CardContent
} from "@mui/material";
import {
  BarChart,
  PersonAdd,
  Assignment,
  Code,
  Settings,
  ExpandLess,
  ExpandMore,
  AddCircle,
  Visibility,
} from "@mui/icons-material";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Logo7DCreationz from "./Logo7DCreationz";
const drawerWidth = 240;

const AdminDashboard = () => {
  const location = useLocation();
  let userRole =
    location.state?.userRole || localStorage.getItem("userRole") || "Admin";

  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [openAddMenu, setOpenAddMenu] = useState(false);
  const [openViewMenu, setOpenViewMenu] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "User",
    staffId: "N/A",
    picture: "https://via.placeholder.com/150",
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
          const q = query(
            collection(db, "admin"),
            where("email", "==", userEmail)
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            const userName = userData.firstName || "User";
            setUserProfile({
              name: userName,
              staffId: userData.id || querySnapshot.docs[0].id || "N/A",
              picture: userData.imageUrl || "https://via.placeholder.com/150",
            });
            localStorage.setItem("userName", userName);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);
    const [stats, setStats] = useState({
    totalVoters: 0,
    totalCandidates: 0,
    totalPortfolios: 0,
    voterTurnout: 0,
  });

  useEffect(() => {
    // Set up real-time listeners
    const votersRef = collection(db, "voters");
    const candidatesRef = collection(db, "candidates");
    const portfoliosRef = collection(db, "portfolios");

    // Real-time listener for voters
    const unsubscribeVoters = onSnapshot(votersRef, (snapshot) => {
      const voters = snapshot.docs;
      const totalVoters = voters.length;
      const votedCount = voters.filter(
        (doc) => doc.data().isVoted === "yes" || doc.data().isVoted === true
      ).length;
      const voterTurnout = totalVoters > 0 ? ((votedCount / totalVoters) * 100).toFixed(2) : 0;

      setStats(prev => ({
        ...prev,
        totalVoters,
        voterTurnout,
      }));
    });

    // Real-time listener for candidates
    const unsubscribeCandidates = onSnapshot(candidatesRef, (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalCandidates: snapshot.size,
      }));
    });

    // Real-time listener for portfolios
    const unsubscribePortfolios = onSnapshot(portfoliosRef, (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalPortfolios: snapshot.size,
      }));
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeVoters();
      unsubscribeCandidates();
      unsubscribePortfolios();
    };
  }, []);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    setOpenProfileDialog(true);
    handleMenuClose();
  };

  const handleDialogClose = () => {
    setOpenProfileDialog(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    sessionStorage.removeItem("userToken");
    navigate("/");
  };

  return (
    <>
    

      <div style={{ display: "flex" }}>
        <AppBar
          position="fixed"
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: "#444240ff",
          }}
        >
          <Toolbar>
            <Logo7DCreationz />

            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Admin Dashboard
            </Typography>

            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              E-Voting System Platform
            </Typography>
            <Typography variant="body1" sx={{ marginRight: 2 }}>
              {userProfile.name}
            </Typography>
            <IconButton onClick={handleMenuClick} color="inherit">
              <Settings />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleProfileClick}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              boxShadow: "2px 0 5px rgba(0, 0, 0, 0.2)",
            },
          }}
        >
          
          <Toolbar />
          <List>
            {userRole === "Staff" ? (
              <>
                {/* Staff only sees Generate Code */}
                <ListItem button component={Link} to="generate-code">
                  <ListItemIcon>
                    <Code />
                  </ListItemIcon>
                  <ListItemText primary="Generate Code" />
                </ListItem>
              </>
            ) : userRole === "Manager" ? (
              <>
                {/* Manager sees only View Results, Generate Code, and Vote Counting Screen */}
                <ListItem button component={Link} to="vote-results">
                  <ListItemIcon>
                    <BarChart />
                  </ListItemIcon>
                  <ListItemText primary="View Results" />
                </ListItem>
                <ListItem button component={Link} to="generate-code">
                  <ListItemIcon>
                    <Code />
                  </ListItemIcon>
                  <ListItemText primary="Generate Code" />
                </ListItem>
                <ListItem button component={Link} to="vote-counting">
                  <ListItemIcon>
                    <Assignment />
                  </ListItemIcon>
                  <ListItemText primary="Vote Counting" />
                </ListItem>
              </>
            ) : (
              <>
                {/* Add Components Dropdown */}
                <ListItemButton onClick={() => setOpenAddMenu(!openAddMenu)}>
                  <ListItemIcon>
                    <AddCircle />
                  </ListItemIcon>
                  <ListItemText primary="Add Components" />
                  {openAddMenu ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={openAddMenu} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <ListItem
                      button
                      component={Link}
                      to="register-voter"
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        <PersonAdd />
                      </ListItemIcon>
                      <ListItemText primary="Add Voter" />
                    </ListItem>
                    <ListItem
                      button
                      component={Link}
                      to="register-candidate"
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        <PersonAdd />
                      </ListItemIcon>
                      <ListItemText primary="Add Candidate" />
                    </ListItem>
                    <ListItem
                      button
                      component={Link}
                      to="add-staff"
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        <PersonAdd />
                      </ListItemIcon>
                      <ListItemText primary="Add Staff" />
                    </ListItem>
                    <ListItem
                      button
                      component={Link}
                      to="add-class"
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        <PersonAdd />
                      </ListItemIcon>
                      <ListItemText primary="Add Class" />
                    </ListItem>
                  </List>
                </Collapse>

                {/* View Components Dropdown */}
                <ListItemButton onClick={() => setOpenViewMenu(!openViewMenu)}>
                  <ListItemIcon>
                    <Visibility />
                  </ListItemIcon>
                  <ListItemText primary="View Components" />
                  {openViewMenu ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={openViewMenu} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <ListItem
                      button
                      component={Link}
                      to="voters-list"
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        <BarChart />
                      </ListItemIcon>
                      <ListItemText primary="View Voters" />
                    </ListItem>
                    <ListItem
                      button
                      component={Link}
                      to="view-candidates"
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        <BarChart />
                      </ListItemIcon>
                      <ListItemText primary="View Candidates" />
                    </ListItem>
                    <ListItem
                      button
                      component={Link}
                      to="view-portfolio"
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        <BarChart />
                      </ListItemIcon>
                      <ListItemText primary="View Portfolio" />
                    </ListItem>
                    <ListItem
                      button
                      component={Link}
                      to="staff-list"
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        <BarChart />
                      </ListItemIcon>
                      <ListItemText primary="View Staff" />
                    </ListItem>
                    <ListItem
                      button
                      component={Link}
                      to="vote-results"
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        <BarChart />
                      </ListItemIcon>
                      <ListItemText primary="View Results" />
                    </ListItem>
                  </List>
                </Collapse>

                {/* Other items */}
                <ListItem button component={Link} to="generate-code">
                  <ListItemIcon>
                    <Code />
                  </ListItemIcon>
                  <ListItemText primary="Generate Code" />
                </ListItem>
                <ListItem button component={Link} to="vote-counting">
                  <ListItemIcon>
                    <Assignment />
                  </ListItemIcon>
                  <ListItemText primary="Vote Counting" />
                </ListItem>
              </>
            )}
          </List>
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: "background.default",
            p: 3,
            marginTop: "64px",
          }}
        >
          <Box sx={{bgcolor: '#f5f5f5'}}>
      
      
      
      <Grid container spacing={1}>
        <Grid item xs={8} sm={4} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Total Voters
              </Typography>
              <Typography variant="h4" color="#b85d18ff" align="center">
                {stats.totalVoters}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={8} sm={4} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Total Candidates
              </Typography>
              <Typography variant="h4" color="#b85d18ff" align="center">
                {stats.totalCandidates}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={8} sm={4} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Total Portfolios
              </Typography>
              <Typography variant="h4" color="#b85d18ff" align="center" >
                {stats.totalPortfolios}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={8} sm={4} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Voter Turnout
              </Typography>
              <Typography variant="h4" color="#b85d18ff" align="center">
                {stats.voterTurnout}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
          <Fade in={true} timeout={500}>
            <div>
              <Outlet />
            </div>
          </Fade>
        </Box>

        <Dialog
          open={openProfileDialog}
          onClose={handleDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Profile</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Avatar
                src={userProfile.picture}
                alt={userProfile.name}
                sx={{ width: 100, height: 100, marginBottom: 2 }}
              />
              <TextField
                name="name"
                label="Name"
                value={userProfile.name}
                margin="normal"
                fullWidth
                disabled
              />
              <TextField
                name="staffId"
                label="Staff ID"
                value={userProfile.staffId}
                margin="normal"
                fullWidth
                disabled
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Close</Button>
          </DialogActions>
        </Dialog>
      </div>
      <footer
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          textAlign: "center",
          boxShadow: "0 -2px 5px rgba(0,0,0,0.1)",
        }}
      >
        <Typography variant="body2" color="textSecondary">
          © {new Date().getFullYear()} 7D Creationz. All rights reserved.
        </Typography>
      </footer>
    </>
  );
};

export default AdminDashboard;
