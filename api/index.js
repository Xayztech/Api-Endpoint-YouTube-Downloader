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

const FALLBACK_API_URL = "https://api.botcahx.eu.org/api/dowloader/yt";
const FALLBACK_API_KEY = "XYCoolcraftNihBoss"; // API Key Server-side

// Helper Functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function getVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export default async function handler(req, res) {
  // Setup CORS agar bisa diakses dari web mana saja
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Validasi API Key milik Project Kita (Client ke Server Kita)
  const apiKey = req.headers['x-api-key'] || req.query.apikey;
  if (!apiKey || apiKey.length < 8) {
    return res.status(401).json({
      status: false,
      code: 401,
      message: "API Key Missing or Invalid. Please generate one from the dashboard."
    });
  }

  const { url } = req.query;
  if (!url) return res.status(400).json({ status: false, message: "URL parameter is required" });

  const videoId = getVideoId(url);
  if (!videoId) return res.status(400).json({ status: false, message: "Invalid YouTube URL format" });

  // Variables untuk Logic Failover
  const maxAttempts = 5;
  let attempt = 0;
  let success = false;
  let resultData = null;
  
  // Acak server Invidious
  const shuffledInstances = INVIDIOUS_INSTANCES.sort(() => 0.5 - Math.random());

  // --- METHOD 1: COBA INVIDIOUS (Multi-Server) ---
  while (attempt < maxAttempts && !success) {
    const currentInstance = shuffledInstances[attempt];
    attempt++;
    
    // Delay sedikit jika percobaan pertama gagal
    if (attempt > 1) await sleep(500);

    try {
      const response = await axios.get(`${currentInstance}/api/v1/videos/${videoId}`, {
        headers: { 'User-Agent': getRandom(USER_AGENTS) },
        timeout: 4999 // 4.5 detik timeout
      });

      if (response.status === 200) {
        const data = response.data;
        let downloads = [];

        // Parsing hasil Invidious (Video + Audio)
        if (data.formatStreams) {
            data.formatStreams.forEach(item => {
                downloads.push({
                    type: "video", // Kualitas bervariasi
                    quality: item.qualityLabel || item.resolution,
                    format: item.container,
                    url: item.url
                });
            });
        }

        // Parsing Audio Only
        if (data.adaptiveFormats) {
            const audio = data.adaptiveFormats.find(i => i.type && i.type.includes("audio/mp4"));
            if (audio) {
                downloads.push({
                    type: "audio",
                    quality: "HQ Audio",
                    format: "m4a",
                    url: audio.url
                });
            }
        }

        resultData = {
            status: true,
            code: 200,
            server_used: "Invidious Engine (" + new URL(currentInstance).hostname + ")",
            data: {
                id: videoId,
                title: data.title,
                author: data.author,
                duration: data.lengthSeconds + "s",
                thumbnail: data.videoThumbnails ? data.videoThumbnails[0].url : "",
                downloads: downloads
            }
        };
        success = true;
      }
    } catch (e) {
      // Gagal di server ini, lanjut ke loop berikutnya
    }
  }

  // --- METHOD 2: FALLBACK KE BOTCAHX (Jika semua Invidious gagal) ---
  if (!success) {
    try {
        console.log("Switching to Fallback Engine (BotCahx)...");
        const fallbackFullUrl = `${FALLBACK_API_URL}?url=${encodeURIComponent(url)}&apikey=${FALLBACK_API_KEY}`;
        
        const fbRes = await axios.get(fallbackFullUrl, { timeout: 15000 });
        const fbData = fbRes.data;

        // BotCahx structure: { status: true, result: { mp4: "link", mp3: "link", ... } }
        if (fbData.status && fbData.result) {
            const r = fbData.result;
            const downloads = [];

            // 1. Masukkan MP4 (Auto Download Video)
            if (r.mp4) {
                downloads.push({
                    type: "video_auto",
                    quality: "Auto",
                    format: "mp4",
                    url: r.mp4
                });
            }

            // 2. Masukkan MP3 (Auto Convert Audio)
            if (r.mp3) {
                downloads.push({
                    type: "audio_auto",
                    quality: "Auto",
                    format: "mp3",
                    url: r.mp3
                });
            }

            resultData = {
                status: true,
                code: 200,
                server_used: "Xayz Tech",
                data: {
                    id: r.id || videoId,
                    title: r.title,
                    author: "External Source",
                    duration: r.duration,
                    thumbnail: r.thumb,
                    downloads: downloads
                }
            };
            success = true;
        }
    } catch (e) {
        console.error("Fallback Error:", e.message);
    }
  }

  // --- RETURN FINAL RESPONSE ---
  if (success && resultData) {
    // Cache response agar cepat jika direquest ulang (1 jam)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(resultData);
  } else {
    return res.status(503).json({
      status: false,
      code: 503,
      message: "System Busy. All servers are currently unreachable. Please try again in a few minutes."
    });
  }
  }
