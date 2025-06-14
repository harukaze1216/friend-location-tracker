# Firestore Composite Index Setup

## Required Index

The app requires a composite index for the `userLocations` collection to support queries that filter by `isActive` and order by `timestamp`.

### Manual Setup via Firebase Console

1. Go to Firebase Console: https://console.firebase.google.com/project/libefes-location/firestore/indexes
2. Click "Create Index"
3. Set the following configuration:

**Collection ID:** `userLocations`

**Fields:**
- Field: `isActive`, Order: `Ascending`  
- Field: `timestamp`, Order: `Descending`

**Query scope:** `Collection`

4. Click "Create"

### Alternative: Use Firebase CLI

Run this command to create the index:

```bash
firebase firestore:indexes
```

Or add to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "userLocations",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "isActive",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp", 
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

Then deploy with:
```bash
firebase deploy --only firestore:indexes
```

## Error Message Reference

The error you see when this index is missing:
```
The query requires an index. You can create it here: https://console.firebase.google.com/project/libefes-location/firestore/indexes?create_composite=...
```

## Query That Requires This Index

The query in `userService.ts:getActiveUserLocations()`:
```typescript
query(
  collection(db, 'userLocations'), 
  where('isActive', '==', true),
  orderBy('timestamp', 'desc')
)
```

This query filters by `isActive = true` and orders by `timestamp` descending, which requires a composite index.