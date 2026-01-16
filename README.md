# Aplikasi Kartu Kendali Anggaran (KKA)

Aplikasi pencatatan Kartu Kendali Anggaran dengan Next.js, PostgreSQL, dan Docker.

## Cara Menjalankan

### Dengan Docker (Recommended)
```bash
docker-compose up -d
```
Akses: http://localhost:3000

### Development Lokal
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema ke database
npm run db:push

# Seed data awal
npm run db:seed

# Jalankan development server
npm run dev
```

## Login Default
- Email: admin@kka.com
- Password: admin123

## Fitur
- Input anggaran tahunan per GL Account
- Pembagian otomatis ke 4 kuartal
- Alokasi ke 7 Regional per kuartal
- Pencatatan transaksi dengan info sisa anggaran
- Laporan dengan filter GL Account, Kuartal, Regional
