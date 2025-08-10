import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  Fab,
  Checkbox,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const PortfolioList = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [selectedPortfolios, setSelectedPortfolios] = useState([]);
  const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const portfolioCollection = collection(db, "portfolios");
      const portfolioSnapshot = await getDocs(portfolioCollection);
      const portfolioList = portfolioSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPortfolios(portfolioList);
    } catch (error) {
      console.error("Error fetching portfolios:", error);
      setSnackbar({
        open: true,
        message: "Error fetching portfolio data",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedPortfolio(null);
    setForm({ name: "", description: "" });
    setOpenDialog(true);
  };

  const handleEdit = (portfolio) => {
    setSelectedPortfolio(portfolio);
    setForm({ name: portfolio.name || "", description: portfolio.description || "" });
    setOpenDialog(true);
  };

  const handleDelete = (portfolio) => {
    setPortfolioToDelete(portfolio);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "portfolios", portfolioToDelete.id));
      setPortfolios(portfolios.filter((p) => p.id !== portfolioToDelete.id));
      setSnackbar({
        open: true,
        message: "Portfolio deleted successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting portfolio:", error);
      setSnackbar({
        open: true,
        message: "Error deleting portfolio",
        severity: "error",
      });
    }
    setOpenDeleteDialog(false);
    setPortfolioToDelete(null);
  };

  const handleSave = async () => {
    try {
      if (selectedPortfolio) {
        // Update existing
        await updateDoc(doc(db, "portfolios", selectedPortfolio.id), form);
        setPortfolios(
          portfolios.map((p) =>
            p.id === selectedPortfolio.id ? { ...p, ...form } : p
          )
        );
        setSnackbar({
          open: true,
          message: "Portfolio updated successfully",
          severity: "success",
        });
      } else {
        // Add new
        const docRef = await addDoc(collection(db, "portfolios"), form);
        setPortfolios([...portfolios, { id: docRef.id, ...form }]);
        setSnackbar({
          open: true,
          message: "Portfolio added successfully",
          severity: "success",
        });
      }
      setOpenDialog(false);
      setSelectedPortfolio(null);
    } catch (error) {
      console.error("Error saving portfolio:", error);
      setSnackbar({
        open: true,
        message: "Error saving portfolio",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedPortfolios(portfolios.map(p => p.id));
    } else {
      setSelectedPortfolios([]);
    }
  };

  const handleSelectPortfolio = (portfolioId) => {
    setSelectedPortfolios(prev => 
      prev.includes(portfolioId)
        ? prev.filter(id => id !== portfolioId)
        : [...prev, portfolioId]
    );
  };

  const handleBulkDelete = () => {
    setOpenBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const deletePromises = selectedPortfolios.map(id => 
        deleteDoc(doc(db, "portfolios", id))
      );
      await Promise.all(deletePromises);
      
      setPortfolios(portfolios.filter(p => !selectedPortfolios.includes(p.id)));
      setSelectedPortfolios([]);
      setSnackbar({
        open: true,
        message: `${selectedPortfolios.length} portfolio(s) deleted successfully`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting portfolios:", error);
      setSnackbar({
        open: true,
        message: "Error deleting portfolios",
        severity: "error",
      });
    }
    setOpenBulkDeleteDialog(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Portfolio Management
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          {selectedPortfolios.length > 0 && (
            <Button
              variant="contained"
              color="error"
              onClick={handleBulkDelete}
              startIcon={<DeleteIcon />}
            >
              Delete Selected ({selectedPortfolios.length})
            </Button>
          )}
          <Tooltip title="Add New Portfolio">
            <Fab color="primary" aria-label="add" onClick={handleAdd}>
              <AddIcon />
            </Fab>
          </Tooltip>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedPortfolios.length === portfolios.length && portfolios.length > 0}
                      indeterminate={selectedPortfolios.length > 0 && selectedPortfolios.length < portfolios.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {portfolios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body1" color="text.secondary">
                        No portfolios found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  portfolios.map((portfolio) => (
                    <TableRow key={portfolio.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedPortfolios.includes(portfolio.id)}
                          onChange={() => handleSelectPortfolio(portfolio.id)}
                        />
                      </TableCell>
                      <TableCell>{portfolio.name || "N/A"}</TableCell>
                      <TableCell>{portfolio.description || "N/A"}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEdit(portfolio)} color="primary">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDelete(portfolio)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedPortfolio ? "Edit Portfolio" : "Add Portfolio"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            margin="normal"
            multiline
            rows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {selectedPortfolio ? "Save Changes" : "Add Portfolio"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the portfolio &quot;{portfolioToDelete?.title}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={openBulkDeleteDialog} onClose={() => setOpenBulkDeleteDialog(false)}>
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedPortfolios.length} portfolio(s)? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmBulkDelete} color="error" variant="contained">
            Delete {selectedPortfolios.length} Portfolio(s)
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PortfolioList;
