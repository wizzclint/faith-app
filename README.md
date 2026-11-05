# FAITH RUN

Android endless runner with local progression, Solana wallet sign-in,
leaderboards, head-to-head matches, tournaments and rewards.
The current backend and wallet network use **devnet test SOL**.

## Develop and check

```sh
npm ci
npm start
npm run typecheck
npm test
```

Use an Expo development build, not Expo Go, for Mobile Wallet Adapter.
Wallet flow tests use Node's Ed25519 implementation and need no backend checkout.

## Install on an Android phone

```sh
npm run build:preview -- --non-interactive
```

The preview profile builds a signed, standalone APK with an incremented
Android version code. Open the Expo build's install link on the phone and
allow installation from your browser. Metro is not required.
For a store bundle, use `npm run build:production` after release checks.

## Music

An original 31-second electronic loop plays during active runs. Settings
has independent Music and Sound Effects switches. Pausing, opening Settings,
leaving the game, or backgrounding the app stops the music; backgrounding
also pauses gameplay. Music is bundled and needs no network access.

To reproduce the track, install ffmpeg and run:

```sh
python scripts/compose-music.py
```

See `assets/audio/ATTRIBUTION.md` for audio sources.

## Phone smoke test

1. Launch offline, start a free run, check swipes, effects and music.
2. Pause and resume; disable Music in Settings while leaving effects on.
3. Switch apps during a run: it should pause and audio should stop.
4. Connect Phantom or Solflare, approve the free sign-in message, and check
   leaderboard submission without a separate sync step.
5. Cancel sign-in, retry Finish connecting, then disconnect and reconnect.
6. On devnet, test a free competition, test-SOL entry and reward withdrawal.

The app identity website must publish `/.well-known/assetlinks.json` with
package `com.faitharcade.faithrun` and the APK's signing certificate fingerprint.
Verify terms, privacy and wallet app verification on-device before release.
Real-money play remains a separate release requiring consistent mainnet
configuration, stronger anti-cheat and the server's real-money gate.

## Release network

`EXPO_PUBLIC_SOLANA_CLUSTER` selects devnet, testnet or mainnet-beta for both
wallet authorization and the payment RPC. It defaults to devnet. An optional
`EXPO_PUBLIC_SOLANA_RPC_URL` must use HTTPS and is public in the binary.
Development and preview use devnet. Production and mainnet-preview use
mainnet-beta and require EXPO_PUBLIC_API_URL for the isolated mainnet backend.
A build/server network mismatch blocks payments before opening the wallet.

## Real-SOL test setup

The requested server setting is `ALLOW_REAL_MONEY=true` on mainnet. The pending
server configuration records the supplied treasury and 2% fees. It must be
applied to the isolated mainnet deployment, with a separate database and JWT
secret. Existing devnet settings are not migrated into that database.

Set `EXPO_PUBLIC_API_URL` in the EAS production environment before running
the mainnet profiles. Devnet preview continues using its separate preview
environment:

```sh
eas build --profile mainnet-preview --platform android
```

The config check fails before upload when the mainnet API is missing or points
to the existing devnet server. Payout mode and treasury funding still need to
be finalized. Run an actual entry, settlement, refund and withdrawal test on
mainnet before treating this as a completed real-money test.
