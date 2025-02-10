const db = require('../config/database');

// 投稿の作成
exports.createPost = (req, res) => {
    console.log('Create Post Request:', {
        body: req.body,
        user: req.user,
        headers: req.headers
    });

    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
        return res.status(400).json({ error: '投稿内容は必須です' });
    }

    console.log('Creating post with:', { userId, content });

    const query = 'INSERT INTO posts (user_id, content) VALUES (?, ?)';
    db.run(query, [userId, content], function(err) {
        if (err) {
            console.error('投稿作成エラー:', err);
            return res.status(500).json({ error: '投稿の作成に失敗しました' });
        }
        res.status(201).json({
            id: this.lastID,
            content,
            userId,
            createdAt: new Date().toISOString()
        });
    });
};

// 全投稿の取得
exports.getAllPosts = (req, res) => {
    console.log('Get All Posts Request');
    const query = `
        SELECT 
            p.id, p.content, p.created_at as createdAt,
            u.username, u.id as userId
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 50
    `;
    
    db.all(query, [], (err, posts) => {
        if (err) {
            console.error('投稿取得エラー:', err);
            return res.status(500).json({ error: '投稿の取得に失敗しました' });
        }
        res.json(posts);
    });
};

// 特定の投稿の取得
exports.getPost = (req, res) => {
    const postId = req.params.id;
    console.log('Get Post Request:', { postId });
    const query = `
        SELECT 
            p.id, p.content, p.created_at as createdAt,
            u.username, u.id as userId
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
    `;

    db.get(query, [postId], (err, post) => {
        if (err) {
            console.error('投稿取得エラー:', err);
            return res.status(500).json({ error: '投稿の取得に失敗しました' });
        }
        if (!post) {
            return res.status(404).json({ error: '投稿が見つかりません' });
        }
        res.json(post);
    });
};

// 投稿の更新
exports.updatePost = (req, res) => {
    const postId = req.params.id;
    const { content } = req.body;
    const userId = req.user.id;

    console.log('Update Post Request:', { postId, content, userId });

    if (!content) {
        return res.status(400).json({ error: '投稿内容は必須です' });
    }

    // 投稿の所有者を確認
    db.get('SELECT user_id FROM posts WHERE id = ?', [postId], (err, post) => {
        if (err) {
            console.error('投稿確認エラー:', err);
            return res.status(500).json({ error: '投稿の確認に失敗しました' });
        }
        if (!post) {
            return res.status(404).json({ error: '投稿が見つかりません' });
        }
        if (post.user_id !== userId) {
            return res.status(403).json({ error: '他のユーザーの投稿は編集できません' });
        }

        // 投稿を更新
        const updateQuery = 'UPDATE posts SET content = ? WHERE id = ?';
        db.run(updateQuery, [content, postId], (err) => {
            if (err) {
                console.error('投稿更新エラー:', err);
                return res.status(500).json({ error: '投稿の更新に失敗しました' });
            }
            res.json({ id: postId, content, updatedAt: new Date().toISOString() });
        });
    });
};

// 投稿の削除
exports.deletePost = (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;

    console.log('Delete Post Request:', { postId, userId });

    // 投稿の所有者を確認
    db.get('SELECT user_id FROM posts WHERE id = ?', [postId], (err, post) => {
        if (err) {
            console.error('投稿確認エラー:', err);
            return res.status(500).json({ error: '投稿の確認に失敗しました' });
        }
        if (!post) {
            return res.status(404).json({ error: '投稿が見つかりません' });
        }
        if (post.user_id !== userId) {
            return res.status(403).json({ error: '他のユーザーの投稿は削除できません' });
        }

        // 投稿を削除
        const deleteQuery = 'DELETE FROM posts WHERE id = ?';
        db.run(deleteQuery, [postId], (err) => {
            if (err) {
                console.error('投稿削除エラー:', err);
                return res.status(500).json({ error: '投稿の削除に失敗しました' });
            }
            res.json({ message: '投稿を削除しました' });
        });
    });
};
