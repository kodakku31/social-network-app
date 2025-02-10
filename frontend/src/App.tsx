import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import PostList from './components/posts/PostList';

const Navigation = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          ソーシャルネットワークアプリ
        </Typography>
        {isAuthenticated ? (
          <>
            <Button color="inherit" component={Link} to="/">
              ホーム
            </Button>
            <Button color="inherit" onClick={logout}>
              ログアウト
            </Button>
          </>
        ) : (
          <>
            <Button color="inherit" component={Link} to="/login">
              ログイン
            </Button>
            <Button color="inherit" component={Link} to="/register">
              新規登録
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Container>
          <Box sx={{ mt: 4 }}>
            <Routes>
              <Route path="/" element={<PostList />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </Box>
        </Container>
      </Router>
    </AuthProvider>
  );
};

export default App;
