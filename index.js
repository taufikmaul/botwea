import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import fetch from 'node-fetch';
import express from 'express';
import bodyParser from 'body-parser';
import qrcode from 'qrcode';
import cloudinary from 'cloudinary';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: 'historycake',
  api_key: '824234235232239',
  api_secret: '55zzgbg0jphoZ_ScIqKIvU_3osk',
});

// Service Account untuk Firebase JWT
const serviceAccount = {
  private_key: `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDorSHGtC9QGhM1\noX/IAzdQI9vSq7g+0cA+Bay717wDjbfYQbxGCJX4sUkD3bxmhdISgjwWvRMCq7QA\n8HSRul5qonUuW5Sam5d3ivvH/F+tMgH1aGA7rqyVQgGk7akJzodqfuyEuk3MSJUG\nOkksfynPcwgTYYmTj3L+LjZLwN1t/FK1a67Ya2JIMC5CyQMjBb7f5bPLVmnETl1l\nNkYOZL3tGhiACnhZ44Mv9nxh6ZoHnw4pVSA8D4zgMDerbXMVThCu3/OCY41/DPwB\n3BgGEm+iCE7Qi/06m/C1aTV4tTuei+a6/VJX9olGV0dFGYRboKSAasPuMotEVzGD\neIoWE27tAgMBAAECggEAa6RE/vc2+DjH8ETBp9eNDF86gDD/MNi6tjbL3a8FhSNY\nDQ0EO+YW85GY9NftJAT+1Z84i1B3bgHfaZvUYeK1cWGtEoA9tHUM0roSl0dzP93l\nuBHMi2/Y2chKmHF2hVntneAQLas++KYPg20Nky9VOWq/LrAuBH0Vtu/MIKmeBxYV\nf9ikKh/+ZIJ6QN+DGj1mKIxDrGny+u6KAueqPXA+cdfp9UwNtWvUjURcDK3qRdc+\nBbhrS0iQphZy++pIdIB662eH+puschWeV89Z5xoNmT6AmKzwXfzxNM9KgtNlNyov\nU6sqjLjRBtP41yduG/SXOx/jy6f8e18TrPda9K4PxQKBgQD8SxEz2AIsJ1lT78jU\nX5RQc9kemM9duk6aPJPGmdyyUnbu8Ftcei1t4fwmV1qggBzu+zyWyLVC0/f5D4e2\nPTZxh9YtS/kUNlCdaLy6kZlYL8ZE8OH3M4H1jfOaOg7YqesC+Ave9wAwicBuOEXg\nA3ZZ9yz75B2aPqnGTX0Nfd9tawKBgQDsGEfr5NMW1Q0SJD4IKWC6BILBwbdoigY0\nix1XhC6Cyt9Q3Tzo6bzWmhsNW9ya6bglEMavXVmY8nuhxoBWAORdo9R+ArXmSLFs\nTo05/P0b6RMi0H65g02yOIlYQKsy8wMrIKu9KNFqqlNrozQ+DlQx5nUFEJOk7Qam\nW4n9OSmTBwKBgFNq6pwursE0nXeAT/HQTHSxaTeRpPbDlBuxLdc7plobpBFqzXpt\nNzoev0VaGq/4zBhEX4snf69B8Lqb5O5fnPG6zRkbBpclQlBZghVZ8M7UtQS0dLJM\niIrNTZ9P1PrUa80GgL5PAvQJh+OpnYjs/CPQ80Gx8gu+7lmP42ojlU1TAoGAYiym\nm50HehMV4FlZwiMSqcd+Z/uZvMrIUckXZnD8tj6OJh4ZWfD4KXTjkuaEEZbmj+Mt\n+3Yh78vFRTw52Yl9bMLXdZ7C7QOFY7g2WcqtpZGB95QjXhkPkfCYjC44AnOy+ZgY\nUgxLKMOy9Ktk6fkjYaynNHf0LTyy6zJdawL+GrkCgYEAmqeH1bfv1zwEPRdSkany\naEa8NZBSdGlfyRso2fcTwwEjxdt3zr3mhSQzcat04rYa062icGKdGL2Eotce05zW\nazRIQnSedNF86gS2qMYAqYWeayD0J6yiqItdZIWGObU8fhRnTxUEIUAA3yED4AGg\nUIexmo9rahR3X2xdfjO53YY=\n-----END PRIVATE KEY-----\n`,
  client_email: 'firebase-adminsdk-fbsvc@weaproject-ac574.iam.gserviceaccount.com',
  project_id: 'weaproject-ac574',
};

