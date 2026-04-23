# TIS - Tapşırıq İdarəetmə Sistemi API Sənədləşməsi

## Base URL
http://localhost:5000/api

## Authentication
Bütün sorğular (login xaric) `Authorization: Bearer <token>` header tələb edir.

---

## AUTH

### POST /auth/login
İstifadəçi girişi
```json
Request:
{
  "login": "Tural",
  "parol": "Tural123@"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "login": "Tural",
    "adSoyad": "Tural Vəlizadə",
    "rol": "Admin",
    "sonGirisTarixi": "2026-04-20 10:00:00"
  }
}
```

### POST /auth/logout
İstifadəçi çıxışı
```json
Response:
{
  "message": "Uğurla çıxış edildi"
}
```

---

## İSTİFADƏÇİLƏR

### GET /users
Bütün istifadəçiləri gətir
```json
Response:
[
  {
    "login": "vusal",
    "adSoyad": "Vüsal Seyidli",
    "rol": "İşçi",
    "sonGirisTarixi": "2026-04-20 10:00:00"
  }
]
```

### POST /users
Yeni istifadəçi yarat
```json
Request:
{
  "login": "eli",
  "parol": "Eli123@",
  "adSoyad": "Əli Məmmədov",
  "rol": "İşçi"
}

Response:
{
  "login": "eli",
  "adSoyad": "Əli Məmmədov",
  "rol": "İşçi"
}
```

### PUT /users/:login
İstifadəçini yenilə
```json
Request:
{
  "adSoyad": "Əli Məmmədov",
  "rol": "Müavin",
  "parol": "YeniParol123@"
}

Response:
{
  "login": "eli",
  "adSoyad": "Əli Məmmədov",
  "rol": "Müavin"
}
```

### DELETE /users/:login
İstifadəçini sil
```json
Response:
{
  "message": "İstifadəçi silindi"
}
```

---

## TAPŞIRIQLAR

### GET /tasks
Bütün tapşırıqları gətir
```json
Response:
[
  {
    "id": "1234567890",
    "tapsirigAdi": "Hesabat hazırla",
    "qeyd": "Aylıq hesabat",
    "veren": "Tural Vəlizadə",
    "verenLogin": "Tural",
    "deadline": "2026-04-25",
    "tarix": "2026-04-20 10:00:00",
    "tamamlanib": false,
    "tamamlanmaTarixi": null,
    "fayllar": [],
    "mesajlar": [],
    "secilmisShexsler": [
      {
        "login": "vusal",
        "adSoyad": "Vüsal Seyidli",
        "icraEdilib": false,
        "status": "gozlenir"
      }
    ]
  }
]
```

### POST /tasks
Yeni tapşırıq yarat
```json
Request:
{
  "tapsirigAdi": "Hesabat hazırla",
  "qeyd": "Aylıq hesabat",
  "veren": "Tural Vəlizadə",
  "verenLogin": "Tural",
  "deadline": "2026-04-25",
  "fayllar": [],
  "secilmisShexsler": [
    {
      "login": "vusal",
      "adSoyad": "Vüsal Seyidli",
      "icraEdilib": false,
      "status": "gozlenir"
    }
  ]
}

Response:
{
  "id": "1234567890",
  "tapsirigAdi": "Hesabat hazırla",
  ...
}
```

### PUT /tasks/:id
Tapşırığı yenilə (status, mesajlar, tamamlama və s.)
```json
Request:
{
  "tamamlanib": true,
  "tamamlanmaTarixi": "2026-04-20 15:00:00",
  "secilmisShexsler": [...],
  "mesajlar": [...]
}

Response:
{
  "id": "1234567890",
  "tamamlanib": true,
  ...
}
```

### DELETE /tasks/:id
Tapşırığı sil
```json
Response:
{
  "message": "Tapşırıq silindi"
}
```

---

## ELANLAR

### GET /elanlar
Bütün elanları gətir
```json
Response:
[
  {
    "id": "1234567890",
    "baslig": "Yeni qayda",
    "metn": "Sabahdan yeni iş saatları tətbiq olunur",
    "yaranmaTarixi": "2026-04-20 10:00:00",
    "oxuyanlar": ["vusal"],
    "alicilar": "hamisi"
  }
]
```

### POST /elanlar
Yeni elan yarat
```json
Request:
{
  "baslig": "Yeni qayda",
  "metn": "Sabahdan yeni iş saatları tətbiq olunur",
  "alicilar": "hamisi"
}

Response:
{
  "id": "1234567890",
  "baslig": "Yeni qayda",
  ...
}
```

### PUT /elanlar/:id/oxu
Elanı oxunmuş kimi işarələ
```json
Request:
{
  "login": "vusal"
}

Response:
{
  "message": "Elan oxundu"
}
```

### DELETE /elanlar/:id
Elanı sil
```json
Response:
{
  "message": "Elan silindi"
}
```

---

## AKTİVLİK JURNALI

### GET /logs
Bütün logları gətir
```json
Response:
[
  {
    "id": "1234567890",
    "tip": "giris",
    "adSoyad": "Tural Vəlizadə",
    "login": "Tural",
    "metn": "Tural Vəlizadə sistemə daxil oldu",
    "tarix": "2026-04-20 10:00:00"
  }
]
```

### POST /logs
Yeni log yarat
```json
Request:
{
  "tip": "tapsirig_yarat",
  "adSoyad": "Tural Vəlizadə",
  "login": "Tural",
  "metn": "Hesabat hazırla tapşırığını yaratdı"
}
```

Log tipləri: `giris`, `tapsirig_yarat`, `tapsirig_tamamla`, `tapsirig_redakte`, `tapsirig_sil`

---

## QEYDLƏR

### GET /notes/:login
İstifadəçinin qeydlərini gətir
```json
Response:
[
  {
    "id": "1234567890",
    "metn": "Sabah görüş",
    "notlar": "Saat 10-da",
    "tamamlanib": false,
    "yaranmaTarixi": "2026-04-20 10:00:00",
    "tarixAktiv": true,
    "saatAktiv": true,
    "tarix": "2026-04-21",
    "saat": "10:00"
  }
]
```

### POST /notes/:login
Yeni qeyd yarat
```json
Request:
{
  "metn": "Sabah görüş",
  "notlar": "",
  "tamamlanib": false
}
```

### PUT /notes/:login/:id
Qeydi yenilə
```json
Request:
{
  "metn": "Sabah görüş",
  "notlar": "Saat 10-da",
  "tamamlanib": false,
  "tarixAktiv": true,
  "tarix": "2026-04-21"
}
```

### DELETE /notes/:login/:id
Qeydi sil
```json
Response:
{
  "message": "Qeyd silindi"
}
```

---

## Xəta Formatı
Bütün xətalar bu formatda qaytarılır:
```json
{
  "message": "Xətanın təsviri"
}
```

## HTTP Status Kodları
- `200` - Uğurlu
- `201` - Yaradıldı
- `400` - Yanlış sorğu
- `401` - Giriş tələb olunur
- `403` - İcazə yoxdur
- `404` - Tapılmadı
- `500` - Server xətası