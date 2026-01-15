import { Container, Box, Typography, Button } from '@mui/material';

function App(): JSX.Element {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 3,
        }}
      >
        <Typography variant="h1" component="h1" textAlign="center">
          Adaptive BBSB Trainer
        </Typography>
        <Typography variant="body1" color="textSecondary" textAlign="center" sx={{ maxWidth: 600 }}>
          A powerful training application built with React, TypeScript, and Material Design 3.
        </Typography>
        <Button variant="contained" color="primary" size="large">
          Get Started
        </Button>
      </Box>
    </Container>
  );
}

export default App;