// Fungsi untuk ambil access token dari Firebase
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore',
  };

  const jwtToken = jwt.sign(payload, serviceAccount.private_key, { algorithm: 'RS256' });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwtToken,
    }),
  });

  const data = await response.json();
  return data.access_token;
}

// Inisialisasi WhatsApp client
console.log('Memulai inisialisasi WhatsApp client...');
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

// QR Code login
client.on('qr', async (qr) => {
  console.log('📸 QR Code diterima, silakan scan...');
  try {
    const url = await qrcode.toDataURL(qr);
    const result = await cloudinary.v2.uploader.upload(url, {
      folder: 'whatsapp_qrcodes',
      public_id: 'qrcode_image',
      resource_type: 'image',
    });
    console.log('✅ QR Code diupload:', result.secure_url);
  } catch (err) {
    console.error('❌ Gagal membuat/mengupload QR:', err);
    console.error('Detail QR:', qr);
  }
});

// Event saat bot siap
client.on('ready', () => {
  console.log('✅ Bot WhatsApp siap digunakan!');
});

client.on('auth_failure', msg => {
  console.error('❌ Autentikasi gagal:', msg);
});

client.on('disconnected', reason => {
  console.error('❌ Bot terputus:', reason);
});

// Pesan masuk
client.on('message', async (message) => {
  if (message.fromMe) return;

  const userId = message.from;
  const userMessage = message.body;

  console.log('📥 Pesan dari', userId, ':', userMessage);

  try {
    const accessToken = await getAccessToken();

    const webhookResponse = await fetch('https://hook.eu2.make.com/gfed8nj28t30zv40pqt8rrf0b1926snk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        from: userId,
        access_token: accessToken,
      }),
    });

    const contentType = webhookResponse.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await webhookResponse.text();
      console.warn('⚠️ Webhook tidak mengembalikan JSON. Respons:', text);
      return;
    }

    const data = await webhookResponse.json();
    if (data.reply) {
      await message.reply(data.reply);
      console.log('✅ Balasan berhasil dikirim.');
    } else {
      console.log('ℹ️ Tidak ada balasan dari webhook.');
    }
  } catch (error) {
    console.error('❌ Gagal memproses pesan:', error);
  }
});

// Endpoint test Railway
app.get('/', (req, res) => {
  res.send('WhatsApp bot aktif.');
});

// Endpoint kirim pesan manual
app.use(bodyParser.json());
app.post('/reply', async (req, res) => {
  try {
    let payload;

    if (typeof req.body === 'string') {
      try {
        payload = JSON.parse(req.body);
      } catch (e) {
        return res.status(400).json({ error: 'Format JSON tidak valid.' });
      }
    } else if (typeof req.body.data === 'string') {
      try {
        payload = JSON.parse(req.body.data);
      } catch (e) {
        return res.status(400).json({ error: 'Format JSON dalam field "data" tidak valid.' });
      }
    } else {
      payload = req.body.data || req.body;
    }

    const { from, reply, imageUrl, caption } = payload;

    if (!from || (!reply && !imageUrl)) {
      return res.status(400).json({
        error: 'Parameter "from" dan minimal salah satu dari "reply" atau "imageUrl" wajib diisi',
        contoh_format: {
          from: '628xxxx@c.us',
          reply: 'Pesan balasan',
          imageUrl: 'https://domain.com/file.jpg',
          caption: 'Ini caption opsional',
        },
      });
    }

    if (imageUrl) {
      const media = await MessageMedia.fromUrl(imageUrl, { unsafeMime: true });
      await client.sendMessage(from, media, { caption: caption || reply || '' });
    } else {
      await client.sendMessage(from, reply);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error di /reply:', err);
    res.status(500).json({
      error: 'Gagal memproses permintaan.',
      detail: err.message,
      raw: req.body,
    });
  }
});

// Inisialisasi bot
client.initialize()
  .then(() => console.log('✅ client.initialize() sukses'))
  .catch(err => console.error('❌ Gagal initialize WhatsApp client:', err));

// Jalankan server
app.listen(PORT, () => {
  console.log(`🚀 Server Express aktif di port ${PORT}`);
});
