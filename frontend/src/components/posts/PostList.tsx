import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CommentIcon from '@mui/icons-material/Comment';
import { useAuth } from '../../contexts/AuthContext';
import CommentList from '../comments/CommentList';
import axios from 'axios';

interface Post {
    id: number;
    content: string;
    createdAt: string;
    username: string;
    userId: number;
}

const PostList: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPost, setNewPost] = useState('');
    const [expandedPost, setExpandedPost] = useState<number | null>(null);
    const { user, token } = useAuth();

    const fetchPosts = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/posts');
            setPosts(response.data);
        } catch (error) {
            console.error('投稿取得エラー:', error);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.trim() || !user) return;

        try {
            await axios.post(
                'http://localhost:3001/api/posts',
                { content: newPost },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setNewPost('');
            fetchPosts();
        } catch (error) {
            console.error('投稿エラー:', error);
        }
    };

    const handleDelete = async (postId: number) => {
        try {
            await axios.delete(
                `http://localhost:3001/api/posts/${postId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            fetchPosts();
        } catch (error) {
            console.error('削除エラー:', error);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
            {user && (
                <Card sx={{ mb: 2 }}>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                                placeholder="今何してる？"
                                variant="outlined"
                                sx={{ mb: 2 }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={!newPost.trim()}
                            >
                                投稿する
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {posts.map((post) => (
                <Card key={post.id} sx={{ mb: 2 }}>
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="subtitle2" color="text.secondary">
                                {post.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {new Date(post.createdAt).toLocaleString()}
                            </Typography>
                        </Box>
                        <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                            {post.content}
                        </Typography>
                    </CardContent>
                    <CardActions>
                        <IconButton
                            size="small"
                            onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                        >
                            <CommentIcon />
                        </IconButton>
                        {user?.id === post.userId && (
                            <IconButton
                                size="small"
                                onClick={() => handleDelete(post.id)}
                                sx={{ ml: 'auto' }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        )}
                    </CardActions>
                    {expandedPost === post.id && (
                        <>
                            <Divider />
                            <Box sx={{ px: 2, py: 1 }}>
                                <CommentList postId={post.id} />
                            </Box>
                        </>
                    )}
                </Card>
            ))}
        </Box>
    );
};

export default PostList;
