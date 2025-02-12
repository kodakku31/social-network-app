const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./config/schema');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェアの設定
app.use(cors());
app.use(express.json());

// 静的ファイルの提供
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ルートの設定
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/profile', profileRoutes);

// データベースの初期化
async function startServer() {
    try {
        await initializeDatabase();
        console.log('データベースが正常に初期化されました');

        app.listen(PORT, () => {
            console.log(`サーバーが起動しました: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('サーバー起動エラー:', error);
        process.exit(1);
    }
}

startServer();
