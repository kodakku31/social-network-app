const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../config/database');

// コメントを作成
router.post('/', auth, async (req, res) => {
    const { postId, content, parentId } = req.body;
    const userId = req.user.id;

    if (!postId || !content) {
        return res.status(400).json({ error: '投稿IDとコメント内容は必須です' });
    }

    try {
        // 投稿の存在確認
        const postExists = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM posts WHERE id = ?', [postId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!postExists) {
            return res.status(404).json({ error: '投稿が見つかりません' });
        }

        // コメントの作成
        const result = await new Promise((resolve, reject) => {
            const query = `
                INSERT INTO comments (user_id, post_id, content, parent_id, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
            `;
            db.run(query, [userId, postId, content, parentId || null], function(err) {
                if (err) reject(err);
                resolve(this);
            });
        });

        // 作成したコメントの情報を取得
        const comment = await new Promise((resolve, reject) => {
            const query = `
                SELECT c.*, u.username
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.id = ?
            `;
            db.get(query, [result.lastID], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        res.status(201).json(comment);
    } catch (error) {
        console.error('コメント作成エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// 投稿のコメントを取得
router.get('/post/:postId', async (req, res) => {
    const { postId } = req.params;

    try {
        // 投稿の存在確認
        const postExists = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM posts WHERE id = ?', [postId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!postExists) {
            return res.status(404).json({ error: '投稿が見つかりません' });
        }

        // コメントの取得
        const comments = await new Promise((resolve, reject) => {
            const query = `
                SELECT c.*, u.username
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.post_id = ?
                ORDER BY 
                    CASE WHEN c.parent_id IS NULL THEN c.created_at END DESC,
                    CASE WHEN c.parent_id IS NOT NULL THEN c.created_at END ASC
            `;
            db.all(query, [postId], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        res.json(comments);
    } catch (error) {
        console.error('コメント取得エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// コメントを削除
router.delete('/:commentId', auth, async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    try {
        // コメントの存在と所有権の確認
        const comment = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM comments WHERE id = ?', [commentId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!comment) {
            return res.status(404).json({ error: 'コメントが見つかりません' });
        }

        if (comment.user_id !== userId) {
            return res.status(403).json({ error: 'このコメントを削除する権限がありません' });
        }

        // コメントの削除（子コメントも一緒に削除）
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM comments WHERE id = ? OR parent_id = ?', [commentId, commentId], (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        res.json({ message: 'コメントが削除されました' });
    } catch (error) {
        console.error('コメント削除エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

module.exports = router;
