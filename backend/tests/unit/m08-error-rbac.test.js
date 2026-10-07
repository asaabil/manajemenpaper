/**
 * =============================================================================
 * MODUL UJI 12 & 13 - Penanganan Kesalahan Terpusat dan Kendali Akses Peran
 * Unit yang diuji : src/middlewares/error.js -> errorHandler(err, req, res, next)
 *                   src/middlewares/rbac.js  -> requireRoles(...roles)
 * Metode          : White Box Testing - Basis Path Testing
 *
 * MODUL 12 : errorHandler
 *   Predicate node : 4
 *     N2 : IF err.name === 'ValidationError'
 *     N4 : IF err.name === 'CastError'
 *     N6 : IF err.code === 'LIMIT_FILE_SIZE'
 *     N8 : IF err.code === 'LIMIT_UNEXPECTED_FILE'
 *   Cyclomatic Complexity V(G) = 4 + 1 = 5
 *   Jalur independen:
 *     Path 12-1 : ValidationError        -> 400 dengan pesan validasi
 *     Path 12-2 : CastError              -> 400 dengan nama field dan nilainya
 *     Path 12-3 : LIMIT_FILE_SIZE        -> 400 "File size is too large."
 *     Path 12-4 : LIMIT_UNEXPECTED_FILE  -> 400 "Unexpected file field."
 *     Path 12-5 : galat lain             -> 500 "Internal Server Error"
 *
 * MODUL 13 : requireRoles
 *   Predicate node : 1 (IF !req.user OR peran tidak termasuk daftar) (majemuk)
 *   Cyclomatic Complexity V(G) = 1 + 1 = 2
 *   Jalur independen:
 *     Path 13-1 : peran tidak memenuhi -> 403 dan next() tidak dipanggil
 *     Path 13-2 : peran memenuhi       -> next() dipanggil tanpa mengirim respons
 * =============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import errorHandler from '../../src/middlewares/error.js';
import { requireRoles } from '../../src/middlewares/rbac.js';
import { createSandbox, fakeRes } from '../helpers/doubles.js';

// errorHandler mencetak stack trace; dibungkam agar laporan uji bersih.
const sandbox = createSandbox();
test.before(() => sandbox.muteConsole());
test.after(() => sandbox.restoreAll());

test('MODUL 12 - Basis Path errorHandler', async (t) => {
  await t.test('Path 12-1 : ValidationError -> 400 dengan pesan aslinya', () => {
    const res = fakeRes();
    const err = new Error('Path `title` is required.');
    err.name = 'ValidationError';

    errorHandler(err, {}, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.message, 'Path `title` is required.');
  });

  await t.test('Path 12-2 : CastError -> 400 menyebut field dan nilai yang salah', () => {
    const res = fakeRes();
    const err = new Error('Cast to ObjectId failed');
    err.name = 'CastError';
    err.path = '_id';
    err.value = 'bukan-objectid';

    errorHandler(err, {}, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error.message, 'Invalid _id: bukan-objectid');
  });

  await t.test('Path 12-3 : LIMIT_FILE_SIZE -> 400 "File size is too large."', () => {
    const res = fakeRes();
    const err = new Error('File too large');
    err.code = 'LIMIT_FILE_SIZE';

    errorHandler(err, {}, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error.message, 'File size is too large.');
  });

  await t.test('Path 12-4 : LIMIT_UNEXPECTED_FILE -> 400 "Unexpected file field."', () => {
    const res = fakeRes();
    const err = new Error('Unexpected field');
    err.code = 'LIMIT_UNEXPECTED_FILE';

    errorHandler(err, {}, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error.message, 'Unexpected file field.');
  });

  await t.test('Path 12-5 : galat tak terduga -> 500 tanpa membocorkan detail internal', () => {
    const res = fakeRes();
    const err = new Error('getaddrinfo ENOTFOUND cluster0.mongodb.net');

    errorHandler(err, {}, res, () => {});

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error.message, 'Internal Server Error');
    assert.ok(
      !JSON.stringify(res.body).includes('mongodb.net'),
      'pesan galat internal tidak boleh dikirim ke klien'
    );
  });

  await t.test('Urutan prioritas : ValidationError diperiksa sebelum kode multer', () => {
    const res = fakeRes();
    const err = new Error('pesan validasi');
    err.name = 'ValidationError';
    err.code = 'LIMIT_FILE_SIZE'; // kedua kondisi terpenuhi

    errorHandler(err, {}, res, () => {});

    assert.equal(res.body.error.message, 'pesan validasi', 'cabang pertama harus menang');
  });
});

test('MODUL 13 - Basis Path requireRoles', async (t) => {
  await t.test('Path 13-1a : req.user tidak ada -> 403, next() tidak dipanggil', () => {
    const res = fakeRes();
    let nextDipanggil = 0;

    requireRoles('dosen', 'admin')({}, res, () => {
      nextDipanggil += 1;
    });

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error.message, 'Forbidden: You do not have the required role');
    assert.equal(nextDipanggil, 0);
  });

  await t.test('Path 13-1b : peran tidak termasuk daftar (condition coverage) -> 403', () => {
    const res = fakeRes();
    let nextDipanggil = 0;

    requireRoles('dosen', 'admin')({ user: { role: 'mahasiswa' } }, res, () => {
      nextDipanggil += 1;
    });

    assert.equal(res.statusCode, 403);
    assert.equal(nextDipanggil, 0);
  });

  await t.test('Path 13-2 : peran memenuhi -> next() dipanggil tanpa respons', () => {
    for (const role of ['dosen', 'admin']) {
      const res = fakeRes();
      let nextDipanggil = 0;

      requireRoles('dosen', 'admin')({ user: { role } }, res, () => {
        nextDipanggil += 1;
      });

      assert.equal(nextDipanggil, 1, `peran ${role} seharusnya lolos`);
      assert.equal(res.statusCode, null, 'middleware tidak boleh mengirim respons saat lolos');
    }
  });

  await t.test('Batas : daftar peran kosong menolak semua pengguna', () => {
    const res = fakeRes();
    let nextDipanggil = 0;

    requireRoles()({ user: { role: 'admin' } }, res, () => {
      nextDipanggil += 1;
    });

    assert.equal(res.statusCode, 403);
    assert.equal(nextDipanggil, 0);
  });
});
