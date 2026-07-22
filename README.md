# n8n-nodes-bale

<p align="center">
  <img src="https://raw.githubusercontent.com/amirezamky9/n8n-nodes-bale/master/nodes/Bale/bale.svg" width="120" alt="Bale Logo">
</p>

<p align="center">
  <strong>Community node for <a href="https://ble.ir">Bale Messenger</a> integration with <a href="https://n8n.io">n8n</a></strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/n8n-nodes-bale">
    <img src="https://img.shields.io/npm/v/n8n-nodes-bale.svg" alt="npm version">
  </a>
  <a href="https://www.npmjs.com/package/n8n-nodes-bale">
    <img src="https://img.shields.io/npm/dm/n8n-nodes-bale.svg" alt="npm downloads">
  </a>
  <a href="https://github.com/amirezamky9/n8n-nodes-bale/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/amirezamky9/n8n-nodes-bale" alt="license">
  </a>
</p>

---

## 📖 English

### Features

- 📨 **Send Messages**: Text, photo, video, document, audio, voice, animation, sticker, location
- 🎯 **Advanced Features**: Reply markup, inline keyboards, reply keyboards, force reply
- 💬 **Webhook Trigger**: Real-time updates from Bale bot
- 📁 **File Operations**: Get file info, download files
- 👥 **Chat Management**: Get chat info, administrators, members, set title/description
- 🔔 **Callback Handling**: Answer callback queries, inline queries
- 💳 **Payment Integration**: Send invoices, create invoice links, answer pre-checkout queries, inquire transactions (Bale Wallet)

### Installation

#### Via n8n UI (Recommended)

1. Open n8n
2. Go to **Settings** → **Community Nodes**
3. Search for `n8n-nodes-bale`
4. Click **Install**

#### Via npm

```bash
cd ~/.n8n
npm install n8n-nodes-bale
```

### Setup

