const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const auth = require('../middleware/auth');
const db = require('../config/database');

// プロフィール画像のアップロード設定
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads/profiles'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('画像ファイル（jpeg, jpg, png, gif）のみアップロード可能です'));
    }
});

// プロフィール情報の取得
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // ユーザー情報の取得
        const user = await new Promise((resolve, reject) => {
            const query = `
                SELECT id, username, email, profile_image, bio, location, website, created_at 
                FROM users 
                WHERE id = ?
            `;
            db.get(query, [userId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!user) {
            return res.status(404).json({ error: 'ユーザーが見つかりません' });
        }

        // フォロワー数の取得
        const followers = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [userId], (err, row) => {
                if (err) reject(err);
                resolve(row ? row.count : 0);
            });
        });

        // フォロー中のユーザー数の取得
        const following = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?', [userId], (err, row) => {
                if (err) reject(err);
                resolve(row ? row.count : 0);
            });
        });

        // 投稿数の取得
        const posts = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [userId], (err, row) => {
                if (err) reject(err);
                resolve(row ? row.count : 0);
            });
        });

        res.json({
            ...user,
            followers,
            following,
            posts
        });
    } catch (error) {
        console.error('プロフィール取得エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// プロフィール情報を更新
router.put('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { bio, location, website } = req.body;

        await new Promise((resolve, reject) => {
            const query = `
                UPDATE users 
                SET bio = ?, location = ?, website = ?
                WHERE id = ?
            `;
            db.run(query, [bio, location, website, userId], (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        res.json({ message: 'プロフィールを更新しました' });
    } catch (error) {
        console.error('プロフィール更新エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// プロフィール画像を更新
router.post('/image', auth, upload.single('image'), async (req, res) => {
    try {
        const userId = req.user.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: '画像ファイルが必要です' });
        }

        const profileImage = `/uploads/profiles/${file.filename}`;

        // 古いプロフィール画像の削除
        const oldImage = await new Promise((resolve, reject) => {
            db.get('SELECT profile_image FROM users WHERE id = ?', [userId], (err, row) => {
                if (err) reject(err);
                resolve(row ? row.profile_image : null);
            });
        });

        if (oldImage) {
            const oldImagePath = path.join(__dirname, '../..', oldImage);
            try {
                await fs.unlink(oldImagePath);
            } catch (error) {
                console.error('古い画像の削除に失敗:', error);
            }
        }

        // 新しい画像パスの保存
        await new Promise((resolve, reject) => {
            const query = `
                UPDATE users 
                SET profile_image = ?
                WHERE id = ?
            `;
            db.run(query, [profileImage, userId], (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        res.json({ 
            message: 'プロフィール画像を更新しました',
            profileImage 
        });
    } catch (error) {
        console.error('プロフィール画像更新エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// フォローする
router.post('/follow/:userId', auth, async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = parseInt(req.params.userId);

        if (followerId === followingId) {
            return res.status(400).json({ error: '自分自身をフォローすることはできません' });
        }

        // フォロー対象のユーザーが存在するか確認
        const userExists = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE id = ?', [followingId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!userExists) {
            return res.status(404).json({ error: 'ユーザーが見つかりません' });
        }

        // フォロー関係を作成
        await new Promise((resolve, reject) => {
            const query = 'INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)';
            db.run(query, [followerId, followingId], function(err) {
                if (err) reject(err);
                resolve(this);
            });
        });

        res.json({ message: 'フォローしました' });
    } catch (error) {
        console.error('フォローエラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// フォロー解除
router.delete('/follow/:userId', auth, async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = parseInt(req.params.userId);

        await new Promise((resolve, reject) => {
            const query = 'DELETE FROM follows WHERE follower_id = ? AND following_id = ?';
            db.run(query, [followerId, followingId], function(err) {
                if (err) reject(err);
                resolve(this);
            });
        });

        res.json({ message: 'フォロー解除しました' });
    } catch (error) {
        console.error('フォロー解除エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// フォロワー一覧の取得
router.get('/:userId/followers', async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const followers = await new Promise((resolve, reject) => {
            const query = `
                SELECT u.id, u.username, u.profile_image, u.bio
                FROM follows f
                JOIN users u ON f.follower_id = u.id
                WHERE f.following_id = ?
                ORDER BY f.created_at DESC
                LIMIT ? OFFSET ?
            `;
            db.all(query, [userId, limit, offset], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        res.json(followers);
    } catch (error) {
        console.error('フォロワー一覧取得エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// フォロー中のユーザー一覧の取得
router.get('/:userId/following', async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const following = await new Promise((resolve, reject) => {
            const query = `
                SELECT u.id, u.username, u.profile_image, u.bio
                FROM follows f
                JOIN users u ON f.following_id = u.id
                WHERE f.follower_id = ?
                ORDER BY f.created_at DESC
                LIMIT ? OFFSET ?
            `;
            db.all(query, [userId, limit, offset], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        res.json(following);
    } catch (error) {
        console.error('フォロー中一覧取得エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// ユーザーの投稿一覧を取得
router.get('/:userId/posts', async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // 投稿の総数を取得
        const totalPosts = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [userId], (err, row) => {
                if (err) reject(err);
                resolve(row ? row.count : 0);
            });
        });

        // 投稿一覧を取得
        const posts = await new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    p.*,
                    u.username,
                    u.profile_image,
                    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
                    (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count
                FROM posts p
                JOIN users u ON p.user_id = u.id
                WHERE p.user_id = ?
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?
            `;
            db.all(query, [userId, limit, offset], (err, rows) => {
                if (err) reject(err);
                resolve(rows || []);
            });
        });

        res.json({
            posts,
            totalPosts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit)
        });
    } catch (error) {
        console.error('投稿一覧取得エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

module.exports = router;
