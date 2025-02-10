import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, Typography } from '@mui/material';

const App: React.FC = () => {
  return (
    <Router>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ソーシャルネットワークアプリ
        </Typography>
        <Routes>
          <Route path="/" element={<div>ホーム画面（準備中）</div>} />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;
