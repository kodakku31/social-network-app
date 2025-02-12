const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const db = require('../config/database');
const fs = require('fs');

// 画像アップロードの設定
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads/posts'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
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

// 投稿を作成
router.post('/', auth, upload.single('image'), async (req, res) => {
    const { content } = req.body;
    const userId = req.user.id;
    const imageUrl = req.file ? `/uploads/posts/${req.file.filename}` : null;

    if (!content && !imageUrl) {
        return res.status(400).json({ error: '投稿内容または画像が必要です' });
    }

    try {
        const result = await new Promise((resolve, reject) => {
            const query = 'INSERT INTO posts (user_id, content, image_url, created_at) VALUES (?, ?, ?, datetime("now"))';
            db.run(query, [userId, content, imageUrl], function(err) {
                if (err) reject(err);
                resolve(this);
            });
        });

        const post = await new Promise((resolve, reject) => {
            const query = `
                SELECT p.*, u.username
                FROM posts p
                JOIN users u ON p.user_id = u.id
                WHERE p.id = ?
            `;
            db.get(query, [result.lastID], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        res.status(201).json(post);
    } catch (error) {
        console.error('投稿作成エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// いいね数を含む投稿一覧を取得
router.get('/', async (req, res) => {
    try {
        const posts = await new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    p.id,
                    p.content,
                    p.image_url,
                    p.created_at as createdAt,
                    p.user_id as userId,
                    u.username,
                    COUNT(DISTINCT l.user_id) as likeCount,
                    EXISTS (
                        SELECT 1 
                        FROM likes 
                        WHERE post_id = p.id 
                        AND user_id = COALESCE(?, -1)
                    ) as isLiked
                FROM posts p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN likes l ON p.id = l.post_id
                GROUP BY p.id
                ORDER BY p.created_at DESC
            `;
            db.all(query, [req.query.userId || null], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        res.json(posts);
    } catch (error) {
        console.error('投稿取得エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// 特定の投稿を取得
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const post = await new Promise((resolve, reject) => {
            const query = `
                SELECT p.*, u.username,
                       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
                FROM posts p
                JOIN users u ON p.user_id = u.id
                WHERE p.id = ?
            `;
            db.get(query, [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!post) {
            return res.status(404).json({ error: '投稿が見つかりません' });
        }

        res.json(post);
    } catch (error) {
        console.error('投稿取得エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// 投稿を更新
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const imageUrl = req.file ? `/uploads/posts/${req.file.filename}` : null;

    if (!content && !imageUrl) {
        return res.status(400).json({ error: '投稿内容または画像が必要です' });
    }

    try {
        const post = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM posts WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!post) {
            return res.status(404).json({ error: '投稿が見つかりません' });
        }

        if (post.user_id !== userId) {
            return res.status(403).json({ error: 'この投稿を編集する権限がありません' });
        }

        await new Promise((resolve, reject) => {
            const query = 'UPDATE posts SET content = ?, image_url = ? WHERE id = ?';
            db.run(query, [content, imageUrl, id], (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        const updatedPost = await new Promise((resolve, reject) => {
            const query = `
                SELECT p.*, u.username
                FROM posts p
                JOIN users u ON p.user_id = u.id
                WHERE p.id = ?
            `;
            db.get(query, [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        res.json(updatedPost);
    } catch (error) {
        console.error('投稿更新エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// 投稿を削除
router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const post = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM posts WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!post) {
            return res.status(404).json({ error: '投稿が見つかりません' });
        }

        if (post.user_id !== userId) {
            return res.status(403).json({ error: 'この投稿を削除する権限がありません' });
        }

        // 投稿に関連する画像を削除
        if (post.image_url) {
            const imagePath = path.join(__dirname, '../..', post.image_url);
            try {
                await fs.unlink(imagePath);
            } catch (error) {
                console.error('画像削除エラー:', error);
            }
        }

        // 投稿を削除
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM posts WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        res.json({ message: '投稿を削除しました' });
    } catch (error) {
        console.error('投稿削除エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// いいねを追加
router.post('/:postId/like', auth, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        // 投稿の存在確認
        const post = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM posts WHERE id = ?', [postId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!post) {
            return res.status(404).json({ error: '投稿が見つかりません' });
        }

        // いいねの重複チェック
        const existingLike = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM likes WHERE post_id = ? AND user_id = ?',
                [postId, userId],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });

        if (existingLike) {
            return res.status(400).json({ error: 'すでにいいねしています' });
        }

        // いいねを追加
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO likes (post_id, user_id, created_at) VALUES (?, ?, datetime("now"))',
                [postId, userId],
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });

        res.json({ message: 'いいねを追加しました' });
    } catch (error) {
        console.error('いいね追加エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// いいねを解除
router.delete('/:postId/like', auth, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        // いいねの存在確認
        const like = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM likes WHERE post_id = ? AND user_id = ?',
                [postId, userId],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });

        if (!like) {
            return res.status(404).json({ error: 'いいねが見つかりません' });
        }

        // いいねを削除
        await new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
                [postId, userId],
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });

        res.json({ message: 'いいねを解除しました' });
    } catch (error) {
        console.error('いいね解除エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// 投稿のいいねしたユーザー一覧を取得
router.get('/:postId/likes', async (req, res) => {
    const { postId } = req.params;

    try {
        const users = await new Promise((resolve, reject) => {
            const query = `
                SELECT u.id, u.username, u.profile_image, l.created_at as likedAt
                FROM likes l
                JOIN users u ON l.user_id = u.id
                WHERE l.post_id = ?
                ORDER BY l.created_at DESC
            `;
            db.all(query, [postId], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        res.json(users);
    } catch (error) {
        console.error('いいねユーザー取得エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

module.exports = router;
