import React, { useState, useEffect } from 'react';
import {
    List,
    ListItem,
    ListItemText,
    Typography,
    TextField,
    Button,
    IconButton,
    Box,
    Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplyIcon from '@mui/icons-material/Reply';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

interface Comment {
    id: number;
    content: string;
    createdAt: string;
    username: string;
    userId: number;
    parentId: number | null;
    replies: Comment[];
    replyCount: number;
}

interface CommentListProps {
    postId: number;
}

const CommentList: React.FC<CommentListProps> = ({ postId }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<number | null>(null);
    const { user, token } = useAuth();

    const fetchComments = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/api/comments/post/${postId}`);
            setComments(response.data);
        } catch (error) {
            console.error('コメント取得エラー:', error);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const handleSubmit = async (parentId: number | null = null) => {
        if (!newComment.trim() || !user) return;

        try {
            await axios.post(
                'http://localhost:3001/api/comments',
                {
                    postId,
                    content: newComment,
                    parentId
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setNewComment('');
            setReplyTo(null);
            fetchComments();
        } catch (error) {
            console.error('コメント投稿エラー:', error);
        }
    };

    const handleDelete = async (commentId: number) => {
        try {
            await axios.delete(
                `http://localhost:3001/api/comments/${commentId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            fetchComments();
        } catch (error) {
            console.error('コメント削除エラー:', error);
        }
    };

    const renderComment = (comment: Comment, isReply: boolean = false) => (
        <Paper
            key={comment.id}
            elevation={isReply ? 0 : 1}
            sx={{
                p: 2,
                my: 1,
                ml: isReply ? 4 : 0,
                backgroundColor: isReply ? 'rgba(0, 0, 0, 0.02)' : 'white'
            }}
        >
            <ListItem
                alignItems="flex-start"
                secondaryAction={
                    user?.id === comment.userId && (
                        <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDelete(comment.id)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    )
                }
            >
                <ListItemText
                    primary={
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography component="span" variant="subtitle2">
                                {comment.username}
                            </Typography>
                            <Typography component="span" variant="caption" color="text.secondary">
                                {new Date(comment.createdAt).toLocaleString()}
                            </Typography>
                        </Box>
                    }
                    secondary={
                        <>
                            <Typography component="span" variant="body2" color="text.primary">
                                {comment.content}
                            </Typography>
                            {!isReply && (
                                <Button
                                    startIcon={<ReplyIcon />}
                                    size="small"
                                    onClick={() => setReplyTo(comment.id)}
                                    sx={{ mt: 1 }}
                                >
                                    返信
                                </Button>
                            )}
                        </>
                    }
                />
            </ListItem>

            {replyTo === comment.id && (
                <Box sx={{ ml: 4, mt: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="返信を入力..."
                        variant="outlined"
                    />
                    <Box sx={{ mt: 1 }}>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleSubmit(comment.id)}
                        >
                            返信する
                        </Button>
                        <Button
                            size="small"
                            onClick={() => setReplyTo(null)}
                            sx={{ ml: 1 }}
                        >
                            キャンセル
                        </Button>
                    </Box>
                </Box>
            )}

            {comment.replies && comment.replies.length > 0 && (
                <List>
                    {comment.replies.map(reply => renderComment(reply, true))}
                </List>
            )}
        </Paper>
    );

    return (
        <Box sx={{ mt: 2 }}>
            {user && (
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="コメントを入力..."
                        variant="outlined"
                    />
                    <Button
                        variant="contained"
                        onClick={() => handleSubmit(null)}
                        sx={{ mt: 1 }}
                    >
                        コメントする
                    </Button>
                </Box>
            )}

            <List>
                {comments.map(comment => renderComment(comment))}
            </List>
        </Box>
    );
};

export default CommentList;
