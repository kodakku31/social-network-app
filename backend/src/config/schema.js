const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// データベースファイルのパス
const dbPath = path.resolve(__dirname, '../../data/social_network.db');

// データベース接続
const db = new sqlite3.Database(dbPath);

// テーブルの初期化
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            try {
                // ユーザーテーブル
                db.run(`CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    profile_image TEXT,
                    bio TEXT,
                    location TEXT,
                    website TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);
                console.log('Users table created successfully');

                // 投稿テーブル
                db.run(`CREATE TABLE IF NOT EXISTS posts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    image_url TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )`);
                console.log('Posts table created successfully');

                // フォロー関係テーブル
                db.run(`CREATE TABLE IF NOT EXISTS follows (
                    follower_id INTEGER NOT NULL,
                    following_id INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (follower_id, following_id),
                    FOREIGN KEY (follower_id) REFERENCES users (id),
                    FOREIGN KEY (following_id) REFERENCES users (id)
                )`);
                console.log('Follows table created successfully');

                // コメントテーブル
                db.run(`CREATE TABLE IF NOT EXISTS comments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    post_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    parent_id INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (post_id) REFERENCES posts (id),
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (parent_id) REFERENCES comments (id)
                )`);
                console.log('Comments table created successfully');

                // いいねテーブル
                db.run(`CREATE TABLE IF NOT EXISTS likes (
                    post_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (post_id, user_id),
                    FOREIGN KEY (post_id) REFERENCES posts (id),
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )`);
                console.log('Likes table created successfully');

                // テストユーザーの作成
                const testUser = {
                    username: 'test',
                    email: 'test@example.com',
                    password: await bcrypt.hash('password123', 10),
                    bio: 'テストユーザーです',
                    location: '東京',
                    website: 'https://example.com'
                };

                db.run(`INSERT OR IGNORE INTO users (username, email, password, bio, location, website)
                       VALUES (?, ?, ?, ?, ?, ?)`,
                    [testUser.username, testUser.email, testUser.password, testUser.bio, testUser.location, testUser.website],
                    function(err) {
                        if (err) {
                            console.error('Error creating test user:', err);
                        } else {
                            console.log('Test user created successfully');
                        }
                    }
                );

                // テストデータの作成
                db.run(`INSERT OR IGNORE INTO users (id, username, email, password) VALUES 
                    (1, 'test', 'test@example.com', '$2b$10$ZKfOhX7fDEUCGwvZgFXEZ.y0y6Y5wEYgGhzHUCFEwCyQxNs5mF0xC'),
                    (2, 'test2', 'test2@example.com', '$2b$10$ZKfOhX7fDEUCGwvZgFXEZ.y0y6Y5wEYgGhzHUCFEwCyQxNs5mF0xC')`);
                db.run(`INSERT OR IGNORE INTO posts (id, user_id, content, image_url) VALUES 
                    (1, 1, 'こんにちは、世界！', 'https://example.com/image1.jpg'),
                    (2, 1, 'テスト投稿です', 'https://example.com/image2.jpg'),
                    (3, 2, '初めての投稿！', 'https://example.com/image3.jpg')`);
                db.run(`INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES 
                    (1, 2),
                    (2, 1)`);
                db.run(`INSERT OR IGNORE INTO comments (post_id, user_id, content) VALUES 
                    (1, 2, 'いい投稿ですね！'),
                    (2, 2, 'すばらしい！'),
                    (3, 1, 'ようこそ！')`);
                db.run(`INSERT OR IGNORE INTO likes (post_id, user_id) VALUES 
                    (1, 2),
                    (2, 2),
                    (3, 1)`);

                resolve();
            } catch (error) {
                console.error('データベース初期化エラー:', error);
                reject(error);
            }
        });
    });
}

module.exports = { db, initializeDatabase };
