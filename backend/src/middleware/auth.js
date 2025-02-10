const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = 'your-secret-key';

const auth = async (req, res, next) => {
    try {
        // トークンの取得
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('No token provided or invalid format'); // デバッグログ
            return res.status(401).json({ error: '認証が必要です' });
        }

        const token = authHeader.split(' ')[1];
        console.log('Verifying token:', token.substring(0, 20) + '...'); // デバッグログ（セキュリティのため一部のみ表示）

        // トークンの検証
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Decoded token:', decoded); // デバッグログ

        // ユーザーの取得
        const user = await new Promise((resolve, reject) => {
            const query = 'SELECT id, username, email FROM users WHERE id = ?';
            db.get(query, [decoded.userId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!user) {
            console.log('User not found for token:', decoded.userId); // デバッグログ
            return res.status(401).json({ error: 'ユーザーが見つかりません' });
        }

        console.log('Authentication successful for user:', user.username); // デバッグログ
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error); // デバッグログ
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: '無効なトークンです' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'トークンの有効期限が切れています' });
        }
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};

module.exports = auth;
