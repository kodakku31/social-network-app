const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/schema');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');

const app = express();

// ミドルウェアの設定
app.use(cors());
app.use(express.json());

// ルートの設定
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);

// データベースの初期化
initializeDatabase()
    .then(() => {
        console.log('データベースが正常に初期化されました');
        
        // サーバーの起動
        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => {
            console.log(`サーバーが起動しました: http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('データベースの初期化に失敗しました:', err);
        process.exit(1);
    });
