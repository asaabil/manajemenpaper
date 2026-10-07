/**
 * =============================================================================
 * MODUL UJI 7 - Unggah Paper beserta Artefak Pendukung
 * Unit yang diuji : src/services/paper.service.js
 *                   -> createPaperWithArtifacts(body, files, user)
 * Metode          : White Box Testing - Basis Path Testing
 *
 * Unit ini merupakan proses utama sistem: memvalidasi berkas paper, menormalkan
 * metadata, menyimpan dokumen paper, lalu memproses setiap artefak pendukung
 * yang dapat berupa tautan (link) maupun berkas (file).
 *
 * Catatan abstraksi (lihat tests/WHITEBOX-TESTING.md):
 *   - Penguraian tanggal publikasi diuji terpisah sebagai MODUL 3
 *     (parseFlexibleDate) pada tests/unit/m02-metadata.test.js.
 *   - Pencarian berkas artefak beserta pemeriksaan keberadaannya diabstraksikan
 *     menjadi satu operasi pada node 13; kondisi berkas tidak ditemukan tetap
 *     tertangkap pada node 14.
 *   - Pemeriksaan `type && sourceType` diabstraksikan karena tumpang tindih
 *     dengan node 14 (lihat Temuan T-07).
 *
 *   Predicate node : 5  (node 3, 8, 10, 12, 14 pada CFG)
 *     N3  : IF berkas paper tidak ditemukan
 *     N8  : LOOP masih ada data artefak yang belum diproses
 *     N10 : IF sourceType == 'link'
 *     N12 : ELSE IF sourceType == 'file'
 *     N14 : IF data artefak lengkap (url untuk link, file untuk file)
 *
 *   Cyclomatic Complexity (tiga metode saling mengonfirmasi):
 *     V(G) = P + 1     = 5 + 1        = 6
 *     V(G) = E - N + 2 = 21 - 17 + 2  = 6
 *     V(G) = jumlah region           = 6
 *
 *   Jalur independen (CFG pada tests/cfg-upload-paper.puml).
 *   Setiap jalur diwakili tepat oleh satu skenario uji pada berkas ini:
 *     Path 1 : 1-2-3-4-17                      (berkas paper tidak ada)
 *     Path 2 : 1-2-3-5-6-7-8-17                (tanpa artefak)
 *     Path 3 : 1..8-9-10-11-14-15-8-17         (artefak link tersimpan)
 *     Path 4 : 1..8-9-10-11-14-16-8-17         (artefak link tanpa url)
 *     Path 5 : 1..8-9-10-12-13-14-15-8-17      (artefak file tersimpan)
 *     Path 6 : 1..8-9-10-12-14-16-8-17         (jenis sumber tidak dikenal)
 * =============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import Paper from '../../src/models/Paper.js';
import Artifact from '../../src/models/Artifact.js';
import { createPaperWithArtifacts } from '../../src/services/paper.service.js';
import { createSandbox, fakeFile, fakeUser } from '../helpers/doubles.js';

/**
 * Mengisolasi unit dari MongoDB dengan mengganti operasi persistensi pada
 * prototype Document. Artefak yang berhasil disimpan direkam agar dapat
 * diperiksa sebagai bukti jalur eksekusi.
 */
function setup() {
  const sandbox = createSandbox();
  sandbox.muteConsole();

  const artefakTersimpan = [];
  sandbox.patch(Paper.prototype, {
    save: async function () {
      return this;
    },
    populate: async function () {
      return this;
    },
  });
  sandbox.patch(Artifact.prototype, {
    save: async function () {
      artefakTersimpan.push(this);
      return this;
    },
  });

  return { sandbox, artefakTersimpan };
}

const bodyDasar = {
  title: 'Deteksi Anomali pada Jaringan Sensor',
  abstract: 'Penelitian ini membahas deteksi anomali.',
  authors: 'Akmal, Budi',
  institution: 'Universitas Brawijaya',
  keywords: 'anomali, sensor',
  categories: 'Jaringan, Machine Learning',
  isPublic: 'true',
};

const berkasPaper = () =>
  fakeFile('paperFile', {
    path: 'uploads/papers/paperFile-1.pdf',
    filename: 'paperFile-1.pdf',
    mimetype: 'application/pdf',
    size: 204800,
  });

