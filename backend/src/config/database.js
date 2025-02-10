const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// データベースファイルのパス
const dbPath = path.resolve(__dirname, '../../data/social_network.db');

// データベース接続
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('データベース接続エラー:', err);
    } else {
        console.log('SQLiteデータベースに接続しました');
    }
});

module.exports = db;
