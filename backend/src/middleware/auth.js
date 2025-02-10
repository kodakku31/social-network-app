const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

module.exports = (req, res, next) => {
    try {
        console.log('Auth Middleware - Headers:', req.headers);
        
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.log('No Authorization header found');
            return res.status(401).json({ error: '認証が必要です' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            console.log('No token found in Authorization header');
            return res.status(401).json({ error: '認証トークンが必要です' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Decoded token:', decoded);

        // ユーザーの存在確認
        db.get('SELECT id, username, email FROM users WHERE id = ?', [decoded.userId], (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'サーバーエラーが発生しました' });
            }
            if (!user) {
                console.log('User not found:', decoded.userId);
                return res.status(401).json({ error: 'ユーザーが見つかりません' });
            }
            
            req.user = user;
            console.log('User authenticated:', user);
            next();
        });
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: '無効なトークンです' });
    }
};