test('Pengujian Unit Basis Path createPaperWithArtifacts', async (t) => {
  await t.test('Path 1 : berkas paper tidak dilampirkan -> Error "Paper file is required."', async () => {
    const { sandbox } = setup();
    await assert.rejects(
      () => createPaperWithArtifacts(bodyDasar, [fakeFile('artifacts[0][value]')], fakeUser()),
      /Paper file is required\./
    );
    sandbox.restoreAll();
  });

  await t.test('Path 2 : tanpa artefak -> paper tersimpan dengan metadata ternormalisasi', async () => {
    const { sandbox, artefakTersimpan } = setup();
    const user = fakeUser({ role: 'dosen' });

    const hasil = await createPaperWithArtifacts(
      { ...bodyDasar, publicationDate: '2025-03-17' },
      [berkasPaper()],
      user
    );

    assert.equal(hasil.owner.toString(), user._id.toString());
    assert.equal(hasil.isPublic, true, 'string true harus dikonversi menjadi boolean true');
    assert.deepEqual([...hasil.authors], ['Akmal', 'Budi']);
    assert.deepEqual([...hasil.keywords], ['anomali', 'sensor']);
    assert.deepEqual([...hasil.categories], ['Jaringan', 'Machine Learning']);
    assert.equal(hasil.file.path, 'uploads/papers/paperFile-1.pdf');
    assert.equal(hasil.file.size, 204800);
    assert.equal(hasil.publicationDate.getUTCFullYear(), 2025);
    assert.deepEqual(hasil.artifacts, []);
    assert.equal(artefakTersimpan.length, 0);
    sandbox.restoreAll();
  });

  await t.test('Path 3 : artefak bertipe link -> tersimpan dengan URL ternormalisasi', async () => {
    const { sandbox, artefakTersimpan } = setup();
    const hasil = await createPaperWithArtifacts(
      {
        ...bodyDasar,
        artifacts: [
          { type: 'source_code', name: 'Repositori', sourceType: 'link', value: 'github.com/akmal/repo' },
        ],
      },
      [berkasPaper()],
      fakeUser({ role: 'dosen' })
    );

    assert.equal(artefakTersimpan.length, 1);
    assert.equal(hasil.artifacts.length, 1);
    assert.equal(artefakTersimpan[0].sourceType, 'link');
    assert.equal(artefakTersimpan[0].url, 'https://github.com/akmal/repo');
    assert.equal(artefakTersimpan[0].file.path, undefined, 'artefak link tidak boleh membawa data berkas');
    assert.equal(artefakTersimpan[0].paper.toString(), hasil._id.toString());
    sandbox.restoreAll();
  });

  await t.test('Path 4 : artefak link tanpa nilai URL -> dilewati, paper tetap tersimpan', async () => {
    const { sandbox, artefakTersimpan } = setup();
    const hasil = await createPaperWithArtifacts(
      {
        ...bodyDasar,
        artifacts: [{ type: 'source_code', name: 'Repositori', sourceType: 'link', value: '' }],
      },
      [berkasPaper()],
      fakeUser({ role: 'dosen' })
    );

    assert.equal(artefakTersimpan.length, 0);
    assert.deepEqual(hasil.artifacts, []);
    assert.ok(hasil._id, 'kegagalan artefak tidak boleh membatalkan penyimpanan paper');
    sandbox.restoreAll();
  });

  await t.test('Path 5 : artefak bertipe file dengan berkas terlampir -> tersimpan', async () => {
    const { sandbox, artefakTersimpan } = setup();
    const berkasArtefak = fakeFile('artifacts[0][value]', {
      path: 'uploads/artifacts/artifacts0value-1.csv',
      filename: 'artifacts0value-1.csv',
      mimetype: 'text/csv',
      size: 4096,
    });

    await createPaperWithArtifacts(
      {
        ...bodyDasar,
        artifacts: [{ type: 'dataset', name: 'Data Latih', sourceType: 'file' }],
      },
      [berkasPaper(), berkasArtefak],
      fakeUser({ role: 'dosen' })
    );

    assert.equal(artefakTersimpan.length, 1);
    assert.equal(artefakTersimpan[0].sourceType, 'file');
    assert.equal(artefakTersimpan[0].file.path, 'uploads/artifacts/artifacts0value-1.csv');
    assert.equal(artefakTersimpan[0].file.mimetype, 'text/csv');
    assert.equal(artefakTersimpan[0].file.size, 4096);
    assert.equal(artefakTersimpan[0].url, undefined);
    sandbox.restoreAll();
  });

  await t.test('Path 6 : jenis sumber tidak dikenal -> dilewati pada pemeriksaan kelengkapan data', async () => {
    const { sandbox, artefakTersimpan } = setup();
    await createPaperWithArtifacts(
      {
        ...bodyDasar,
        artifacts: [{ type: 'other', name: 'Catatan', sourceType: 'text', value: 'isi catatan' }],
      },
      [berkasPaper()],
      fakeUser({ role: 'dosen' })
    );

    assert.equal(artefakTersimpan.length, 0);
    sandbox.restoreAll();
  });
});
