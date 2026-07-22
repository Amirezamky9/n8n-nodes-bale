# n8n-nodes-bale — معماری و طراحی پروژه

## خلاصه

community node برای n8n که اپلیکیشن پیام‌رسان [بله](https://ble.ir) رو پوشش میده.
API بله کپی تقریباً ۱:۱ از Telegram Bot API هست با تغییرات جزئی.

---

## مقایسه Bale API vs Telegram Bot API

| ویژگی | Telegram | Bale | تفاوت |
|--------|----------|------|-------|
| Base URL | `https://api.telegram.org` | `https://api.bale.ai` | ✅ متفاوت |
| Token format | `123:ABC` | `123:ABC` | ❌ یکی |
| Webhook ports | 443, 80, 88 | 443, 88 | ⚠️ حذف 80 |
| File download | `https://api.telegram.org/file/bot<token>/...` | `https://api.bale.ai/file/bot<token>/...` | ✅ متفاوت |
| getUpdates | ✅ | ✅ | ❌ یکی |
| setWebhook | ✅ | ✅ | ❌ یکی |
| sendMessage | ✅ | ✅ | ❌ یکی |
| sendPhoto/Video/... | ✅ | ✅ | ❌ یکی |
| Inline Keyboard | ✅ | ✅ | ❌ یکی |
| Callback Query | ✅ | ✅ | ❌ یکی |
| Stickers | ✅ | ✅ | ❌ یکی |
| Chat Management | ✅ | ✅ | ❌ یکی |
| **askReview** | ❌ | ✅ | 🔴 Bale-only |
| **inquireTransaction** | ❌ | ✅ | 🔴 Bale-only |
| **Payment (Wallet)** | Telegram Payments | Bale Wallet | 🔴 کاملاً متفاوت |
| Invoice | ✅ (多种 provider) | ✅ (فقط کیف پول) | ⚠️ محدودتر |
| Webhook security | Secret Token | Secret Token | ❌ یکی |
| Edit Message | ✅ | ✅ | ❌ یکی |
| Delete Message | ✅ | ✅ | ❌ یکی |
| Media Group | ✅ | ✅ | ❌ یکی |
| File size (send) | 50MB | 50MB | ❌ یکی |
| File size (download) | 20MB | 20MB | ❌ یکی |
| Message storage | ~48h | 2000 msg / 24h | ⚠️ کمتر |

### نتیجه‌گیری
- **~90% کد تلگرام قابل بازیافت** هست
- تغییرات اصلی: Base URL + credential + پرداخت + روش‌های اختصاصی Bale

---

## ساختار پروژه (Community Node Standard)

```
n8n-nodes-bale/
├── .github/
│   └── workflows/
│       └── publish.yml              # GitHub Actions - publish با provenance
├── .vscode/
│   └── settings.json
├── credentials/
│   └── BaleApi.credentials.ts       # Credential type
├── nodes/
│   └── Bale/
│       ├── Bale.node.ts             # نود اصلی (Execute)
│       ├── BaleTrigger.node.ts      # نود Trigger (webhook + polling)
│       ├── GenericFunctions.ts      # توابع مشترک API request, reply markup
│       ├── descriptions/
│       │   ├── Chat.description.ts  # توضیحات resource: chat
│       │   ├── Message.description.ts # توضیحات resource: message
│       │   ├── Callback.description.ts # توضیحات resource: callback
│       │   ├── File.description.ts  # توضیحات resource: file
│       │   └── Payment.description.ts # توضیحات resource: payment (Bale Wallet)
│       ├── methods/
│       │   ├── chat.execute.ts      # اجرای operation های chat
│       │   ├── message.execute.ts   # اجرای operation های message
│       │   ├── callback.execute.ts  # اجرای operation های callback
│       │   ├── file.execute.ts      # اجرای operation های file
│       │   └── payment.execute.ts   # اجرای operation های payment
│       ├── hitl/
│       │   ├── descriptions.ts      # Send & Wait descriptions
│       │   ├── setup.ts             # HITL setup
│       │   ├── webhook.ts           # HITL webhook handler
│       │   └── tokens.ts            # Secret token derivation
│       ├── util/
│       │   ├── triggerUtils.ts      # download file, trigger helpers
│       │   └── types.ts             # TypeScript interfaces
│       ├── __schema__/              # Schema files (auto-generated)
│       ├── tests/                   # Unit tests
│       └── bale.svg                 # آیکون نود
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── .prettierrc.js
├── .gitignore
├── README.md
├── CHANGELOG.md
├── LICENSE                          # MIT
└── ARCHITECTURE.md                  # این فایل
```

---

## فایل‌های کلیدی و مسئولیت‌ها

### 1. `credentials/BaleApi.credentials.ts`
```typescript
// تقریباً یکی با TelegramApi.credentials.ts
// تفاوت:
//   - displayName: 'Bale API'
//   - baseUrl default: 'https://api.bale.ai'  (نه api.telegram.org)
//   - documentationUrl:指向 Bale docs
//   - test request: /getMe
```

### 2. `nodes/Bale/Bale.node.ts`
```typescript
// Resource/Operation pattern (مثل Telegram)
// Resources:
//   - message: sendMessage, sendPhoto, sendVideo, sendDocument,
//              sendAudio, sendVoice, sendAnimation, sendSticker,
//              sendLocation, sendContact, sendChatAction,
//              sendMediaGroup, editMessageText, editMessageCaption,
//              editMessageReplyMarkup, deleteMessage, pinChatMessage,
//              unpinChatMessage, sendMessageDraft (اختیاری)
//   - chat: get, getAdministrators, getMember, leave,
//           setDescriptions, setTitle
//   - callback: answerQuery, answerInlineQuery
//   - file: get
//   - payment: createInvoiceLink, answerPreCheckoutQuery
//              (فقط Bale Wallet)
```

### 3. `nodes/Bale/BaleTrigger.node.ts`
```typescript
// Webhook + Long Polling dual mode
// Trigger On: message, edited_message, channel_post,
//             edited_channel_post, callback_query,
//             inline_query, pre_checkout_query, poll
// (مشابه Telegram Trigger)
// Bale-specific: askReview update type اضافه شود
```

### 4. `nodes/Bale/GenericFunctions.ts`
```typescript
// - apiRequest(): تغییر base URL به Bale
// - addAdditionalFields()
// - addReplyMarkup()
// - getPropertyName()
// - createSendAndWaitMessageBody()
// از Telegram/GenericFunctions.ts کپی + اصلاح
```

---

## تغییرات اصلی نسبت به کد تلگرام

### A. Base URL
```typescript
// Telegram:
'https://api.telegram.org'

// Bale:
'https://api.bale.ai'
```

### B. File Download URL
```typescript
// Telegram:
`https://api.telegram.org/file/bot${token}/${filePath}`

// Bale:
`https://api.bale.ai/file/bot${token}/${filePath}`
```

### C. Payment (Bale Wallet) — تغییرات عمده

پرداخت بله **کاملاً متفاوت** از تلگرام هست. نسخه قبلی اشتباه بود.

```typescript
// ═══════════════════════════════════════════════════════
//   Telegram Payments vs Bale Wallet — مقایسه کامل
// ═══════════════════════════════════════════════════════

// TELEGRAM:
//   - چندین provider پرداخت (Stripe, PayPal, etc.)
//   - provider_token از هر provider متفاوت
//   - ارزهای مختلف پشتیبانی می‌شود
//   - ShippingQuery برای قیمت‌های متغیر
//   - refundInvoice برای بازگشت وجه
//   - RefinedShippingOption, LabeledPrice
//   - Multiple payment providers in parallel

// BALE:
//   - فقط کیف پول بله (Bale Wallet)
//   - کارت‌به‌کارت حذف شده (قبلاً پشتیبانی می‌شد)
//   - سه نوع کیف پول: شخصی، تجاری، سازمانی
//   - توکن پرداخت از BotFather دریافت می‌شود
//   - توکن تست: WALLET-TEST-1111111111111111
//   - ارز: فرضاً IRR (ریال)
//   - ShippingQuery وجود ندارد
//   - refundInvoice وجود ندارد
```

#### متدهای پرداخت Bale

```typescript
// 1. sendInvoice — ارسال درخواست پول
//    Parameters:
//      - chat_id: number (الزامی)
//      - provider_token: string (توکن کیف پول از BotFather)
//      - currency: string (ارز)
//      - prices: LabeledPrice[] (لیست اقلام قیمت)
//      - title: string (عنوان صورتحساب)
//      - description: string (توضیحات)
//      - payload: string (اطلاعات سفارشی developer)
//      - start_parameter?: string (لینک اشتراک‌گذاری)
//      - provider_data?: string (اطلاعات اضافی provider)
//      - photo_url?: string (عکس صورتحساب)
//      - need_name?: boolean
//      - need_phone_number?: boolean
//      - need_email?: boolean
//      - need_shipping_address?: boolean
//      - send_email_to_provider?: boolean
//      - is_flexible?: boolean
//    Returns: Message

// 2. createInvoiceLink — ایجاد لینک پرداخت برای مینی‌اپ
//    Parameters:
//      - title: string
//      - description: string
//      - provider_token: string
//      - currency: string
//      - prices: LabeledPrice[]
//      - max_tip_amount?: number
//      - suggested_tip_amounts?: number[]
//      - provider_data?: string
//      - photo_url?: string
//      - need_name?: boolean
//      - need_phone_number?: boolean
//      - need_email?: boolean
//    Returns: string (invoice link URL)

// 3. answerPreCheckoutQuery — تایید/رد پرداخت
//    ⚠️ حداکثر ۱۰ ثانیه — در غیر اینصورت لغو می‌شود
//    Parameters:
//      - pre_checkout_query_id: string (الزامی)
//      - ok: boolean
//      - error_message?: string (دلیل رد)
//    Returns: boolean

// 4. inquireTransaction — استعلام تراکنش (Bale-only)
//    ⚠️ در کتابخانه‌های تلگرام وجود ندارد
//    ⚠️ نیاز به HTTP مستقیم دارد
//    Parameters:
//      - transaction_id: string (شناسه یکتای تراکنش)
//    Returns: Transaction object
```

#### اشیاء پرداخت Bale

```typescript
// LabeledPrice
interface LabeledPrice {
  label: string;    // عنوان آیتم (مثلاً "خرید محصول X")
  amount: number;   // مبلغ به واحد پول (ریال)
}

// PreCheckoutQuery (trigger update)
interface PreCheckoutQuery {
  id: string;
  from: User;
  currency: string;
  total_amount: number;
  invoice_payload: string;
  // ❌ shipping_option_id وجود ندارد
  // ❌ order_info محدودتر از تلگرام
}

// SuccessfulPayment (trigger update)
interface SuccessfulPayment {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  provider_payment_charge_id: string;  // شناسه تراکنش
  // ❌ telegram_payment_charge_id وجود ندارد
}

// Transaction (بازگشتی از inquireTransaction)
interface Transaction {
  // ساختار کامل از داکیومنت Bale
  // شامل وضعیت تراکنش، جزئیات پرداخت
}
```

#### جریان پرداخت Bale

```
Developer                          Bale Server                    User
    |                                  |                           |
    |-- sendInvoice ----------------->|                           |
    |   (with wallet token)           |--- Invoice Message ------>|
    |<-- Message ---------------------|                           |
    |                                 |                           |
    |                                 |<--- Tap "Pay" -----------|
    |                                 |                           |
    |<-- PreCheckoutQuery ------------|                           |
    |   (10s timeout!)                |                           |
    |-- answerPreCheckoutQuery ------>|                           |
    |   (ok: true)                    |                           |
    |                                 |--- Payment UI ----------->|
    |                                 |                           |
    |                                 |<--- Confirm Payment ------|
    |                                 |                           |
    |<-- SuccessfulPayment -----------|                           |
    |   (final confirmation)          |                           |
    |                                 |                           |
    |   OR (optional):                |                           |
    |-- inquireTransaction ---------->|                           |
    |<-- Transaction -----------------|                           |
```

#### تفاوت‌های کلیدی با تلگرام

| ویژگی | Telegram | Bale |
|--------|----------|------|
| Provider | چندگانه (Stripe, etc.) | فقط کیف پول بله |
| provider_token | از هر provider | فقط از BotFather |
| Test token | Stripe test keys | `WALLET-TEST-1111111111111111` |
| Currency | Multi-currency | فرضاً IRR |
| ShippingQuery | ✅ | ❌ حذف شده |
| refundInvoice | ✅ | ❌ وجود ندارد |
| Card-to-card | ✅ (قبلاً) | ❌ حذف شده |
| inquireTransaction | ❌ | ✅ Bale-only |
| Wallet types | N/A | شخصی/تجاری/سازمانی |
| Split transactions | ❌ | ✅ (تسهیم تراکنش) |
| Instant deposit | ❌ | ✅ |
| Auto receipt | ❌ | ✅ |
| Mini App payment | ❌ | ✅ (createInvoiceLink + openInvoice) |

#### امکانات ویژه کیف پول Bale

- سازگاری با همه کارت‌های بانکی
- استعلام تراکنش (inquireTransaction)
- برگشت تراکنش
- رسید خودکار
- واریز/برداشت آنی
- تسهیم تراکنش (Split payment)
- سه نوع کیف پول (شخصی/تجاری/سازمانی)

### D. Bale-only Methods
```typescript
// askReview: رضایت‌سنجی از کاربر
//   - متد اختصاصی Bale — در کتابخانه‌های تلگرام نیست
//   - نیاز به HTTP مستقیم
//   - اضافه شدن از آبان 1404

// inquireTransaction: استعلام تراکنش
//   - متد اختصاصی Bale
//   - نیاز به HTTP مستقیم
```

### E. Webhook Port Limitation
```typescript
// Telegram: 443, 80, 88
// Bale: 443, 88 (80 حذف شده)
```

---

## وابستگی‌ها (Dependencies)

```json
{
  "peerDependencies": {
    "n8n-workflow": "*"
  },
  "devDependencies": {
    "@n8n/node-cli": ">=0.23.0",
    "eslint": "^9.x",
    "prettier": "^3.x",
    "typescript": "^5.x",
    "release-it": "^20.x"
  }
}
```

**نکته:** هیچ dependency اضافی نیاز نیست — فقط `n8n-workflow` peer dep.

---

## Resource/Operation Matrix

| Resource | Operation | API Method | Bale Specific |
|----------|-----------|------------|---------------|
| **message** | sendMessage | sendMessage | ❌ |
| | sendPhoto | sendPhoto | ❌ |
| | sendVideo | sendVideo | ❌ |
| | sendDocument | sendDocument | ❌ |
| | sendAudio | sendAudio | ❌ |
| | sendVoice | sendVoice | ❌ |
| | sendAnimation | sendAnimation | ❌ |
| | sendSticker | sendSticker | ❌ |
| | sendLocation | sendLocation | ❌ |
| | sendContact | sendContact | ❌ |
| | sendChatAction | sendChatAction | ❌ |
| | sendMediaGroup | sendMediaGroup | ❌ |
| | editMessageText | editMessageText | ❌ |
| | editMessageCaption | editMessageCaption | ❌ |
| | editMessageReplyMarkup | editMessageReplyMarkup | ❌ |
| | deleteMessage | deleteMessage | ❌ |
| | pinChatMessage | pinChatMessage | ❌ |
| | unpinChatMessage | unpinChatMessage | ❌ |
| | unpinAllChatMessages | unpinAllChatMessages | ❌ |
| | askReview | askReview | ✅ |
| **chat** | get | getChat | ❌ |
| | getAdministrators | getChatAdministrators | ❌ |
| | getMember | getChatMember | ❌ |
| | leave | leaveChat | ❌ |
| | setDescription | setChatDescription | ❌ |
| | setTitle | setChatTitle | ❌ |
| | setPhoto | setChatPhoto | ❌ |
| | deletePhoto | deleteChatPhoto | ❌ |
| | getMembersCount | getChatMembersCount | ❌ |
| | createInviteLink | createChatInviteLink | ❌ |
| | revokeInviteLink | revokeChatInviteLink | ❌ |
| | exportInviteLink | exportChatInviteLink | ❌ |
| | banMember | banChatMember | ❌ |
| | unbanMember | unbanChatMember | ❌ |
| | promoteMember | promoteChatMember | ❌ |
| **callback** | answerQuery | answerCallbackQuery | ❌ |
| | answerInlineQuery | answerInlineQuery | ❌ |
| **file** | get | getFile | ❌ |
| **payment** | sendInvoice | sendInvoice | ✅ Bale Wallet only |
| | createInvoiceLink | createInvoiceLink | ✅ Bale Wallet only |
| | answerPreCheckoutQuery | answerPreCheckoutQuery | ✅ Bale Wallet only |
| | inquireTransaction | inquireTransaction | ✅ Bale-only |
| **sticker** | uploadFile | uploadStickerFile | ❌ |
| | createNewSet | createNewStickerSet | ❌ |
| | addToSet | addStickerToSet | ❌ |

---

## فازبندی توسعه

### فاز ۱: Foundation ✅ (این فایل)
- [x] تحقیق API Bale
- [x] تحقیق ساختار n8n Telegram node
- [x] طراحی معماری
- [x] تعیین ساختار پوشه

### فاز ۲: Core Implementation
- [ ] Scaffolding با `n8n-node` CLI
- [ ] Credential type (BaleApi.credentials.ts)
- [ ] GenericFunctions.ts (apiRequest با Bale URL)
- [ ] Bale.node.ts — sendMessage و basic operations
- [ ] BaleTrigger.node.ts — webhook mode
- [ ] آیکون SVG

### فاز ۳: Full Feature Parity
- [ ] تمام Message operations
- [ ] Chat operations
- [ ] Callback operations
- [ ] File operations
- [ ] Sticker operations
- [ ] Inline keyboard support
- [ ] Send & Wait (HITL)

### فاز ۴: Bale-Specific Features
- [ ] Payment (Bale Wallet) — sendInvoice, answerPreCheckoutQuery
- [ ] askReview method
- [ ] inquireTransaction method

### فاز ۵: Testing & Polish
- [ ] Unit tests
- [ ] Integration test با bot واقعی
- [ ] Documentation (README فارسی + انگلیسی)
- [ ] Linting

### فاز ۶: Publish
- [ ] GitHub Actions publish.yml با provenance
- [ ] Publish به npm
- [ ] Submit to n8n Creator Portal برای verification
- [ ] Community sharing

---

## الگوی کپی‌برداری از Telegram Node

```
Telegram/GenericFunctions.ts  ──copied+modified──>  Bale/GenericFunctions.ts
Telegram/Telegram.node.ts     ──copied+modified──>  Bale/Bale.node.ts
Telegram/TelegramTrigger.node.ts ──copied+modified──> Bale/BaleTrigger.node.ts
TelegramApi.credentials.ts    ──copied+modified──>  BaleApi.credentials.ts
Telegram/hitl/*               ──copied+modified──>  Bale/hitl/*
Telegram/util/*               ──copied as-is──>     Bale/util/*
```

**تغییرات اصلی در کپی:**
1. `api.telegram.org` → `api.bale.ai`
2. `telegramApi` → `baleApi` (credential name)
3. `Telegram` → `Bale` (display names)
4. `telegram.svg` → `bale.svg`
5. Payment logic → Bale Wallet only
6. اضافه کردن askReview و inquireTransaction
7. حذف توابع Telegram-specific (مثل Bot API Local mode)

---

## نکات فنی مهم

### n8n Community Node Requirements
- Package name: `n8n-nodes-bale`
- keyword: `n8n-community-node-package` در package.json
- `n8n` attribute در package.json با لیست credentials و nodes
- `@n8n/node-cli` >= 0.23.0 به عنوان devDependency
- Lint: `npm run lint`
- Build: `npm run build`
- Dev: `npm run dev`

### Bale API Notes
- فرمت توکن مشابه تلگرام
- Rate limit: مشابه تلگرام (30 req/sec)
- UTF-8 required
- Case-insensitive method names
- 2000 messages / 24 hours storage (کمتر از تلگرام)

### Send & Wait (HITL)
- از ساختار `sendAndWait` n8n استفاده می‌شود
- Webhook pattern مشابه تلگرام
- Secret token derivation برای امنیت

---

## لینک‌های مرجع

- Bale API Docs: https://docs.bale.ai/
- n8n Telegram Node: https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/Telegram/
- n8n Community Nodes: https://docs.n8n.io/integrations/community-nodes/
- n8n Starter Template: https://github.com/n8n-io/n8n-nodes-starter
- Bale BotFather: https://ble.ir/botfather
