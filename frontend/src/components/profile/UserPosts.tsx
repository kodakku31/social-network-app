import React, { useState, useEffect } from 'react';
import {
    Grid,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Box,
    Pagination,
    IconButton,
    CardActions,
    Skeleton
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import axios from 'axios';

interface Post {
    id: number;
    content: string;
    image_url: string | null;
    created_at: string;
    username: string;
    profile_image: string | null;
    comment_count: number;
    like_count: number;
}

interface PostsResponse {
    posts: Post[];
    totalPosts: number;
    currentPage: number;
    totalPages: number;
}

interface UserPostsProps {
    userId: string;
}

const API_BASE_URL = 'http://localhost:3001';

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

const UserPosts: React.FC<UserPostsProps> = ({ userId }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await axios.get<PostsResponse>(`/api/profile/${userId}/posts`, {
                params: { page }
            });
            setPosts(response.data.posts);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('投稿一覧取得エラー:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchPosts();
        }
    }, [userId, page]);

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    if (loading) {
        return (
            <Grid container spacing={2}>
                {[...Array(3)].map((_, index) => (
                    <Grid item xs={12} key={index}>
                        <Card>
                            <CardContent>
                                <Skeleton variant="text" width="60%" />
                                <Skeleton variant="rectangular" height={200} />
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    }

    if (posts.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                    投稿がありません
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Grid container spacing={2}>
                {posts.map((post) => (
                    <Grid item xs={12} key={post.id}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Box
                                        component="img"
                                        src={post.profile_image ? `${API_BASE_URL}${post.profile_image}` : '/default-avatar.png'}
                                        alt={post.username}
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            mr: 1
                                        }}
                                    />
                                    <Box>
                                        <Typography variant="subtitle1">
                                            {post.username}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(post.created_at)}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    {post.content}
                                </Typography>
                                {post.image_url && (
                                    <CardMedia
                                        component="img"
                                        image={`${API_BASE_URL}${post.image_url}`}
                                        alt="投稿画像"
                                        sx={{ 
                                            height: 300,
                                            objectFit: 'cover',
                                            borderRadius: 1
                                        }}
                                    />
                                )}
                            </CardContent>
                            <CardActions>
                                <IconButton size="small">
                                    <ChatBubbleOutlineIcon />
                                </IconButton>
                                <Typography variant="caption" color="text.secondary">
                                    {post.comment_count}
                                </Typography>
                                <IconButton size="small">
                                    <FavoriteBorderIcon />
                                </IconButton>
                                <Typography variant="caption" color="text.secondary">
                                    {post.like_count}
                                </Typography>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                    />
                </Box>
            )}
        </Box>
    );
};

export default UserPosts;
