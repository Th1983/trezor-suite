import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const port = 3005;

// todo: maybe share with suite?
const GOOGLE_CLIENT_ID_DESKTOP =
    '721022212539-0o49kanusndsufaeh1nut13pp23hb1t8.apps.googleusercontent.com';

// todo: create some config file. or maybe set of config files where one would load on localhost for
// dev purposes and the other one would load in production and read from process.env.something
const GOOGLE_CLIENT_SECRET_DESKTOP =
    process.env.GOOGLE_CLIENT_SECRET || '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';

/**
 * Is server alive?
 */
app.get('/status', (_req, res) => {
    res.send({ status: 'ok' });
});

app.post('/google-oauth-init', async (req, res) => {
    // todo: better handling of fetch, should have try / catch
    const response = await fetch('https://oauth2.googleapis.com/token', {
        body: JSON.stringify({
            code: req.body.code,
            client_secret: GOOGLE_CLIENT_SECRET_DESKTOP,
            client_id: GOOGLE_CLIENT_ID_DESKTOP,
            redirect_uri: req.body.redirectUri,
            grant_type: 'authorization_code',
            code_verifier: req.body.codeVerifier,
        }),
        method: 'POST',
    });
    const json = await response.json();
    res.send(json);
});

app.post('/google-oauth-refresh', async (req, res) => {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        body: JSON.stringify({
            refresh_token: req.body.refreshToken,
            grant_type: 'refresh_token',
            client_secret: GOOGLE_CLIENT_SECRET_DESKTOP,
            client_id: GOOGLE_CLIENT_ID_DESKTOP,
        }),
        method: 'POST',
    });
    const json = await response.json();
    res.send(json);
});

app.listen(port, () => {
    console.log(`OAuth app listening on port ${port}`);
});
