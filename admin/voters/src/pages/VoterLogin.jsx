import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Button,
  TextField,
  Typography,
  Container,
  Box,
  Snackbar,
  Alert,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import DialpadIcon from '@mui/icons-material/Dialpad';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const VoterLogin = () => {
  const [indexNumber, setIndexNumber] = useState('');
  const [code, setCode] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const { login, currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    if (currentUser) {
      navigate('/voting-platform');
    }
  }, [currentUser, navigate]);

  const handleIndexNumberChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,6}$/.test(value)) {
      setIndexNumber(value);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value;
    if (/^[a-zA-Z0-9]{0,6}$/.test(value)) {
      setCode(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (indexNumber.length !== 6 || code.length !== 6) {
      setSnackbarMessage('Index number and code must be exactly 6 characters');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const result = await login(indexNumber, code);
    
    if (result.success) {
      setSnackbarMessage('Login successful! Redirecting...');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      
      // Redirect after brief delay
      setTimeout(() => {
        navigate('/voting-platform');
      }, 1000);
    } else {
      setSnackbarMessage(result.error || 'Invalid credentials');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Box
        sx={{
          boxShadow: 3,
          padding: 4,
          borderRadius: 2,
          backgroundColor: 'white',
          textAlign: 'center',
          border: '2px solid',
          borderColor: 'primary.main'
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          VOTER LOGIN
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Index Number *"
            type="text"
            variant="outlined"
            fullWidth
            margin="normal"
            value={indexNumber}
            onChange={handleIndexNumberChange}
            required
            inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <DialpadIcon />
                </InputAdornment>
              ),
            }}
            disabled={authLoading}
          />
          <TextField
            label="Code *"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={code}
            onChange={handleCodeChange}
            required
            inputProps={{ maxLength: 6 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              ),
            }}
            disabled={authLoading}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
            disabled={indexNumber.length !== 6 || code.length !== 6 || authLoading}
          >
            {authLoading ? <CircularProgress size={24} /> : 'LOGIN'}
          </Button>
        </form>
      </Box>
      <Box
        component="footer"
        sx={{
          mt: 5,
          textAlign: 'center',
          color: 'text.secondary',
          fontSize: '0.875rem',
        }}
      >
        © 2025 7D Creations. All rights reserved.
      </Box>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default VoterLogin;
