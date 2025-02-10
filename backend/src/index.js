const express = require('express');
const cors = require('cors');
const authController = require('./controllers/authController');
const postController = require('./controllers/postController');
const auth = require('./middleware/auth');
const { createTables } = require('./config/schema');

const app = express();
const PORT = process.env.PORT || 3001;

// データベーステーブルの作成
createTables();

// ミドルウェア
app.use(cors());
app.use(express.json());

// ルート情報を表示
app.get('/', (req, res) => {
    res.json({
        message: 'Social Network API',
        version: '1.0.0',
        endpoints: {
            auth: {
                register: {
                    method: 'POST',
                    path: '/api/auth/register',
                    description: 'ユーザー登録'
                },
                login: {
                    method: 'POST',
                    path: '/api/auth/login',
                    description: 'ログイン'
                },
                profile: {
                    method: 'GET',
                    path: '/api/auth/profile',
                    description: 'プロフィール取得（要認証）'
                }
            },
            posts: {
                create: {
                    method: 'POST',
                    path: '/api/posts',
                    description: '新規投稿の作成（要認証）'
                },
                getAll: {
                    method: 'GET',
                    path: '/api/posts',
                    description: '全投稿の取得'
                },
                getOne: {
                    method: 'GET',
                    path: '/api/posts/:id',
                    description: '特定の投稿の取得'
                },
                update: {
                    method: 'PUT',
                    path: '/api/posts/:id',
                    description: '投稿の更新（要認証）'
                },
                delete: {
                    method: 'DELETE',
                    path: '/api/posts/:id',
                    description: '投稿の削除（要認証）'
                }
            }
        }
    });
});

// 認証ルート
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/profile', auth, authController.getProfile);

// 投稿ルート
app.post('/api/posts', auth, postController.createPost);
app.get('/api/posts', postController.getAllPosts);
app.get('/api/posts/:id', postController.getPost);
app.put('/api/posts/:id', auth, postController.updatePost);
app.delete('/api/posts/:id', auth, postController.deletePost);

// サーバー起動
app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});
