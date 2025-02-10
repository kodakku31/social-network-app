const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = 'your-secret-key';

// ユーザー登録
exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    console.log('Registration attempt:', { username, email }); // デバッグログ

    if (!username || !email || !password) {
        console.log('Missing required fields'); // デバッグログ
        return res.status(400).json({ error: 'すべての項目を入力してください' });
    }

    try {
        // メールアドレスとユーザー名の重複チェック
        const checkQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';
        const existingUser = await new Promise((resolve, reject) => {
            db.get(checkQuery, [email, username], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (existingUser) {
            console.log('User already exists:', existingUser); // デバッグログ
            return res.status(400).json({ 
                error: existingUser.email === email 
                    ? 'このメールアドレスは既に使用されています' 
                    : 'このユーザー名は既に使用されています'
            });
        }

        // パスワードのハッシュ化
        const hashedPassword = await bcrypt.hash(password, 10);

        // ユーザーの作成
        const insertQuery = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        const result = await new Promise((resolve, reject) => {
            db.run(insertQuery, [username, email, hashedPassword], function(err) {
                if (err) reject(err);
                resolve(this);
            });
        });

        // JWTトークンの生成
        const token = jwt.sign(
            { userId: result.lastID },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 作成したユーザー情報の取得
        const userQuery = 'SELECT id, username, email FROM users WHERE id = ?';
        const user = await new Promise((resolve, reject) => {
            db.get(userQuery, [result.lastID], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        console.log('User registered successfully:', user); // デバッグログ
        res.status(201).json({
            message: 'ユーザーが登録されました',
            token,
            user
        });
    } catch (error) {
        console.error('Registration error:', error); // デバッグログ
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};

// ログイン
exports.login = async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', { email }); // デバッグログ

    if (!email || !password) {
        console.log('Missing credentials'); // デバッグログ
        return res.status(400).json({ error: 'メールアドレスとパスワードを入力してください' });
    }

    try {
        // ユーザーの検索
        const query = 'SELECT * FROM users WHERE email = ?';
        const user = await new Promise((resolve, reject) => {
            db.get(query, [email], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!user) {
            console.log('User not found:', email); // デバッグログ
            return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
        }

        // パスワードの検証
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Invalid password for user:', email); // デバッグログ
            return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
        }

        // JWTトークンの生成
        const token = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // パスワードを除外したユーザー情報を返す
        const { password: _, ...userWithoutPassword } = user;

        console.log('User logged in successfully:', email); // デバッグログ
        res.json({
            message: 'ログインしました',
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error); // デバッグログ
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};

// プロフィール取得
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Profile request for user:', userId); // デバッグログ

        const query = 'SELECT id, username, email FROM users WHERE id = ?';
        const user = await new Promise((resolve, reject) => {
            db.get(query, [userId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!user) {
            console.log('User not found:', userId); // デバッグログ
            return res.status(404).json({ error: 'ユーザーが見つかりません' });
        }

        console.log('Profile retrieved successfully:', user); // デバッグログ
        res.json(user);
    } catch (error) {
        console.error('Profile retrieval error:', error); // デバッグログ
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
