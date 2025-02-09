import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  TextField,
  Button,
  Avatar,
  Divider
} from '@mui/material';
import { Favorite, FavoriteBorder, Comment } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface Post {
  _id: string;
  content: string;
  image?: string;
  author: {
    _id: string;
    username: string;
    profileImage: string;
  };
  likes: string[];
  comments: {
    _id: string;
    user: {
      _id: string;
      username: string;
      profileImage: string;
    };
    content: string;
    createdAt: string;
  }[];
  createdAt: string;
}

const PostFeed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/posts/feed');
      setPosts(response.data);
    } catch (error) {
      console.error('投稿の取得に失敗しました:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleLike = async (postId: string) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/posts/${postId}/like`);
      setPosts(posts.map(post =>
        post._id === postId ? response.data : post
      ));
    } catch (error) {
      console.error('いいねの処理に失敗しました:', error);
    }
  };

  const handleComment = async (postId: string) => {
    try {
      const comment = newComment[postId];
      if (!comment?.trim()) return;

      const response = await axios.post(`http://localhost:5000/api/posts/${postId}/comments`, {
        content: comment
      });

      setPosts(posts.map(post =>
        post._id === postId ? response.data : post
      ));
      setNewComment({ ...newComment, [postId]: '' });
    } catch (error) {
      console.error('コメントの投稿に失敗しました:', error);
    }
  };

  return (
    <Box>
      {posts.map((post) => (
        <Card key={post._id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                src={`http://localhost:5000/uploads/${post.author.profileImage}`}
                sx={{ mr: 2 }}
              />
              <Box>
                <Typography variant="subtitle1">
                  {post.author.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(post.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {post.content}
            </Typography>
            {post.image && (
              <CardMedia
                component="img"
                image={`http://localhost:5000/uploads/${post.image}`}
                alt="Post image"
                sx={{ maxHeight: 400, objectFit: 'contain', mb: 2 }}
              />
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <IconButton onClick={() => handleLike(post._id)}>
                {post.likes.includes(user?.id || '') ? (
                  <Favorite color="error" />
                ) : (
                  <FavoriteBorder />
                )}
              </IconButton>
              <Typography variant="body2">
                {post.likes.length} いいね
              </Typography>
              <IconButton sx={{ ml: 2 }}>
                <Comment />
              </IconButton>
              <Typography variant="body2">
                {post.comments.length} コメント
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              {post.comments.map((comment) => (
                <Box key={comment._id} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      src={`http://localhost:5000/uploads/${comment.user.profileImage}`}
                      sx={{ width: 24, height: 24, mr: 1 }}
                    />
                    <Typography variant="subtitle2">
                      {comment.user.username}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ ml: 4 }}>
                    {comment.content}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="コメントを追加..."
                value={newComment[post._id] || ''}
                onChange={(e) => setNewComment({
                  ...newComment,
                  [post._id]: e.target.value
                })}
              />
              <Button
                variant="contained"
                onClick={() => handleComment(post._id)}
                disabled={!newComment[post._id]?.trim()}
              >
                送信
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default PostFeed;
