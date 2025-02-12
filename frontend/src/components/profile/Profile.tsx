import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, Box, Avatar, Typography, Button, Grid, 
    Paper, Tab, Tabs, IconButton, TextField, Dialog,
    DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import UserPosts from './UserPosts';

// APIのベースURL
const API_BASE_URL = 'http://localhost:3001';

interface ProfileData {
    id: number;
    username: string;
    profile_image: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    followers: number;
    following: number;
    posts: number;
}

interface EditProfileData {
    bio: string;
    location: string;
    website: string;
}

const Profile: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editData, setEditData] = useState<EditProfileData>({
        bio: '',
        location: '',
        website: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Axiosのデフォルト設定
    axios.defaults.baseURL = API_BASE_URL;
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // プロフィール情報の取得
    const fetchProfile = async () => {
        try {
            const response = await axios.get(`/api/profile/${userId}`);
            setProfile(response.data);
            setEditData({
                bio: response.data.bio || '',
                location: response.data.location || '',
                website: response.data.website || ''
            });
        } catch (error) {
            console.error('プロフィール取得エラー:', error);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchProfile();
        }
    }, [userId]);

    // フォロー状態の確認
    const checkFollowStatus = async () => {
        if (!user || !userId) return;
        try {
            const response = await axios.get(`/api/profile/${userId}/followers`);
            setIsFollowing(response.data.some((follower: any) => follower.id === user.id));
        } catch (error) {
            console.error('フォロー状態確認エラー:', error);
        }
    };

    useEffect(() => {
        if (user && userId) {
            checkFollowStatus();
        }
    }, [userId, user]);

    // フォロー/フォロー解除
    const handleFollowToggle = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            if (isFollowing) {
                await axios.delete(`/api/profile/follow/${userId}`);
            } else {
                await axios.post(`/api/profile/follow/${userId}`);
            }
            setIsFollowing(!isFollowing);
            fetchProfile();
        } catch (error) {
            console.error('フォロー操作エラー:', error);
        }
    };

    // プロフィール編集
    const handleEditProfile = async () => {
        try {
            await axios.put('/api/profile', editData);
            
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                await axios.post('/api/profile/image', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            fetchProfile();
            setEditDialogOpen(false);
        } catch (error) {
            console.error('プロフィール更新エラー:', error);
        }
    };

    // 画像選択
    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setImageFile(event.target.files[0]);
        }
    };

    if (!profile) {
        return <Typography>読み込み中...</Typography>;
    }

    return (
        <Container maxWidth="md">
            <Paper sx={{ p: 3, mt: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                        <Avatar
                            src={profile.profile_image ? `${API_BASE_URL}${profile.profile_image}` : undefined}
                            sx={{ width: 150, height: 150, margin: 'auto' }}
                        />
                        {user?.id === Number(userId) && (
                            <IconButton
                                onClick={() => setEditDialogOpen(true)}
                                sx={{ mt: 1 }}
                            >
                                <EditIcon />
                            </IconButton>
                        )}
                    </Grid>
                    <Grid item xs={12} sm={8}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h5" component="h1">
                                {profile.username}
                            </Typography>
                            {user?.id !== Number(userId) && (
                                <Button
                                    variant={isFollowing ? "outlined" : "contained"}
                                    onClick={handleFollowToggle}
                                    sx={{ mt: 1 }}
                                >
                                    {isFollowing ? 'フォロー解除' : 'フォロー'}
                                </Button>
                            )}
                        </Box>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item>
                                <Typography>
                                    投稿 {profile.posts}
                                </Typography>
                            </Grid>
                            <Grid item>
                                <Typography>
                                    フォロワー {profile.followers}
                                </Typography>
                            </Grid>
                            <Grid item>
                                <Typography>
                                    フォロー中 {profile.following}
                                </Typography>
                            </Grid>
                        </Grid>
                        <Typography sx={{ mb: 1 }}>{profile.bio}</Typography>
                        {profile.location && (
                            <Typography sx={{ mb: 1 }}>📍 {profile.location}</Typography>
                        )}
                        {profile.website && (
                            <Typography>
                                🔗 <a href={profile.website} target="_blank" rel="noopener noreferrer">
                                    {profile.website}
                                </a>
                            </Typography>
                        )}
                    </Grid>
                </Grid>
            </Paper>

            <Box sx={{ mt: 3 }}>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                    <Tab label="投稿" />
                    <Tab label="フォロワー" />
                    <Tab label="フォロー中" />
                </Tabs>
                <Box sx={{ mt: 2 }}>
                    {tabValue === 0 && (
                        <UserPosts userId={userId || ''} />
                    )}
                    {tabValue === 1 && (
                        <Typography>フォロワー一覧</Typography>
                    )}
                    {tabValue === 2 && (
                        <Typography>フォロー中一覧</Typography>
                    )}
                </Box>
            </Box>

            {/* プロフィール編集ダイアログ */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
                <DialogTitle>プロフィールを編集</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <input
                            accept="image/*"
                            type="file"
                            onChange={handleImageSelect}
                            style={{ display: 'none' }}
                            id="profile-image-input"
                        />
                        <label htmlFor="profile-image-input">
                            <Button variant="outlined" component="span">
                                プロフィール画像を変更
                            </Button>
                        </label>
                    </Box>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="自己紹介"
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="場所"
                        value={editData.location}
                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="ウェブサイト"
                        value={editData.website}
                        onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>キャンセル</Button>
                    <Button onClick={handleEditProfile} variant="contained">
                        保存
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Profile;
