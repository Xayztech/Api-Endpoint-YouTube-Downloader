import axios from 'axios';
import yts from 'yt-search';

const INVIDIOUS_INSTANCES = [
  "https://inv.tux.pizza",
  "https://vid.puffyan.us",
  "https://yewtu.be",
  "https://invidious.kavin.rocks",
  "https://invidious.drgns.space",
  "https://invidious.lunar.icu",
  "https://yt.artemislena.eu"
];

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.864.59",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; SM-A505FN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; Redmi Note 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 9; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 13_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
  "Mozilla/5.0 (CrOS x86_64 13904.77.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko"
];

const FALLBACK_API_URL = "https://api.botcahx.eu.org/api/dowloader/yt";
const FALLBACK_API_KEY = "XYCoolcraftNihBoss"; 

function getVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function tiktokDl(url) {
    return new Promise(async (resolve, reject) => {
        try {
            let data = [];
            function formatNumber(integer) {
                return Number(parseInt(integer)).toLocaleString().replace(/,/g, ".");
            }

            function formatDate(n, locale = "id-ID") {
                let d = new Date(n * 1000);
                return d.toLocaleDateString(locale, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                    second: "numeric",
                });
            }

            let domain = "https://www.tikwm.com/api/";
            let res = await (
                await axios.post(
                    domain,
                    {},
                    {
                        headers: {
                            Accept: "application/json, text/javascript, */*; q=0.01",
                            "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
                            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                            Origin: "https://www.tikwm.com",
                            Referer: "https://www.tikwm.com/",
                            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
                        },
                        params: {
                            url: url,
                            count: 12,
                            cursor: 0,
                            web: 1,
                            hd: 1,
                        },
                    }
                )
            ).data.data;

            if (!res) return resolve(null);

            if (res.duration == 0) {
                res.images.forEach((v) => {
                    data.push({ type: "photo", url: v });
                });
            } else {
                data.push(
                    {
                        type: "watermark",
                        url: "https://www.tikwm.com" + res?.wmplay || "/undefined",
                    },
                    {
                        type: "nowatermark",
                        url: "https://www.tikwm.com" + res?.play || "/undefined",
                    },
                    {
                        type: "nowatermark_hd",
                        url: "https://www.tikwm.com" + res?.hdplay || "/undefined",
                    }
                );
                if (res.music) {
                    data.push({
                        type: "audio",
                        url: "https://www.tikwm.com" + res.music
                    });
                }
            }

            resolve({
                status: true,
                title: res.title,
                taken_at: formatDate(res.create_time).replace("1970", ""),
                region: res.region,
                id: res.id,
                duration: res.duration + " detik",
                cover: "https://www.tikwm.com" + res.cover,
                stats: {
                    views: formatNumber(res.play_count),
                    likes: formatNumber(res.digg_count),
                    comment: formatNumber(res.comment_count),
                    share: formatNumber(res.share_count),
                    download: formatNumber(res.download_count),
                },
                author: {
                    id: res.author.id,
                    fullname: res.author.unique_id,
                    nickname: res.author.nickname,
                    avatar: "https://www.tikwm.com" + res.author.avatar,
                },
                video_links: data,
            });
        } catch (e) {
            resolve(null);
        }
    });
}

