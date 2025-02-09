import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileData {
  username: string;
  email: string;
  profileImage: string;
  bio?: string;
  friends: Array<{
    _id: string;
    username: string;
    profileImage: string;
  }>;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState({
    bio: '',
    newImage: null as File | null
  });

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/users/profile`);
      setProfile(response.data);
      setEditData({ ...editData, bio: response.data.bio || '' });
    } catch (error) {
      console.error('プロフィールの取得に失敗しました:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditOpen = () => {
    setOpenEdit(true);
  };

  const handleEditClose = () => {
    setOpenEdit(false);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setEditData({ ...editData, newImage: event.target.files[0] });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append('bio', editData.bio);
      if (editData.newImage) {
        formData.append('profileImage', editData.newImage);
      }

      await axios.put('http://localhost:5000/api/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      fetchProfile();
      handleEditClose();
    } catch (error) {
      console.error('プロフィールの更新に失敗しました:', error);
    }
  };

  if (!profile) {
    return <Typography>読み込み中...</Typography>;
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              src={`http://localhost:5000/uploads/${profile.profileImage}`}
              sx={{ width: 100, height: 100, mr: 2 }}
            />
            <Box>
              <Typography variant="h5">{profile.username}</Typography>
              <Typography color="textSecondary">{profile.email}</Typography>
              {profile.bio && (
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {profile.bio}
                </Typography>
              )}
            </Box>
            <Button
              startIcon={<EditIcon />}
              onClick={handleEditOpen}
              sx={{ ml: 'auto' }}
            >
              編集
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        友達 ({profile.friends.length})
      </Typography>
      <Grid container spacing={2}>
        {profile.friends.map((friend) => (
          <Grid item xs={12} sm={6} md={4} key={friend._id}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  src={`http://localhost:5000/uploads/${friend.profileImage}`}
                  sx={{ mr: 2 }}
                />
                <Typography>{friend.username}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openEdit} onClose={handleEditClose}>
        <DialogTitle>プロフィールを編集</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="自己紹介"
            multiline
            rows={4}
            value={editData.bio}
            onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
            sx={{ mt: 2 }}
          />
          <Button
            component="label"
            variant="outlined"
            sx={{ mt: 2 }}
          >
            プロフィール画像を変更
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>キャンセル</Button>
          <Button onClick={handleSaveProfile} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
