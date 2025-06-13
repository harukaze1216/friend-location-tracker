# リベ大フェス 友達位置トラッカー

友達がリベ大フェスでどこにいるかを地図上で共有するアプリです。

## 機能
- PDF地図のアップロードと表示
- 地図上のクリックで友達の位置を登録
- 時間別での位置情報フィルタリング
- Firestoreを使用したリアルタイムデータ共有

## セットアップ

### 1. Firebase設定
1. Firebase Consoleでプロジェクトを作成
2. Firestoreを有効化
3. Web アプリを追加して設定情報を取得

### 2. 環境変数設定
`.env`ファイルを作成し、Firebase設定を追加：

```bash
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 3. GitHub Pages設定
1. GitHubリポジトリを作成
2. `package.json`の`homepage`を更新
3. GitHub Secretsに環境変数を設定
4. GitHub Pagesを有効化

### 4. ローカル開発
```bash
npm install
npm start
```

## 使い方
1. PDF地図ファイルをアップロード
2. 地図上をクリックして位置を指定
3. 友達の名前と時間を入力して登録
4. 時間フィルターで特定の時間の位置のみ表示

## 技術スタック
- React + TypeScript
- Firebase/Firestore
- react-pdf
- Tailwind CSS
- GitHub Pages