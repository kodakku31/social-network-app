const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// データベースディレクトリのパス
const dbDir = path.resolve(__dirname, '../../data');
// データベースファイルのパス
const dbPath = path.join(dbDir, 'social_network.db');

// データベースディレクトリが存在しない場合は作成
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// データベース接続
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('データベース接続エラー:', err);
        throw err; // エラーを投げて、アプリケーションを停止
    } else {
        console.log('SQLiteデータベースに接続しました');
    }
});

// エラーハンドリングの改善
db.on('error', (err) => {
    console.error('データベースエラー:', err);
});

module.exports = db;
