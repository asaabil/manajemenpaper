# Panduan Deployment Aplikasi Manajemen Paper dengan Docker

Dokumen ini menjelaskan cara menjalankan aplikasi (backend, frontend, dan database) menggunakan Docker dan Docker Compose.

## Prasyarat

1.  **Docker**: Pastikan Docker Engine telah terinstal di sistem Anda.
2.  **Docker Compose**: Pastikan Docker Compose telah terinstal. (Biasanya sudah termasuk dalam instalasi Docker Desktop untuk Windows dan Mac).

## Langkah-langkah Menjalankan Aplikasi

1.  **Ekstrak Proyek**: Jika proyek ini dalam format `.zip`, ekstrak terlebih dahulu.

2.  **Buka Terminal**: Buka terminal atau command prompt, lalu navigasikan ke direktori utama proyek ini (folder di mana file `docker-compose.yml` berada).

3.  **Jalankan Docker Compose**: Eksekusi perintah berikut di terminal:

    ```bash
    docker-compose up --build -d
    ```

    - `up`: Perintah untuk memulai semua layanan yang didefinisikan di `docker-compose.yml`.
    - `--build`: Memaksa Docker untuk membangun *image* dari `Dockerfile` jika belum ada atau jika ada perubahan.
    - `-d`: (Detached mode) Menjalankan kontainer di latar belakang.

4.  **Tunggu Proses Selesai**: Proses ini akan memakan waktu beberapa menit saat pertama kali dijalankan, karena perlu mengunduh *base image* dan menginstal semua dependensi.

5.  **Akses Aplikasi**: Setelah semua kontainer berjalan, aplikasi dapat diakses melalui browser di alamat berikut:

    - **Frontend**: [http://localhost:8080](http://localhost:8080)

## Perintah Berguna Lainnya

-   **Untuk menghentikan semua layanan**:
    ```bash
    docker-compose down
    ```
-   **Untuk melihat log dari semua layanan**:
    ```bash
    docker-compose logs -f
    ```
-   **Untuk melihat log layanan spesifik (misal: backend)**:
    ```bash
    docker-compose logs -f backend
    ```
