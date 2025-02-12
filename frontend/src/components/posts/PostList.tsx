import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    IconButton,
    CardActions,
    Divider,
    CardMedia,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Badge,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CommentIcon from '@mui/icons-material/Comment';
import ImageIcon from '@mui/icons-material/Image';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useAuth } from '../../contexts/AuthContext';
import CommentList from '../comments/CommentList';
import axios from 'axios';

interface Post {
    id: number;
    content: string;
    image_url?: string;
    createdAt: string;
    username: string;
    userId: number;
    likeCount: number;
    isLiked: boolean;
}

const PostList: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPost, setNewPost] = useState('');
    const [expandedPost, setExpandedPost] = useState<number | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user, token } = useAuth();

    const fetchPosts = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/posts', {
                params: { userId: user?.id }
            });
            setPosts(response.data);
        } catch (error) {
            console.error('投稿取得エラー:', error);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [user]);

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newPost.trim() && !selectedImage) || !user) return;

        const formData = new FormData();
        formData.append('content', newPost);
        if (selectedImage) {
            formData.append('image', selectedImage);
        }

        try {
            await axios.post(
                'http://localhost:3001/api/posts',
                formData,
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            setNewPost('');
            setSelectedImage(null);
            setImagePreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            fetchPosts();
        } catch (error) {
            console.error('投稿作成エラー:', error);
        }
    };

    const handleLike = async (postId: number) => {
        if (!user) return;

        try {
            const post = posts.find(p => p.id === postId);
            if (!post) return;

            if (post.isLiked) {
                await axios.delete(`http://localhost:3001/api/posts/${postId}/like`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`http://localhost:3001/api/posts/${postId}/like`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            fetchPosts();
        } catch (error) {
            console.error('いいね処理エラー:', error);
        }
    };

    const handleDeleteClick = (postId: number) => {
        setPostToDelete(postId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (postToDelete === null) return;

        try {
            await axios.delete(
                `http://localhost:3001/api/posts/${postToDelete}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            fetchPosts();
        } catch (error) {
            console.error('投稿削除エラー:', error);
        }
        setDeleteDialogOpen(false);
        setPostToDelete(null);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffMinutes < 60) {
            return `${diffMinutes}分前`;
        } else if (diffHours < 24) {
            return `${diffHours}時間前`;
        } else if (diffDays < 7) {
            return `${diffDays}日前`;
        } else {
            return date.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };

    return (
        <Box sx={{ maxWidth: 600, margin: '0 auto', p: 2 }}>
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            variant="outlined"
                            placeholder="投稿を作成..."
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        {imagePreview && (
                            <Box sx={{ mb: 2 }}>
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '200px',
                                        objectFit: 'contain'
                                    }}
                                />
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                            />
                            <IconButton
                                color="primary"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <ImageIcon />
                            </IconButton>
                            <Button
                                variant="contained"
                                type="submit"
                                disabled={!newPost.trim() && !selectedImage}
                            >
                                投稿
                            </Button>
                        </Box>
                    </form>
                </CardContent>
            </Card>

            {posts.map((post) => (
                <Card key={post.id} sx={{ mb: 2 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2">
                                {post.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {formatDate(post.createdAt)}
                            </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            {post.content}
                        </Typography>
                        {post.image_url && (
                            <CardMedia
                                component="img"
                                image={`http://localhost:3001${post.image_url}`}
                                alt="Post image"
                                sx={{
                                    maxHeight: 300,
                                    objectFit: 'contain',
                                    mb: 2
                                }}
                            />
                        )}
                    </CardContent>
                    <Divider />
                    <CardActions>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', px: 1 }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton
                                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                                    size="small"
                                >
                                    <CommentIcon />
                                </IconButton>
                                <IconButton
                                    onClick={() => handleLike(post.id)}
                                    size="small"
                                    color={post.isLiked ? "error" : "default"}
                                >
                                    <Badge badgeContent={post.likeCount} color="error">
                                        {post.isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                    </Badge>
                                </IconButton>
                            </Box>
                            {user && user.id === post.userId && (
                                <IconButton
                                    onClick={() => handleDeleteClick(post.id)}
                                    color="error"
                                    size="small"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            )}
                        </Box>
                    </CardActions>
                    {expandedPost === post.id && (
                        <Box sx={{ p: 2 }}>
                            <CommentList postId={post.id} />
                        </Box>
                    )}
                </Card>
            ))}

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>投稿の削除</DialogTitle>
                <DialogContent>
                    <Typography>
                        この投稿を削除してもよろしいですか？
                        この操作は取り消せません。
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        キャンセル
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error">
                        削除
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PostList;
