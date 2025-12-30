const express = require('express');
const ytdl = require('@distube/ytdl-core');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/', (req, res) => {
    res.json({ status: 'Online', message: 'YouTube Downloader API is Ready 🚀' });
});

app.get('/api/download', async (req, res) => {
    try {
        const videoURL = req.query.url;
        const type = req.query.type || 'mp4';

        if (!ytdl.validateURL(videoURL)) {
            return res.status(400).json({ error: 'Link YouTube tidak valid!' });
        }

        const info = await ytdl.getInfo(videoURL);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');

        if (type === 'mp3') {
            res.header('Content-Disposition', `attachment; filename="${title}.mp3"`);
            ytdl(videoURL, {
                filter: 'audioonly',
                quality: 'highestaudio'
            }).pipe(res);
        } else {
            res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
            ytdl(videoURL, {
                filter: 'audioandvideo',
                quality: 'lowest'
            }).pipe(res);
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal memproses video. Mungkin dibatasi oleh YouTube.' });
    }
});

module.exports = app;
