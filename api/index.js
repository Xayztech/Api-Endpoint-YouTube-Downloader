import axios from 'axios';

// --- 1. DAFTAR SERVER INVIDIOUS (ROTASI) ---
const INVIDIOUS_INSTANCES = [
  "https://inv.tux.pizza",
  "https://vid.puffyan.us",
  "https://yewtu.be",
  "https://invidious.kavin.rocks",
  "https://invidious.drgns.space",
  "https://invidious.lunar.icu",
  "https://yt.artemislena.eu"
];

// --- 2. DAFTAR USER AGENT (20 UA SESUAI PERMINTAAN) ---
const userAgents = [
  // Desktop Windows/Mac
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.864.59",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
  
  // Mobile Android
  "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; SM-A505FN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; Redmi Note 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 9; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36",
  
  // Mobile iOS (iPhone/iPad)
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 13_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
  
  // Tablet/Others
  "Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
  "Mozilla/5.0 (CrOS x86_64 13904.77.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko"
];

function getVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default async function handler(req, res) {
  // Set CORS headers agar bisa diakses dari mana saja
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Cek API Key
  const apiKey = req.headers['x-api-key'] || req.query.apikey;
  if (!apiKey || apiKey.length < 8) {
    return res.status(401).json({
      status: false,
      code: 401,
      message: "API Key Missing. Please get a key from the dashboard."
    });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ status: false, code: 400, message: "URL parameter is required" });
  }

  const videoId = getVideoId(url);
  if (!videoId) {
    return res.status(400).json({ status: false, code: 400, message: "Invalid YouTube URL format" });
  }

  // Logika Retry & Failover
  const maxAttempts = 6;
  let attempt = 0;
  let success = false;
  let resultData = null;
  
  // Acak urutan server supaya beban terbagi
  const shuffledInstances = INVIDIOUS_INSTANCES.sort(() => 0.5 - Math.random());

  while (attempt < maxAttempts && !success) {
    const currentInstance = shuffledInstances[attempt];
    const currentUA = getRandom(userAgents); // Mengambil dari 20 UA di atas
    const apiUrl = `${currentInstance}/api/v1/videos/${videoId}`;

    attempt++;
    // Jeda bertahap: 0ms, 800ms, 1600ms...
    if (attempt > 1) await sleep(800 * (attempt - 1));

    try {
      const response = await axios.get(apiUrl, {
        headers: { 'User-Agent': currentUA },
        timeout: 4500 // Timeout 4.5 detik
      });

      if (response.status === 200) {
        success = true;
        const data = response.data;
        
        let downloads = [];
        
        // Filter Video + Audio (Combo)
        if (data.formatStreams) {
            downloads = data.formatStreams.map(item => ({
                type: "video_combo",
                quality: item.qualityLabel || item.resolution,
                format: item.container,
                url: item.url,
                size: item.size || "Unknown"
            }));
        }

        // Filter Audio Only
        if (data.adaptiveFormats) {
            const audioOnly = data.adaptiveFormats.find(item => item.type && item.type.includes("audio/mp4"));
            if (audioOnly) {
                downloads.push({
                    type: "audio_only",
                    quality: "HQ Audio",
                    format: "m4a",
                    url: audioOnly.url,
                    size: audioOnly.size || "Unknown"
                });
            }
        }

        resultData = {
            status: true,
            code: 200,
            server_used: currentInstance,
            data: {
                id: videoId,
                title: data.title,
                description: data.description,
                duration: data.lengthSeconds,
                views: data.viewCount,
                author: data.author,
                thumbnail: data.videoThumbnails ? data.videoThumbnails[0].url : "",
                downloads: downloads
            }
        };
      }
    } catch (error) {
      // Loop berlanjut ke server berikutnya jika gagal
    }
  }

  if (success) {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(resultData);
  } else {
    return res.status(503).json({
      status: false,
      code: 503,
      message: "Service Busy. Please try again in a moment."
    });
  }
    }
