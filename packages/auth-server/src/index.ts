import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3005;
const GOOGLE_CLIENT_SECRET =
    process.env.GOOGLE_CLIENT_SECRET || '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'; // TODO: remove temporary fallback

const checkResponse = (responseBody: object, expectedProperties: string[]) => {
    expectedProperties.forEach(property => {
        if (!Object.prototype.hasOwnProperty.call(responseBody, property)) {
            throw new Error('Unexpected response from authentiacation server.');
        }
    });
};

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
                client_id: req.body.clientId,
                redirect_uri: req.body.redirectUri,
                grant_type: 'authorization_code',
                code_verifier: req.body.codeVerifier,
            }),
            method: 'POST',
        });
        console.log('response', response);
        const json = await response.json();
        checkResponse(json, ['refresh_token', 'access_token', 'expires_in']);
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
                client_id: req.body.clientId,
            }),
            method: 'POST',
        });
        console.log('response refresh', response);

        const json = await response.json();
        checkResponse(json, ['access_token', 'expires_in']);
        res.status(response.status).send(json);
    } catch (error) {
        res.status(401).json(`Refresh failed: ${error}`);
    }
});

app.listen(PORT, () => {
    console.log(`OAuth app listening on port ${PORT}`);
});
