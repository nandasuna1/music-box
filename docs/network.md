# Network and data layer

The app has no custom backend or app-owned HTTP API. It talks to:

1. **Deezer's public HTTP API** for album catalog data.
2. **Firebase client SDKs** for Google-backed authentication and Cloud
   Firestore user data.

Firestore service functions in this document are client SDK operations, not
HTTP endpoints exposed by this repository.

## Deezer API

`services/deezer.ts` creates an Axios client with base URL
`https://api.deezer.com`. No Deezer API key or proxy server is configured.

| Service                                | Request                                            | Behavior                                                                           |
| -------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `getTopAlbums(limit = 20, offset = 0)` | `GET /chart/0/albums?limit={limit}&index={offset}` | Returns the chart's album list. The home screen requests pages of 20.              |
| `searchAlbums(query)`                  | `GET /search/album?q={query}`                      | Returns matching albums. The home screen enables search at two or more characters. |
| `getAlbumById(albumId)`                | `GET /album/{albumId}`                             | Returns album details and tracks; formats release date as `MM/YYYY`.               |

Catalog types are declared next to their services in `services/album/`. The
Deezer numeric album ID is used as the album identifier in Firestore records.

## Firebase client services

Firebase app, Auth, and Firestore initialization is centralized in
`services/firebase.ts`. The service modules wrap SDK reads and writes:

| Function                                | Operation                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `getUserProfile(userId)`                | Reads `users/{userId}` and maps profile fields.                                                                |
| `getUserAlbumReview(albumId)`           | Finds the signed-in user's review for an album; returns `null` if signed out or no review exists.              |
| `getUserReviews()`                      | Reads the signed-in user's review references, then loads their top-level review documents.                     |
| `getUserRecentReviews(userId, max = 3)` | Reads up to `max` documents from `reviews` for the specified user.                                             |
| `getUserSaveForLater(userId, max = 3)`  | Reads the user's saved-album documents, sorts them by `savedAt` descending in memory, and returns up to `max`. |
| `upsertReview(review)`                  | Creates/updates a review and its per-user reference in a transaction.                                          |
| `upsertSaveForLater(album)`             | Creates/updates a saved album and its per-user reference in a transaction.                                     |
| `getIsFavoriteAlbum(albumId)`           | Checks for a matching `saveForLater` record for the signed-in user.                                            |
| `upsertUser(user)`                      | Creates `users/{uid}` on first Google sign-in; existing profiles are not changed.                              |

### Firestore document model

| Collection/document                        | Stored data and purpose                                                                                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `users/{uid}`                              | UID, name, email, photo URL, provider, creation timestamp. `reviewsCount` and `listenLaterCount` are incremented on first create and default to zero in profile mapping when absent. |
| `reviews/{uid}_{albumId}`                  | One review per user/album pair: user ID, album ID, album display data, rating, optional comment, and server timestamp.                                                               |
| `users/{uid}/reviews/{uid}_{albumId}`      | Per-user reference to the top-level review.                                                                                                                                          |
| `saveForLater/{uid}_{albumId}`             | One saved album per user/album pair: user ID, album ID, display data, and server timestamp.                                                                                          |
| `users/{uid}/saveForLater/{uid}_{albumId}` | Per-user reference to the top-level saved-album record.                                                                                                                              |

Review and saved-album document IDs are deterministic (`{uid}_{albumId}`), so
repeated writes update the same record. Transactions update the top-level
record and per-user reference together and increment the user's matching
counter only when the top-level document is new. Reviews have a 1-to-5 rating
and an optional comment.

### Query and mutation behavior

- Album chart pages use `limit` and Deezer's `index` offset. Search results are
  not paginated by the current screen.
- `getUserAlbumReview` filters by user and album, orders by `ratedAt`
  descending, and limits the result to one.
- `getUserRecentReviews` filters by user and applies a limit, but does not
  order by its timestamp. Results are therefore not guaranteed to be the
  newest records.
- `getUserSaveForLater` filters by user, sorts the returned documents by
  `savedAt` descending in memory, and then applies its limit. This avoids
  requiring a compound Firestore index for the user filter plus timestamp
  ordering, at the cost of reading all saved-album documents for that user.
- Other compound Firestore queries may require indexes. Create indexes
  requested by Firebase for the queries in `services/`.
- The repository does not include Firestore Security Rules or index
  definitions. Firebase project setup and authorization rules are external;
  see [Security and configuration](security.md).

## Data types and formatting

`types/Album.ts` defines the app's review and saved-album shapes. Ratings
include album metadata, a 1–5 rating, optional comment, and ISO timestamp.
Saved-album results contain album metadata and a saved timestamp.

`utils/dataFormatter.ts` formats track lengths as minutes/seconds and album
release dates as month/year. Deezer detail records are formatted before they
reach the album detail screen.
