import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface Post {
    id: number;
    content: string;
    username: string;
    createdAt: string;
    userId: number;
}

const PostList: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPost, setNewPost] = useState('');
    const [error, setError] = useState('');
    const { isAuthenticated } = useAuth();

    const fetchPosts = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/posts');
            setPosts(response.data);
        } catch (error) {
            console.error('投稿の取得に失敗しました:', error);
            setError('投稿の取得に失敗しました');
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.trim()) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:3001/api/posts',
                { content: newPost },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewPost('');
            fetchPosts(); // 投稿リストを更新
        } catch (error) {
            console.error('投稿の作成に失敗しました:', error);
            setError('投稿の作成に失敗しました');
        }
    };

    const handleDeletePost = async (postId: number) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `http://localhost:3001/api/posts/${postId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchPosts(); // 投稿リストを更新
        } catch (error) {
            console.error('投稿の削除に失敗しました:', error);
            setError('投稿の削除に失敗しました');
        }
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            {isAuthenticated && (
                <Box component="form" onSubmit={handleCreatePost} sx={{ mb: 4 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        placeholder="投稿内容を入力..."
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
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
                </Box>
            )}

            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}

            {posts.map((post) => (
                <Card key={post.id} sx={{ mb: 2 }}>
                    <CardContent>
                        <Typography variant="h6" component="div">
                            {post.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {new Date(post.createdAt).toLocaleString()}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            {post.content}
                        </Typography>
                        {isAuthenticated && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeletePost(post.id)}
                                >
                                    削除
                                </Button>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            ))}
        </Box>
    );
};

export default PostList;
