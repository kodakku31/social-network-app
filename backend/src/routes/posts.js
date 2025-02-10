const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../config/database');

// 投稿を作成
router.post('/', auth, async (req, res) => {
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
        return res.status(400).json({ error: '投稿内容は必須です' });
    }

    try {
        const result = await new Promise((resolve, reject) => {
            const query = 'INSERT INTO posts (user_id, content, created_at) VALUES (?, ?, datetime("now"))';
            db.run(query, [userId, content], function(err) {
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

// 全ての投稿を取得
router.get('/', async (req, res) => {
    try {
        const posts = await new Promise((resolve, reject) => {
            const query = `
                SELECT p.*, u.username,
                       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
                FROM posts p
                JOIN users u ON p.user_id = u.id
                ORDER BY p.created_at DESC
            `;
            db.all(query, [], (err, rows) => {
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
router.put('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
        return res.status(400).json({ error: '投稿内容は必須です' });
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
            db.run('UPDATE posts SET content = ? WHERE id = ?', [content, id], (err) => {
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

        await new Promise((resolve, reject) => {
            db.run('DELETE FROM posts WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        res.json({ message: '投稿が削除されました' });
    } catch (error) {
        console.error('投稿削除エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

module.exports = router;
