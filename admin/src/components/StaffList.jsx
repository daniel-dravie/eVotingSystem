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
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Fab,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as StaffIcon,
} from "@mui/icons-material";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

const StaffList = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "",
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const staffCollection = collection(db, "staff");
      const staffSnapshot = await getDocs(staffCollection);
      const staffList = staffSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStaff(staffList);
    } catch (error) {
      console.error("Error fetching staff:", error);
      setSnackbar({
        open: true,
        message: "Error fetching staff data",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (staffMember) => {
    setSelectedStaff(staffMember);
    setEditForm({
      fullName: staffMember.fullName || "",
      email: staffMember.email || "",
      phone: staffMember.phone || "",
      role: staffMember.role || "staff",
    });
    setOpenDialog(true);
  };

  const handleDelete = (staffMember) => {
    setStaffToDelete(staffMember);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "staff", staffToDelete.id));
      setStaff(staff.filter((s) => s.id !== staffToDelete.id));
      setSnackbar({
        open: true,
        message: "Staff member deleted successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting staff:", error);
      setSnackbar({
        open: true,
        message: "Error deleting staff member",
        severity: "error",
      });
    }
    setOpenDeleteDialog(false);
    setStaffToDelete(null);
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, "staff", selectedStaff.id), editForm);
      setStaff(
        staff.map((s) =>
          s.id === selectedStaff.id ? { ...s, ...editForm } : s
        )
      );
      setSnackbar({
        open: true,
        message: "Staff member updated successfully",
        severity: "success",
      });
      setOpenDialog(false);
      setSelectedStaff(null);
    } catch (error) {
      console.error("Error updating staff:", error);
      setSnackbar({
        open: true,
        message: "Error updating staff member",
        severity: "error",
      });
    }
  };

  const handleAddStaff = () => {
    navigate("/admin-dashboard/add-staff");
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "error";
      case "superadmin":
        return "secondary";
      case "staff":
        return "primary";
      default:
        return "default";
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return <AdminIcon />;
      case "superadmin":
        return <AdminIcon />;
      default:
        return <StaffIcon />;
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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
          Staff Management
        </Typography>
        <Tooltip title="Add New Staff">
          <Fab color="primary" aria-label="add" onClick={handleAddStaff}>
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Staff Member</TableCell>
                  <TableCell>Contact Info</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body1" color="text.secondary">
                        No staff members found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((staffMember) => (
                    <TableRow key={staffMember.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar 
                            sx={{ 
                              mr: 2, 
                              width: 50, 
                              height: 50, 
                              bgcolor: "primary.main",
                              border: "2px solid #e0e0e0"
                            }}
                            src={staffMember.imageUrl || staffMember.photoURL || staffMember.picture || staffMember.image}
                            alt={staffMember.fullName || "Staff Member"}
                          >
                            {!(staffMember.imageUrl || staffMember.photoURL || staffMember.picture || staffMember.image) && 
                              (staffMember.fullName?.charAt(0)?.toUpperCase() || <PersonIcon />)
                            }
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {staffMember.fullName || "N/A"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {staffMember.email || "No email"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box display="flex" alignItems="center" mb={1}>
                            <EmailIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                            <Typography variant="body2">{staffMember.email || "N/A"}</Typography>
                          </Box>
                          <Box display="flex" alignItems="center">
                            <PhoneIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                            <Typography variant="body2">{staffMember.phone || "N/A"}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getRoleIcon(staffMember.role)}
                          label={staffMember.role || "Staff"}
                          color={getRoleColor(staffMember.role)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label="Active"
                          color="success"
                          size="small"
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEdit(staffMember)} color="primary">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDelete(staffMember)} color="error">
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

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Staff Member</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                type="number"
                value={editForm.phone}
                onChange={(e) => {
                  const input = e.target.value;
                  // Ensure it's a number and limit to 10 digits
                  if (input === '' || (/^\d{0,10}$/.test(input))) {
                    setEditForm({ ...editForm, phone: input });
                  }
                }}
                inputProps={{ 
                  maxLength: 10,
                  min: 0,
                  max: 9999999999
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Role"
                select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {staffToDelete?.fullName}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
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

export default StaffList;