1. **Create a Bot on Bale**:
   - Open [BotFather](https://ble.ir/botfather) on Bale
   - Send `/newbot` and follow the instructions
   - Copy the API token

2. **Add Credentials in n8n**:
   - Go to **Credentials** → **New**
   - Search for "Bale API"
   - Enter your bot token
   - Save

3. **Use the Node**:
   - Add the "Bale" node to your workflow
   - Select your credential
   - Choose an operation (sendMessage, sendPhoto, etc.)
   - Fill in the required fields

### Operations

| Resource | Operation | Description |
|----------|-----------|-------------|
| **Message** | Send Message | Send a text message |
| | Send Photo | Send a photo (URL, file ID, or binary) |
| | Send Video | Send a video (URL, file ID, or binary) |
| | Send Document | Send a document (URL, file ID, or binary) |
| | Send Audio | Send an audio file |
| | Send Voice | Send a voice message |
| | Send Animation | Send a GIF animation |
| | Send Sticker | Send a sticker |
| | Send Location | Send a geographic location |
| | Send Chat Action | Send a typing/uploading indicator |
| | Send Media Group | Send a group of media as album |
| | Copy Message | Copy a message to another chat |
| | Forward Message | Forward a message |
| | Delete Message | Delete a message |
| | Edit Message Text | Edit a text message |
| | Edit Message Caption | Edit a message caption |
| | Pin Chat Message | Pin a message in chat |
| | Unpin Chat Message | Unpin a message |
| **Callback** | Answer Query | Answer a callback query |
| | Answer Inline Query | Answer an inline query |
| **Chat** | Get | Get chat information |
| | Get Administrators | Get chat administrators |
| | Get Member | Get a chat member |
| | Leave | Leave a chat |
| | Set Description | Set chat description |
| | Set Title | Set chat title |
| **File** | Get | Get file information |
| **Payment** | Send Invoice | Send a payment invoice (Bale Wallet) |
| | Create Invoice Link | Create a payment link for Mini Apps |
| | Answer Pre-Checkout Query | Answer a pre-checkout query |
| | Inquire Transaction | Inquire about a transaction status |

### Webhook Trigger

The trigger node receives real-time updates from your Bale bot. It supports:

- Messages (text, photo, video, document, audio, etc.)
- Callback queries (inline keyboard buttons)
- Inline queries
- Pre-checkout queries (payments)

**Setup**:
1. Add "Bale Trigger" to your workflow
2. Select your credential
3. Choose which update types to receive
4. Set up a webhook URL in your bot

### Example Workflow

```
Bale Trigger → IF (message.text contains "help") → Send Message (reply with help text)
```

---

## 📖 فارسی

### قابلیت‌ها

- 📨 **ارسال پیام**: متن، عکس، ویدیو، فایل، صدا، انیمیشن، استیکر، موقعیت
- 🎯 **قابلیت‌های پیشرفته**: reply markup، inline keyboard، reply keyboard
- 💬 **وب‌هوک تریگر**: دریافت آنی آپدیت‌ها از ربات بله
- 📁 **عملیات فایل**: دریافت اطلاعات فایل، دانلود فایل
- 👥 **مدیریت چت**: دریافت اطلاعات چت، ادمین‌ها، اعضا
- 🔔 **پردازش callback**: پاسخ به callback query و inline query
- 💳 **پرداخت**: ارسال صورتحساب، ایجاد لینک پرداخت، پاسخ به pre-checkout (کیف پول بله)

### نصب

#### از طریق رابط n8n (توصیه شده)

1. n8n رو باز کنید
2. به **Settings** → **Community Nodes** برید
3. `n8n-nodes-bale` رو جستجو کنید
4. روی **Install** کلیک کنید

#### از طریق npm

```bash
cd ~/.n8n
npm install n8n-nodes-bale
```

### راه‌اندازی

1. **ساخت ربات در بله**:
   - [BotFather](https://ble.ir/botfather) رو در بله باز کنید
   - `/newbot` رو بفرستید و مراحل رو دنبال کنید
   - توکن API رو کپی کنید

2. **افزودن credential در n8n**:
   - به **Credentials** → **New** برید
   - "Bale API" رو جستجو کنید
   - توکن ربات رو وارد کنید
   - ذخیره کنید

3. **استفاده از نود**:
   - نود "Bale" رو به workflow اضافه کنید
   - credential خود رو انتخاب کنید
   - یک عملیات انتخاب کنید (sendMessage، sendPhoto، و...)
   - فیلدهای ضروری رو پر کنید

### عملیات‌ها

| منبع | عملیات | توضیح |
|------|--------|-------|
| **پیام** | ارسال پیام متنی | ارسال پیام متنی |
| | ارسال عکس | ارسال عکس (URL، file ID یا binary) |
| | ارسال ویدیو | ارسال ویدیو |
| | ارسال فایل | ارسال سند/فایل |
| | ارسال صدا | ارسال پیام صوتی |
| | ارسال انیمیشن | ارسال GIF |
| | ارسال استیکر | ارسال استیکر |
| | ارسال موقعیت | ارسال موقعیت جغرافیایی |
| | ارسال عمل چت | ارسال نشانگر تایپ |
| | ارسال آلبوم | ارسال گروهی رسانه |
| | کپی پیام | کپی پیام به چت دیگر |
| | فوروارد پیام | فوروارد پیام |
| | حذف پیام | حذف پیام |
| | ویرایش متن | ویرایش متن پیام |
| | ویرایش کپشن | ویرایش کپشن |
| | پین پیام | پین کردن پیام |
| | آnpin پیام | برداشتن پین |
| **کالبک** | پاسخ به query | پاسخ به callback query |
| | پاسخ به inline | پاسخ به inline query |
| **چت** | دریافت اطلاعات | دریافت اطلاعات چت |
| | دریافت ادمین‌ها | دریافت لیست ادمین‌ها |
| | دریافت عضو | دریافت اطلاعات عضو |
| | ترک چت | ترک کردن چت |
| | تنظیم توضیحات | تنظیم توضیحات چت |
| | تنظیم عنوان | تنظیم عنوان چت |
| **فایل** | دریافت فایل | دریافت اطلاعات فایل |
| **پرداخت** | ارسال صورتحساب | ارسال صورتحساب پرداخت (کیف پول بله) |
| | ایجاد لینک | ایجاد لینک پرداخت برای مینی‌اپ |
| | پاسخ pre-checkout | پاسخ به درخواست pre-checkout |
| | استعلام تراکنش | استعلام وضعیت تراکنش |

### وب‌هوک تریگر

تریگر آپدیت‌های لحظه‌ای ربات بله رو دریافت می‌کنه:

- پیام‌ها (متن، عکس، ویدیو، فایل، صدا و...)
- callback query (دکمه‌های inline keyboard)
- inline query
- pre-checkout query (پرداخت)

### مثال workflow

```
Bale Trigger → IF (message.text حاوی "کمک") → Send Message (پاسخ با متن راهنما)
```

---

## 📄 License

MIT © [Amirreza Mokhtari](https://github.com/amirezamky9)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](https://github.com/amirezamky9/n8n-nodes-bale/issues).

---

## ⭐ Support

If this project helps you, please give it a ⭐ on GitHub!
