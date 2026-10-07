/**
 * =============================================================================
 * MODUL UJI 11 - Pemilihan Strategi Pencarian Paper
 * Unit yang diuji : src/services/search.service.js -> search(queryParams)
 * Metode          : White Box Testing - Basis Path Testing
 *
 * Unit ini memilih salah satu dari tiga strategi pencarian (atlas / text /
 * regex) berdasarkan konfigurasi lingkungan, lalu menyusun query beserta
 * paginasinya.
 *
 *   Predicate node : 4
 *     N3 : IF kata kunci q kosong
 *     N4 : strategy = env.searchStrategy OR 'regex'   (nilai bawaan)
 *     N5 : SWITCH strategy (3 keluaran -> menyumbang 2 predicate node)
 *   Cyclomatic Complexity V(G) = 4 + 1 = 5
 *
 *   Jalur independen:
 *     Path 11-1 : q kosong                     -> array kosong, tanpa query basis data
 *     Path 11-2 : strategy tidak dikonfigurasi -> fallback regex
 *     Path 11-3 : strategy 'atlas'             -> pipeline $search agregasi
 *     Path 11-4 : strategy 'text'              -> query $text dengan skor relevansi
 *     Path 11-5 : strategy tidak dikenal       -> fallback regex (cabang default)
 *
 * CATATAN TEMUAN: berkas src/config/env.js tidak pernah membaca variabel
 * SEARCH_STRATEGY, sehingga env.searchStrategy selalu undefined dan cabang
 * 'atlas' maupun 'text' tidak dapat dicapai pada kondisi produksi saat ini.
 * Kedua cabang tersebut diuji dengan menyuntik nilai konfigurasi secara
 * langsung agar cakupan jalur tetap terpenuhi.
 * =============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import Paper from '../../src/models/Paper.js';
import env from '../../src/config/env.js';
import { search } from '../../src/services/search.service.js';
import { createSandbox, fakeQuery } from '../helpers/doubles.js';

/**
 * @param {string|undefined} strategy nilai env.searchStrategy yang disuntikkan
 */
function setup(strategy) {
  const sandbox = createSandbox();
  sandbox.muteConsole();
  sandbox.patch(env, { searchStrategy: strategy });

  const jejak = { find: [], aggregate: [], chain: [] };
  const hasilPalsu = [{ _id: 'p1', title: 'Paper Hasil' }];

  sandbox.patch(Paper, {
    find: (...args) => {
      jejak.find.push(args);
      return fakeQuery(hasilPalsu, jejak.chain);
    },
    aggregate: async (pipeline) => {
      jejak.aggregate.push(pipeline);
      return hasilPalsu;
    },
  });

  return { sandbox, jejak, hasilPalsu };
}

/** Mengambil nilai tahap tertentu dari pipeline agregasi. */
const tahap = (pipeline, nama) => pipeline.find((s) => Object.keys(s)[0] === nama)?.[nama];

