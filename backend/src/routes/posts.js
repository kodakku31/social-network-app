import express from 'express';
import multer from 'multer';
import path from 'path';
import auth from '../middleware/auth.js';
import Post from '../models/Post.js';
import User from '../models/User.js';

const router = express.Router();

// 画像アップロード設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB制限
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type - only JPEG, JPG and PNG allowed'));
  }
});

// 新規投稿の作成
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    const post = new Post({
      author: req.userId,
      content,
      image: req.file ? req.file.filename : undefined
    });

    await post.save();
    await post.populate('author', 'username profileImage');
    
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// フィードの取得
router.get('/feed', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const posts = await Post.find({
      $or: [
        { author: { $in: [...user.friends, req.userId] } }
      ]
    })
    .sort('-createdAt')
    .populate('author', 'username profileImage')
    .populate('comments.user', 'username profileImage');

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// いいねの追加/削除
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.userId);
    if (likeIndex === -1) {
      post.likes.push(req.userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// コメントの追加
router.post('/:postId/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      user: req.userId,
      content
    });

    await post.save();
    await post.populate('comments.user', 'username profileImage');
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
