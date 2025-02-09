import express from 'express';
import multer from 'multer';
import path from 'path';
import auth from '../middleware/auth.js';
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

// ユーザープロフィールの取得
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('friends', 'username profileImage');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 友達申請の送信
router.post('/friend-request/:userId', auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 既に申請済みかチェック
    const existingRequest = targetUser.friendRequests.find(
      request => request.from.toString() === req.userId
    );
    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    targetUser.friendRequests.push({
      from: req.userId,
      status: 'pending'
    });
    await targetUser.save();

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 友達申請への応答
router.put('/friend-request/:userId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.userId);
    
    const requestIndex = user.friendRequests.findIndex(
      request => request.from.toString() === req.params.userId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (status === 'accepted') {
      // 友達リストに追加
      user.friends.push(req.params.userId);
      const otherUser = await User.findById(req.params.userId);
      otherUser.friends.push(req.userId);
      await otherUser.save();
    }

    // 申請を削除
    user.friendRequests.splice(requestIndex, 1);
    await user.save();

    res.json({ message: `Friend request ${status}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 友達リストの取得
router.get('/friends', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friends', 'username profileImage');
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// プロフィールの更新
router.put('/profile', auth, upload.single('profileImage'), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.bio !== undefined) {
      user.bio = req.body.bio;
    }

    if (req.file) {
      user.profileImage = req.file.filename;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
