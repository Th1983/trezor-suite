import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const port = 3005;

// todo: maybe share with suite?
const GOOGLE_CLIENT_ID_DESKTOP =
    '721022212539-0o49kanusndsufaeh1nut13pp23hb1t8.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET =
    process.env.GOOGLE_CLIENT_SECRET || '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'; // TODO: remove temporary fallback

/**
 * Is server alive?
 */
app.get('/status', (_req, res) => {
    res.send({ status: 'ok' });
});

/**
 * Exchange authorization code for refresh token and access token.
 */
app.post('/google-oauth-init', async (req, res) => {
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            body: JSON.stringify({
                code: req.body.code,
                client_secret: GOOGLE_CLIENT_SECRET,
                client_id: GOOGLE_CLIENT_ID_DESKTOP,
                redirect_uri: req.body.redirectUri,
                grant_type: 'authorization_code',
                code_verifier: req.body.codeVerifier,
            }),
            method: 'POST',
        });
        const json = await response.json();
        res.status(response.status).send(json);
    } catch (error) {
        res.status(401).json(`Authorization failed: ${error}`);
    }
});

/**
 * Refresh access token.
 */
app.post('/google-oauth-refresh', async (req, res) => {
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            body: JSON.stringify({
                refresh_token: req.body.refreshToken,
                grant_type: 'refresh_token',
                client_secret: GOOGLE_CLIENT_SECRET,
                client_id: GOOGLE_CLIENT_ID_DESKTOP,
            }),
            method: 'POST',
        });
        const json = await response.json();
        res.status(response.status).send(json);
    } catch (error) {
        res.status(401).json(`Refresh failed: ${error}`);
    }
});

app.listen(port, () => {
    console.log(`OAuth app listening on port ${port}`);
});
