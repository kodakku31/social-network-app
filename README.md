# Social Network Application

ReactとNode.jsを使用したソーシャルネットワーキングアプリケーションのプロトタイプです。

## 機能

- ユーザー認証（JWT）
- 投稿機能（テキスト・画像）
- いいね・コメント機能
- フレンド機能
- リアルタイムチャット

## 技術スタック

### フロントエンド
- React
- TypeScript
- Material-UI
- Socket.IO Client

### バックエンド
- Node.js
- Express
- MongoDB
- Socket.IO
- JWT認証

## 開発環境のセットアップ

### 必要条件
- Node.js (v14以上)
- MongoDB
- npm または yarn

### インストール手順

1. リポジトリのクローン
```bash
git clone [リポジトリURL]
cd social-network-app
```

2. バックエンドのセットアップ
```bash
cd backend
npm install
cp .env.example .env  # 環境変数の設定
```

3. フロントエンドのセットアップ
```bash
cd frontend
npm install
```

4. MongoDBの起動
```bash
# MongoDBが実行されていることを確認してください
```

5. アプリケーションの起動

バックエンド:
```bash
cd backend
npm start
```

フロントエンド:
```bash
cd frontend
npm start
```

ブラウザで http://localhost:3000 にアクセスしてアプリケーションを使用できます。

## 環境変数の設定

バックエンドの `.env` ファイルに以下の変数を設定してください：

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/social-network
JWT_SECRET=your_jwt_secret_key_here
```

## 開発ガイドライン

- コミットメッセージは具体的で分かりやすい内容にしてください
- 新機能の追加はfeatureブランチで行ってください
- プルリクエストを作成する前にコードレビューを行ってください

## ライセンス

MIT
