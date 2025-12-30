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
const FALLBACK_API_KEY = "XYCoolcraftNihBoss"; 

// Helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function getVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export default async function handler(req, res) {
  // CORS Setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url, apikey, action, stream_url, filename, type } = req.query;

  // --- FITUR BARU: PROXY STREAM (Untuk Memperbaiki Download MP3) ---
  // Ini menangani request download agar file otomatis ter-rename dan punya format yang benar
  if (action === 'stream' && stream_url) {
    try {
        const response = await axios({
            method: 'get',
            url: stream_url,
            responseType: 'stream'
        });

        // Tentukan Content-Type
        const contentType = type === 'mp3' ? 'audio/mpeg' : 'video/mp4';
        const extension = type === 'mp3' ? 'mp3' : 'mp4';
        const finalFilename = filename ? `${filename.replace(/[^a-z0-9]/gi, '_')}.${extension}` : `download.${extension}`;

        // Set Headers agar browser langsung download (bukan play)
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
        
        // Pipe data langsung dari sumber ke user (Serverless Streaming)
        response.data.pipe(res);
        return; 
    } catch (error) {
        return res.status(500).json({ status: false, message: "Stream Failed: " + error.message });
    }
  }

  // --- LOGIKA UTAMA (GET METADATA) ---

  // Cek API Key
  const reqApiKey = req.headers['x-api-key'] || apikey;
  if (!reqApiKey || reqApiKey.length < 5) {
    return res.status(401).json({ status: false, message: "Invalid API Key" });
  }

  if (!url) return res.status(400).json({ status: false, message: "URL required" });
  const videoId = getVideoId(url);
  if (!videoId) return res.status(400).json({ status: false, message: "Invalid ID" });

  let resultData = null;
  let success = false;

  // 1. Prioritas Utama: BotCahx (Karena user minta fitur Auto MP3/MP4 yang stabil)
  // Kita ubah urutan: Coba BotCahx dulu untuk kecepatan, baru Invidious jika gagal
  // Atau tetap Invidious dulu? Sesuai request "Apikey luar", kita pakai logika Fallback yang kuat.
  
  // -- METHOD: INVIDIOUS ROTATION --
  let attempt = 0;
  const shuffled = INVIDIOUS_INSTANCES.sort(() => 0.5 - Math.random());
  
  while (attempt < 3 && !success) {
    try {
        const instance = shuffled[attempt];
        const apiUrl = `${instance}/api/v1/videos/${videoId}`;
        attempt++;
        
        const resp = await axios.get(apiUrl, { timeout: 3500 });
        if(resp.status === 200) {
            const d = resp.data;
            let downloads = [];

            // Mapping Invidious Data
            if(d.formatStreams) {
                d.formatStreams.forEach(v => {
                    downloads.push({
                        type: "video",
                        quality: v.qualityLabel,
                        format: v.container,
                        url: v.url // Link langsung
                    });
                });
            }
            if(d.adaptiveFormats) {
                const aud = d.adaptiveFormats.find(a => a.type.includes("audio/mp4"));
                if(aud) {
                    downloads.push({
                        type: "audio",
                        quality: "HQ",
                        format: "m4a",
                        url: aud.url
                    });
                }
            }

            resultData = {
                status: true,
                code: 200,
                server_used: "Invidious Node",
                data: {
                    id: videoId,
                    title: d.title,
                    thumbnail: d.videoThumbnails ? d.videoThumbnails[0].url : "",
                    duration: d.lengthSeconds,
                    author: d.author,
                    downloads: downloads
                }
            };
            success = true;
        }
    } catch(e) { }
  }

  // -- METHOD: BOTCAHX (FALLBACK / AUTO) --
  if(!success) {
      try {
          const fbUrl = `${FALLBACK_API_URL}?url=${encodeURIComponent(url)}&apikey=${FALLBACK_API_KEY}`;
          const fbRes = await axios.get(fbUrl);
          const fb = fbRes.data;

          if(fb.status && fb.result) {
              const r = fb.result;
              let downloads = [];
              
              // Disini triknya: Kita bungkus URL asli BotCahx ke dalam Proxy URL server kita
              // Agar pas user klik, server kita yang handle rename ke .mp3
              
              // Get Base URL dari host header untuk membuat link proxy sendiri
              const host = req.headers.host; 
              const protocol = req.headers['x-forwarded-proto'] || 'http';
              const baseUrl = `${protocol}://${host}/api/youtube`;

              if(r.mp4) {
                  const proxyUrl = `${baseUrl}?action=stream&type=mp4&filename=${encodeURIComponent(r.title)}&stream_url=${encodeURIComponent(r.mp4)}`;
                  downloads.push({
                      type: "video_auto",
                      quality: "Auto",
                      format: "mp4",
                      url: proxyUrl // Link menuju endpoint proxy kita
                  });
              }

              if(r.mp3) {
                  // Paksa MP3
                  const proxyUrlMp3 = `${baseUrl}?action=stream&type=mp3&filename=${encodeURIComponent(r.title)}&stream_url=${encodeURIComponent(r.mp3)}`;
                  downloads.push({
                      type: "audio_auto",
                      quality: "Auto",
                      format: "mp3",
                      url: proxyUrlMp3 // Link menuju endpoint proxy kita
                  });
              }

              resultData = {
                  status: true,
                  code: 200,
                  server_used: "Xayz Tech",
                  data: {
                      id: r.id,
                      title: r.title,
                      thumbnail: r.thumb,
                      duration: r.duration,
                      author: "Xayz Prime",
                      downloads: downloads
                  }
              };
              success = true;
          }
      } catch(e) {
          console.log(e.message);
      }
  }

  if(success) return res.status(200).json(resultData);
  return res.status(503).json({ status: false, message: "Server Busy" });
  }
