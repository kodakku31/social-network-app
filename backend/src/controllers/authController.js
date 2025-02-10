const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = 'your-secret-key';

// ユーザー登録
exports.register = (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'すべての項目を入力してください' });
    }

    // パスワードのハッシュ化
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('パスワードハッシュ化エラー:', err);
            return res.status(500).json({ error: 'サーバーエラーが発生しました' });
        }

        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.run(query, [username, email, hashedPassword], function(err) {
            if (err) {
                console.error('ユーザー登録エラー:', err);
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'ユーザー名またはメールアドレスが既に使用されています' });
                }
                return res.status(500).json({ error: 'サーバーエラーが発生しました' });
            }

            // JWTトークンの生成
            const token = jwt.sign(
                { userId: this.lastID },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'ユーザーが登録されました',
                token,
                user: {
                    id: this.lastID,
                    username,
                    email
                }
            });
        });
    });
};

// ログイン
exports.login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'メールアドレスとパスワードを入力してください' });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    db.get(query, [email], (err, user) => {
        if (err) {
            console.error('ログインエラー:', err);
            return res.status(500).json({ error: 'サーバーエラーが発生しました' });
        }

        if (!user) {
            return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
        }

        // パスワードの検証
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('パスワード検証エラー:', err);
                return res.status(500).json({ error: 'サーバーエラーが発生しました' });
            }

            if (!isMatch) {
                return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
            }

            // JWTトークンの生成
            const token = jwt.sign(
                { userId: user.id },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'ログインしました',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            });
        });
    });
};

// プロフィール取得
exports.getProfile = (req, res) => {
    const userId = req.user.id;

    const query = 'SELECT id, username, email, created_at FROM users WHERE id = ?';
    db.get(query, [userId], (err, user) => {
        if (err) {
            console.error('プロフィール取得エラー:', err);
            return res.status(500).json({ error: 'サーバーエラーが発生しました' });
        }

        if (!user) {
            return res.status(404).json({ error: 'ユーザーが見つかりません' });
        }

        res.json(user);
    });
};