test('MODUL 11 - Basis Path search', async (t) => {
  await t.test('Path 11-1 : kata kunci kosong -> array kosong tanpa query basis data', async () => {
    const { sandbox, jejak } = setup('regex');

    assert.deepEqual(await search({ q: '' }), []);
    assert.deepEqual(await search({}), []);
    assert.deepEqual(await search({ q: undefined, page: 2 }), []);
    assert.equal(jejak.find.length, 0, 'basis data tidak boleh disentuh saat q kosong');
    assert.equal(jejak.aggregate.length, 0);
    sandbox.restoreAll();
  });

  await t.test('Path 11-2 : strategi tidak dikonfigurasi -> fallback ke regex', async () => {
    const { sandbox, jejak, hasilPalsu } = setup(undefined);

    const hasil = await search({ q: 'anomali' });

    assert.deepEqual(hasil, hasilPalsu);
    assert.equal(jejak.find.length, 1, 'harus memakai Paper.find, bukan agregasi');
    assert.equal(jejak.aggregate.length, 0);

    const [filter] = jejak.find[0];
    assert.deepEqual(Object.keys(filter), ['$or']);
    assert.equal(filter.$or.length, 5, 'pencarian mencakup 5 field');
    assert.deepEqual(
      filter.$or.map((k) => Object.keys(k)[0]),
      ['title', 'abstract', 'authors', 'keywords', 'categories']
    );
    // Regex harus case-insensitive
    assert.equal(filter.$or[0].title.flags, 'i');
    assert.ok(filter.$or[0].title.test('Deteksi ANOMALI jaringan'));
    sandbox.restoreAll();
  });

  await t.test('Path 11-3 : strategi atlas -> pipeline $search dengan fuzzy dan skor', async () => {
    const { sandbox, jejak } = setup('atlas');

    await search({ q: 'anomali', page: 3, limit: 5 });

    assert.equal(jejak.aggregate.length, 1, 'harus memakai Paper.aggregate');
    assert.equal(jejak.find.length, 0);

    const pipeline = jejak.aggregate[0];
    const search$ = tahap(pipeline, '$search');
    assert.equal(search$.index, 'default');
    assert.equal(search$.text.query, 'anomali');
    assert.deepEqual(search$.text.path, ['title', 'abstract', 'authors', 'keywords', 'categories']);
    assert.equal(search$.text.fuzzy.maxEdits, 1);
    // Paginasi: halaman 3 dengan 5 data per halaman -> lewati 10 dokumen pertama
    assert.equal(tahap(pipeline, '$skip'), 10);
    assert.equal(tahap(pipeline, '$limit'), 5);
    assert.deepEqual(tahap(pipeline, '$sort'), { score: -1 });
    sandbox.restoreAll();
  });

  await t.test('Path 11-4 : strategi text -> query $text dengan urutan skor relevansi', async () => {
    const { sandbox, jejak } = setup('text');

    await search({ q: 'anomali', page: 2, limit: 10 });

    assert.equal(jejak.find.length, 1);
    assert.equal(jejak.aggregate.length, 0);

    const [filter, projeksi] = jejak.find[0];
    assert.deepEqual(filter, { $text: { $search: 'anomali' } });
    assert.deepEqual(projeksi, { score: { $meta: 'textScore' } });

    const metode = jejak.chain.map((c) => c[0]);
    assert.deepEqual(metode, ['sort', 'skip', 'limit']);
    assert.deepEqual(jejak.chain[0][1], { score: { $meta: 'textScore' } });
    assert.equal(jejak.chain[1][1], 10, 'halaman 2 dengan limit 10 -> skip 10');
    assert.equal(jejak.chain[2][1], 10);
    sandbox.restoreAll();
  });

  await t.test('Path 11-5 : strategi tidak dikenal -> cabang default (regex)', async () => {
    const { sandbox, jejak } = setup('elasticsearch');

    await search({ q: 'sensor' });

    assert.equal(jejak.find.length, 1);
    const [filter] = jejak.find[0];
    assert.ok(filter.$or, 'harus memakai filter regex $or sebagai cabang default');
    sandbox.restoreAll();
  });

  await t.test('Batas : paginasi bawaan halaman 1 limit 10 -> skip 0', async () => {
    const { sandbox, jejak } = setup('regex');

    await search({ q: 'sensor' });

    const metode = jejak.chain.map((c) => [c[0], c[1]]);
    assert.deepEqual(metode, [
      ['skip', 0],
      ['limit', 10],
    ]);
    sandbox.restoreAll();
  });

  await t.test('Batas : parameter paginasi berupa string tetap dihitung sebagai angka', async () => {
    const { sandbox, jejak } = setup('regex');

    await search({ q: 'sensor', page: '4', limit: '25' });

    const metode = jejak.chain.map((c) => [c[0], c[1]]);
    assert.deepEqual(metode, [
      ['skip', 75],
      ['limit', 25],
    ]);
    sandbox.restoreAll();
  });
});
