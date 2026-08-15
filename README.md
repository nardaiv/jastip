# Jastip

## Deskripsi
Platform untuk mempermudah proses jasa penitipan pembelian barang. Dengan memanfaatkan, web application untuk membantu dalam proses pencarian dan request barang yang ingin dititip untuk dibelikan oleh pihak yang sedang berada di negara lain. Pihak yang ingin menitip barang disebut sebagai `buyer`. Sedangkan pihak yang menerima request ini adalah `seller` atau juga bisa disebut sebagai shopper. Terdapat pula pihak `admin` yang dapat memantau website secara keseluruhan.


## Techstack
* Framework : Next.js 16, React 19, TypeScript
* Styling & UI: Tailwind CSS v4, shadcn/ui, Lucide React
* Backend & Auth: Supabase
* State & Validasi Zustand, Zod
* Fitur & Library Recharts (chart), Nodemailer (email), Fuse.js (search)
* Integrasi Eksternal: Frankfurter API (kurs mata uang)


## Kontribusi

| Anggota   | Pembagian Tugas   |
| :------------ | :------------: |
|  Faachir |  Membuat page untuk create trip dan merepons request buyer bagi role seller & integrasi dengan API currency frankfurt.dev |
| Hanif  | Membuat  page untuk creating request, list trip bagi role buyer  |
|  Narda |  Membuat dashboard admin dan integrasi notifikasi & shipping |
