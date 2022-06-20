const express = require('express');
const fetch = require('node-fetch');
const { OAuth2Client } = require('google-auth-library');

const app = express();

// parse application/json
app.use(express.json());

const port = 3005;

const GOOGLE_CLIENT_ID_DESKTOP =
    '721022212539-0o49kanusndsufaeh1nut13pp23hb1t8.apps.googleusercontent.com';

app.post('/google-oauth', async (req, res) => {
    console.log(req.body);

    const response = await fetch('https://oauth2.googleapis.com/token', {
        body: JSON.stringify({
            code: req.body.code,
            client_secret: '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',
            client_id: GOOGLE_CLIENT_ID_DESKTOP,
            redirect_uri: req.body.redirectUri,
            grant_type: 'authorization_code',
            code_verifier: req.body.codeVerifier,
        }),
        method: 'POST',
    });

    const json = await response.json();
    console.log('json', json);
    res.send(json);
});

//
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