async function tiktokSearch(query) {
    try {
        const response = await axios.get(`https://tikwm.com/api/feed/search?keywords=${encodeURIComponent(query)}&count=12&cursor=0&web=1&hd=1`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36"
            }
        });
        
        if(response.data && response.data.data && response.data.data.videos) {
            return response.data.data.videos.map(v => ({
                id: v.video_id,
                title: v.title,
                thumbnail: "https://www.tikwm.com" + v.cover,
                author: v.author.nickname,
                url: `https://www.tiktok.com/@${v.author.unique_id}/video/${v.video_id}`,
                duration: v.duration + "s",
                ago: "Unknown"
            }));
        }
        return [];
    } catch (e) {
        return [];
    }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url, apikey, type, q } = req.query;

  const reqApiKey = req.headers['x-api-key'] || apikey;
  if (!reqApiKey || reqApiKey.length < 5) {
    return res.status(401).json({ status: false, message: "Invalid API Key. Please Generate one from Dashboard." });
  }

  try {
      if (type === 'yt_search') {
          if (!q) return res.status(400).json({ status: false, message: "Query required" });
          const r = await yts(q);
          const videos = r.videos || [];
          const data = videos.map(v => ({
          status: true,
          code: 200,
          owner: "XYCoolcraft", 
          Developer: "XYCoolcraft",
          data_result: {
              id: v.videoId,
              title: v.title,
              author: v.author.name,
              thumbnail: v.thumbnail,
              url: v.url,
              duration: v.timestamp,
              published: v.ago 
          }
          }));
          return res.status(200).json({ status: true, code: 200, engine: "Xayz Tech", data });
      }

      if (type === 'tt_search') {
          if (!q) return res.status(400).json({ status: false, message: "Query required" });
          const data = await tiktokSearch(q);
          return res.status(200).json({ status: true, code: 200, engine: "tikwm-feed", data });
      }

      if (type === 'tt_dl') {
          if (!url) return res.status(400).json({ status: false, message: "URL required" });
          const data = await tiktokDl(url);
          if(!data) return res.status(404).json({ status: false, message: "Video not found" });
          return res.status(200).json({ status: true, code: 200, engine: "Xayz Tech", data });
      }

      if (type === 'yt_dl' || (!type && url)) {
          if (!url) return res.status(400).json({ status: false, message: "URL required" });
          const videoId = getVideoId(url);
          if (!videoId) return res.status(400).json({ status: false, message: "Invalid Youtube ID" });

          let resultData = null;
          let success = false;
          let attempt = 0;
          const shuffled = INVIDIOUS_INSTANCES.sort(() => 0.5 - Math.random());
  
          while (attempt < 3 && !success) {
            try {
                const instance = shuffled[attempt];
                attempt++;
                const resp = await axios.get(`${instance}/api/v1/videos/${videoId}`, { timeout: 4000 });
                if(resp.status === 200) {
                    const d = resp.data;
                    let downloads = [];
                    
                    if(d.formatStreams) {
                        d.formatStreams.forEach(v => {
                            downloads.push({ type: "video", quality: v.qualityLabel, format: v.container, url: v.url });
                        });
                    }
                    if(d.adaptiveFormats) {
                        const aud = d.adaptiveFormats.find(a => a.type.includes("audio/mp4"));
                        if(aud) downloads.push({ type: "audio", quality: "HQ", format: "m4a", url: aud.url });
                    }
                    
                    resultData = {
                        status: true, 
                        code: 200, 
                        server_used: "Xayz Tech",
                        data: {
                            id: videoId,
                            title: d.title,
                            thumbnail: d.videoThumbnails ? d.videoThumbnails[0].url : "", 
                            duration: d.lengthSeconds,
                            author: d.author, 
                            downloads
                        }
                    };
                    success = true;
                }
            } catch(e) { }
          }

          if(!success) {
              try {
                  const fbUrl = `${FALLBACK_API_URL}?url=${encodeURIComponent(url)}&apikey=${FALLBACK_API_KEY}`;
                  const fbRes = await axios.get(fbUrl);
                  const fb = fbRes.data;

                  if(fb.status && fb.result) {
                      const r = fb.result;
                      resultData = {
                          status: true,
                          code: 200,
                          owner: "XYCoolcraft", 
                          Developer: "XYCoolcraft",
                          data: {
                                id: r.id,
                                title: r.title, 
                                thumbnail: r.thumb,
                                duration: r.duration, 
                                author: "Xayz Tech", 
                                downloads: [
                                    { type: "video_auto", quality: "Auto", format: "mp4", url: r.mp4 },
                                    { type: "audio_auto", quality: "Auto", format: "mp3", url: r.mp3 }
                                ]
                          }
                      };
                      success = true;
                  }
              } catch(e) { }
          }

          if(success) return res.status(200).json(resultData);
          return res.status(503).json({ status: false, message: "Server Busy" });
      }

      return res.status(400).json({ status: false, message: "Unknown Type Parameter" });

  } catch (e) {
      return res.status(500).json({ status: false, message: "Internal Error: " + e.message });
  }
}