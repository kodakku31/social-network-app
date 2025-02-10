const db = require('../config/database');

// コメントの作成
exports.createComment = (req, res) => {
    const { postId, content, parentId } = req.body;
    const userId = req.user.id;

    if (!content || !postId) {
        return res.status(400).json({ error: 'コメント内容と投稿IDは必須です' });
    }

    const query = `
        INSERT INTO comments (user_id, post_id, content, parent_id, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
    `;

    db.run(query, [userId, postId, content, parentId || null], function(err) {
        if (err) {
            console.error('コメント作成エラー:', err);
            return res.status(500).json({ error: 'コメントの作成に失敗しました' });
        }

        // 作成したコメントの情報を取得
        const getCommentQuery = `
            SELECT 
                c.id, c.content, c.created_at as createdAt,
                c.parent_id as parentId,
                u.username, u.id as userId
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `;

        db.get(getCommentQuery, [this.lastID], (err, comment) => {
            if (err) {
                console.error('コメント取得エラー:', err);
                return res.status(500).json({ error: 'コメントの取得に失敗しました' });
            }
            res.status(201).json(comment);
        });
    });
};

// 投稿に対するコメントの取得
exports.getCommentsByPost = (req, res) => {
    const { postId } = req.params;

    const query = `
        SELECT 
            c.id, c.content, c.created_at as createdAt,
            c.parent_id as parentId,
            u.username, u.id as userId,
            (SELECT COUNT(*) FROM comments WHERE parent_id = c.id) as replyCount
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY 
            CASE WHEN c.parent_id IS NULL THEN c.created_at END DESC,
            CASE WHEN c.parent_id IS NOT NULL THEN c.created_at END ASC
    `;

    db.all(query, [postId], (err, comments) => {
        if (err) {
            console.error('コメント取得エラー:', err);
            return res.status(500).json({ error: 'コメントの取得に失敗しました' });
        }

        // コメントを階層構造に整理
        const commentMap = new Map();
        const rootComments = [];

        comments.forEach(comment => {
            comment.replies = [];
            commentMap.set(comment.id, comment);
            
            if (comment.parentId === null) {
                rootComments.push(comment);
            } else {
                const parentComment = commentMap.get(comment.parentId);
                if (parentComment) {
                    parentComment.replies.push(comment);
                }
            }
        });

        res.json(rootComments);
    });
};

// コメントの削除
exports.deleteComment = (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    // コメントの所有者を確認
    const checkOwnerQuery = 'SELECT user_id FROM comments WHERE id = ?';
    db.get(checkOwnerQuery, [commentId], (err, comment) => {
        if (err) {
            console.error('コメント確認エラー:', err);
            return res.status(500).json({ error: 'コメントの確認に失敗しました' });
        }

        if (!comment) {
            return res.status(404).json({ error: 'コメントが見つかりません' });
        }

        if (comment.user_id !== userId) {
            return res.status(403).json({ error: '他のユーザーのコメントは削除できません' });
        }

        // コメントと関連する返信を削除
        const deleteQuery = `
            DELETE FROM comments 
            WHERE id = ? OR parent_id = ?
        `;

        db.run(deleteQuery, [commentId, commentId], (err) => {
            if (err) {
                console.error('コメント削除エラー:', err);
                return res.status(500).json({ error: 'コメントの削除に失敗しました' });
            }
            res.json({ message: 'コメントを削除しました' });
        });
    });
};
