# Firestore セキュリティルール設定

## 手動設定方法

Firebase Console → Firestore Database → ルール タブで以下のルールを設定してください：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read all locations
    match /locations/{document} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
  }
}
```

## ルールの説明

- **read**: 認証済みユーザーは全ての位置情報を読み取り可能
- **create**: 認証済みユーザーは自分のIDを含む位置情報のみ作成可能
- **update/delete**: 認証済みユーザーは自分が作成した位置情報のみ更新・削除可能

## 設定手順

1. Firebase Console を開く: https://console.firebase.google.com/project/libefes-location/firestore
2. Firestore Database → ルール タブをクリック
3. 上記のルールをコピー＆ペースト
4. 「公開」ボタンをクリック