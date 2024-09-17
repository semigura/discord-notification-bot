const { Client, GatewayIntentBits } = require("discord.js");
const SpotifyWebApi = require("spotify-web-api-node");
const dotenv = require("dotenv");

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
});

const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID;
const CHECK_INTERVAL = 60000; // 1分ごとにチェック

// トラックを記録するための連想配列
let tracksRecord = {};

client.once("ready", () => {
  console.log("Discord bot is ready!");
  checkPlaylistChanges();
});

function createTrackMessage(track) {
  const trackName = track.track.name;
  const artistName = track.track.artists[0].name;
  const addedBy = track.added_by.id;
  const trackUrl = track.track.external_urls.spotify;

  return `新しい曲が追加されたよ！\n曲名: **[${trackName}](${trackUrl})**\nアーティスト: **${artistName}**\n追加したユーザー: **${addedBy}**`;
}

async function checkPlaylistChanges() {
  try {
    await refreshAccessToken();
    const playlist = await spotifyApi.getPlaylist(PLAYLIST_ID);
    const tracks = playlist.body.tracks.items;

    const newTracks = [];

    for (const track of tracks) {
      const trackId = track.track.id;
      if (!tracksRecord[trackId]) {
        newTracks.push(track);
        tracksRecord[trackId] = {
          name: track.track.name,
          artist: track.track.artists[0].name,
          addedBy: track.added_by.id,
          addedAt: track.added_at,
        };
      }
    }

    if (newTracks.length > 0) {
      for (const track of newTracks) {
        const message = createTrackMessage(track);
        await sendDiscordMessage(message);
      }
    } else {
      console.log("No new tracks found.");
    }
    console.log(tracksRecord);
  } catch (error) {
    console.error("Error checking playlist changes:", error);
  }

  setTimeout(checkPlaylistChanges, CHECK_INTERVAL);
}

async function refreshAccessToken() {
  try {
    const data = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(data.body["access_token"]);
    console.log("Access token has been refreshed");
  } catch (error) {
    console.error("Error refreshing access token:", error);
  }
}

async function sendDiscordMessage(message) {
  const channel = client.channels.cache.get(process.env.DISCORD_SPOTIFY_CHANNEL_ID);
  if (channel) {
    await channel.send(message);
  } else {
    console.error("Discord channel not found");
  }
}

client.login(process.env.DISCORD_BOT_TOKEN);
