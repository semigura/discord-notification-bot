const { Client, GatewayIntentBits } = require("discord.js");
const { google } = require("googleapis");
const dotenv = require("dotenv");

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

let lastKnownVideos = new Set();

client.once("ready", () => {
  console.log("Discord bot is ready!");
  checkPlaylistUpdates();
  setInterval(checkPlaylistUpdates, 5 * 60 * 1000); // Check every 5 minutes
});

async function checkPlaylistUpdates() {
  try {
    const response = await youtube.playlistItems.list({
      part: "snippet",
      playlistId: process.env.YOUTUBE_PLAYLIST_ID,
      maxResults: 50,
      order: "date"
    });

    const currentVideos = new Set(
      response.data.items.map((item) => item.snippet.resourceId.videoId)
    );
    const newVideos = [...currentVideos].filter(
      (videoId) => !lastKnownVideos.has(videoId)
    );

    for (const videoId of newVideos) {
      const videoDetails = response.data.items.find(
        (item) => item.snippet.resourceId.videoId === videoId
      );
      const title = videoDetails.snippet.title;
      const channelTitle = videoDetails.snippet.videoOwnerChannelTitle;
      const url = `https://www.youtube.com/watch?v=${videoId}`;

      const message = `新しい動画が追加されたよ！\n動画名: **${title}**\nチャンネル名: **${channelTitle}\n${url}`;
      const channel = await client.channels.fetch(process.env.DISCORD_YOUTUBE_CHANNEL_ID);
      await channel.send(message);
    }

    lastKnownVideos = currentVideos;
  } catch (error) {
    console.error("Error checking playlist updates:", error);
  }
}

client.login(process.env.DISCORD_BOT_TOKEN);
