/**
 * =============================================================================
 * MODUL UJI 3, 4, 5 - Normalisasi Metadata Paper
 * Unit yang diuji : src/services/paper.service.js
 *                   -> parseFlexibleDate(dateString)
 *                   -> toArray(value)
 *                   -> normalizeUrl(url)
 * Metode          : White Box Testing - Basis Path Testing
 *
 * MODUL 3 : parseFlexibleDate
 *   Predicate node : 5
 *     N2 : IF !dateString OR typeof dateString !== 'string'   (majemuk)
 *     N4 : IF cocok pola /^\d{4}-\d{2}-\d{2}$/
 *     N6 : IF !isNaN(date)                                    (validasi pola 1)
 *     N8 : IF cocok pola /^\d{4}$/
 *     N10: IF !isNaN(date)                                    (validasi pola 2)
 *   Cyclomatic Complexity V(G) = 5 + 1 = 6
 *   Jalur independen:
 *     Path 3-1 : 1 -> 2 -> 3  -> 13                 (masukan kosong / bukan string)
 *     Path 3-2 : 1 -> 2 -> 4  -> 5 -> 6 -> 7 -> 13  (format YYYY-MM-DD valid)
 *     Path 3-3 : 1 -> 2 -> 4  -> 5 -> 6 -> 8 -> 12 -> 13 (pola cocok, tanggal invalid)
 *     Path 3-4 : 1 -> 2 -> 4  -> 8 -> 9 -> 10 -> 11 -> 13  (format YYYY valid)
 *     Path 3-5 : 1 -> 2 -> 4  -> 8 -> 12 -> 13      (format tidak dikenal)
 *     Path 3-6 : 1 -> 2 -> 4  -> 8 -> 9 -> 10 -> 12 -> 13  (INFEASIBLE, lihat catatan)
 *   Catatan: Path 3-6 tidak dapat dieksekusi (infeasible path) karena setiap
 *   string 4 digit selalu menghasilkan objek Date yang valid, sehingga cabang
 *   isNaN pada node 10 merupakan defensive code yang tidak pernah bernilai true.
 *
 * MODUL 4 : toArray
 *   Predicate node : 2 (IF Array.isArray, IF typeof string AND trim !== '')
 *   Cyclomatic Complexity V(G) = 2 + 1 = 3
 *
 * MODUL 5 : normalizeUrl
 *   Predicate node : 2 (IF !url, IF tidak berawalan http/https)
 *   Cyclomatic Complexity V(G) = 2 + 1 = 3
 * =============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { parseFlexibleDate, toArray, normalizeUrl } from '../../src/services/paper.service.js';

test('MODUL 3 - Basis Path parseFlexibleDate', async (t) => {
  await t.test('Path 3-1a : masukan null -> null', () => {
    assert.equal(parseFlexibleDate(null), null);
    assert.equal(parseFlexibleDate(undefined), null);
    assert.equal(parseFlexibleDate(''), null);
  });

  await t.test('Path 3-1b : masukan bukan string (condition coverage N2 kanan) -> null', () => {
    assert.equal(parseFlexibleDate(2025), null);
    assert.equal(parseFlexibleDate(new Date()), null);
    assert.equal(parseFlexibleDate(['2025-01-01']), null);
  });

  await t.test('Path 3-2 : format YYYY-MM-DD valid -> objek Date (semantik UTC)', () => {
    const hasil = parseFlexibleDate('2025-03-17');
    assert.ok(hasil instanceof Date);
    // Bentuk date-only pada spesifikasi ECMAScript diurai sebagai tengah malam UTC
    assert.equal(hasil.getUTCFullYear(), 2025);
    assert.equal(hasil.getUTCMonth(), 2);
    assert.equal(hasil.getUTCDate(), 17);
  });

  await t.test('Path 3-3 : pola YYYY-MM-DD cocok tetapi tanggal invalid -> null', () => {
    // '2025-13-45' lolos pengujian regex namun menghasilkan Invalid Date,
    // sehingga eksekusi jatuh ke cabang isNaN pada node 6.
    assert.equal(parseFlexibleDate('2025-13-45'), null);
    assert.equal(parseFlexibleDate('2025-00-00'), null);
  });

  await t.test('Path 3-4 : format YYYY valid -> 1 Januari tahun tersebut (semantik lokal)', () => {
    const hasil = parseFlexibleDate('2025');
    assert.ok(hasil instanceof Date);
    // Bentuk date-time tanpa offset diurai sebagai waktu lokal
    assert.equal(hasil.getFullYear(), 2025);
    assert.equal(hasil.getMonth(), 0);
    assert.equal(hasil.getDate(), 1);
  });

  await t.test('Path 3-5 : format tidak dikenal -> null', () => {
    assert.equal(parseFlexibleDate('17 Maret 2025'), null);
    assert.equal(parseFlexibleDate('17/03/2025'), null);
    assert.equal(parseFlexibleDate('2025-3-7'), null);
    assert.equal(parseFlexibleDate('25'), null);
  });
});

test('MODUL 4 - Basis Path toArray', async (t) => {
  await t.test('Path 4-1 : masukan sudah berupa array -> dikembalikan apa adanya', () => {
    const masukan = ['Akmal', 'Budi'];
    assert.equal(toArray(masukan), masukan, 'harus referensi array yang sama');
  });

  await t.test('Path 4-2 : string dipisah koma -> array ter-trim', () => {
    assert.deepEqual(toArray('Akmal, Budi ,  Citra'), ['Akmal', 'Budi', 'Citra']);
    assert.deepEqual(toArray('SatuNilai'), ['SatuNilai']);
  });

  await t.test('Path 4-3 : string kosong / spasi (condition coverage) -> array kosong', () => {
    assert.deepEqual(toArray(''), []);
    assert.deepEqual(toArray('   '), []);
  });

  await t.test('Path 4-3b : masukan bukan string dan bukan array -> array kosong', () => {
    assert.deepEqual(toArray(undefined), []);
    assert.deepEqual(toArray(null), []);
    assert.deepEqual(toArray(2025), []);
  });
});

test('MODUL 5 - Basis Path normalizeUrl', async (t) => {
  await t.test('Path 5-1 : nilai kosong -> dikembalikan apa adanya', () => {
    assert.equal(normalizeUrl(''), '');
    assert.equal(normalizeUrl(undefined), undefined);
    assert.equal(normalizeUrl(null), null);
  });

  await t.test('Path 5-2 : tanpa protokol -> diberi awalan https://', () => {
    assert.equal(normalizeUrl('github.com/akmal/repo'), 'https://github.com/akmal/repo');
    assert.equal(normalizeUrl('zenodo.org/record/123'), 'https://zenodo.org/record/123');
  });

  await t.test('Path 5-3 : sudah berprotokol -> tidak diubah', () => {
    assert.equal(normalizeUrl('https://github.com/akmal/repo'), 'https://github.com/akmal/repo');
    assert.equal(normalizeUrl('http://example.com'), 'http://example.com');
    assert.equal(normalizeUrl('HTTPS://EXAMPLE.COM'), 'HTTPS://EXAMPLE.COM');
  });
});
