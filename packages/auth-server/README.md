# @trezor/auth-server

Authorization endpoints for saving labels in Google Drive via OAuth 2.0.

Google requires `client_secret` to grant long term access with a `refresh_token`. This is a [recommended](https://developers.google.com/identity/protocols/oauth2/native-app) OAuth flow for desktop apps. Google authentication server is therefore accessed via our backend which stores the `client_secret`.

## Development

1. Generate your own testing credentials for a Desktop app in [Google Cloud Platform](https://console.cloud.google.com/apis/credentials).
1. In Google Cloud Platform, add your account as a test user.
1. Replace `GOOGLE_CLIENT_ID_DESKTOP` and `GOOGLE_CLIENT_SECRET` in this project with your credentials.
1. Set `AUTH_SERVER_URL` in `@trezor/suite` to `http://localhost:3005`.
1. Install dependencies via `yarn workspace @trezor/auth-server install`.
1. Run the server locally via `yarn workspace @trezor/auth-server dev`.
1. Run desktop Suite.
1. Edit labels in the app.
