const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ユーザー登録
exports.register = (req, res) => {
    const { username, email, password } = req.body;

    // パスワードのハッシュ化
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ error: 'パスワードのハッシュ化に失敗しました' });
        }

        // ユーザーの作成
        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.run(query, [username, email, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'ユーザー名またはメールアドレスが既に使用されています' });
                }
                return res.status(500).json({ error: 'ユーザー登録に失敗しました' });
            }

            // JWTトークンの生成
            const token = jwt.sign({ userId: this.lastID }, JWT_SECRET, { expiresIn: '24h' });
            res.status(201).json({ token });
        });
    });
};

// ログイン
exports.login = (req, res) => {
    const { email, password } = req.body;

    // ユーザーの検索
    const query = 'SELECT * FROM users WHERE email = ?';
    db.get(query, [email], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'ログイン処理に失敗しました' });
        }
        if (!user) {
            return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
        }

        // パスワードの検証
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: 'パスワードの検証に失敗しました' });
            }
            if (!isMatch) {
                return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
            }

            // JWTトークンの生成
            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ token });
        });
    });
};

// ユーザー情報の取得
exports.getProfile = (req, res) => {
    const userId = req.user.userId;

    const query = 'SELECT id, username, email, profile_image, bio, created_at FROM users WHERE id = ?';
    db.get(query, [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'ユーザー情報の取得に失敗しました' });
        }
        if (!user) {
            return res.status(404).json({ error: 'ユーザーが見つかりません' });
        }
        res.json(user);
    });
};
