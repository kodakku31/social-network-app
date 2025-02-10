const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// データベースファイルのパスを設定
const dbPath = path.join(__dirname, '..', '..', 'data', 'social_network.db');

// データベース接続を作成
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('SQLiteデータベースへの接続に失敗しました:', err);
    } else {
        console.log('SQLiteデータベースに接続しました');
    }
});

// データベースの初期化
const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        // ユーザーテーブルの作成
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Users table creation failed:', err);
                reject(err);
                return;
            }
            console.log('Users table created successfully');

            // 投稿テーブルの作成
            db.run(`
                CREATE TABLE IF NOT EXISTS posts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `, (err) => {
                if (err) {
                    console.error('Posts table creation failed:', err);
                    reject(err);
                    return;
                }
                console.log('Posts table created successfully');

                // コメントテーブルの作成
                db.run(`
                    CREATE TABLE IF NOT EXISTS comments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        post_id INTEGER NOT NULL,
                        content TEXT NOT NULL,
                        parent_id INTEGER,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id),
                        FOREIGN KEY (post_id) REFERENCES posts (id),
                        FOREIGN KEY (parent_id) REFERENCES comments (id)
                    )
                `, (err) => {
                    if (err) {
                        console.error('Comments table creation failed:', err);
                        reject(err);
                        return;
                    }
                    console.log('Comments table created successfully');

                    // テストユーザーの作成
                    const testUser = {
                        username: 'test',
                        email: 'test@example.com',
                        password: 'password123'
                    };

                    bcrypt.hash(testUser.password, 10, (err, hashedPassword) => {
                        if (err) {
                            console.error('Password hashing failed:', err);
                            reject(err);
                            return;
                        }

                        const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, email, password) VALUES (?, ?, ?)');
                        insertUser.run([testUser.username, testUser.email, hashedPassword], (err) => {
                            if (err) {
                                console.error('Test user creation failed:', err);
                                reject(err);
                                return;
                            }
                            console.log('Test user created successfully');
                            resolve();
                        });
                    });
                });
            });
        });
    });
};

module.exports = {
    db,
    initializeDatabase
};
