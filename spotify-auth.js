const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

const app = express();

app.get('/login', (req, res) => {
  const scopes = ['playlist-read-private', 'playlist-read-collaborative'];
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
  res.redirect(authorizeURL);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;
    console.log('Access Token:', access_token);
    console.log('Refresh Token:', refresh_token);
    res.send('認証成功！コンソールに表示されたリフレッシュトークンをメモしてください。');
  } catch (err) {
    console.error('認証エラー:', err);
    res.send('認証エラーが発生しました。');
  }
});

const PORT = 8888;
app.listen(PORT, () => {
  console.log(`サーバーが http://localhost:${PORT} で起動しました。`);
  console.log(`http://localhost:${PORT}/login にアクセスして認証を開始してください。`);
});
