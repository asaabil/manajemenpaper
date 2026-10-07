/**
 * =============================================================================
 * MODUL UJI 8 - Hapus Paper beserta Artefak dan Berkas Fisiknya
 * Unit yang diuji : src/services/paper.service.js -> deletePaper(id, user)
 * Metode          : White Box Testing - Basis Path Testing
 *
 * Unit ini memeriksa keberadaan paper, memvalidasi hak akses pengguna, lalu
 * membersihkan berkas fisik artefak dan berkas paper sebelum menghapus
 * dokumennya dari basis data.
 *
 *   Predicate node : 5
 *     N3  : IF paper tidak ditemukan
 *     N5  : IF bukan pemilik AND bukan admin                         (majemuk)
 *     N7  : LOOP setiap artefak milik paper
 *     N8  : IF sourceType == 'file' AND file ada AND file.path ada   (majemuk)
 *     N12 : IF paper.file ada AND paper.file.path ada                (majemuk)
 *   Cyclomatic Complexity V(G) = 5 + 1 = 6
 *
 *   Jalur independen:
 *     Path 8-1 : 1 -> 2 -> 3 -> 4 -> 15                       (paper tidak ditemukan)
 *     Path 8-2 : 1 -> 2 -> 3 -> 5 -> 6 -> 15                  (tidak berwenang)
 *     Path 8-3 : ... -> 5 -> 7 -> 10 -> 11 -> 12 -> 13 -> 14  (tanpa artefak, berkas paper dihapus)
 *     Path 8-4 : ... -> 7 -> 8 -> 9 -> 7 -> 10 -> ...         (artefak file: berkas dihapus)
 *     Path 8-5 : ... -> 7 -> 8 -> 7 -> 10 -> ...              (artefak link: tidak ada berkas)
 *     Path 8-6 : ... -> 11 -> 12 -> 14                        (paper tanpa berkas fisik)
 * =============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import Paper from '../../src/models/Paper.js';
import Artifact from '../../src/models/Artifact.js';
import { deletePaper } from '../../src/services/paper.service.js';
import {
  createSandbox,
  fakeArtifactDoc,
  fakePaperDoc,
  fakeUser,
  newId,
} from '../helpers/doubles.js';

/**
 * @param {object|null} paperDoc dokumen paper yang akan dikembalikan findById
 * @param {Array}       artifacts daftar artefak milik paper tersebut
 */
function setup(paperDoc, artifacts = []) {
  const sandbox = createSandbox();
  sandbox.muteConsole();
  const berkasTerhapus = sandbox.spyUnlink();
  const jejak = { deleteManyDipanggil: 0 };

  sandbox.patch(Paper, { findById: async () => paperDoc });
  sandbox.patch(Artifact, {
    find: async () => artifacts,
    deleteMany: async () => {
      jejak.deleteManyDipanggil += 1;
      return { deletedCount: artifacts.length };
    },
  });

  return { sandbox, berkasTerhapus, jejak };
}

test('MODUL 8 - Basis Path deletePaper', async (t) => {
  await t.test('Path 8-1 : paper tidak ditemukan -> Error "Paper not found"', async () => {
    const { sandbox, berkasTerhapus, jejak } = setup(null);

    await assert.rejects(() => deletePaper(newId(), fakeUser({ role: 'dosen' })), /Paper not found/);
    assert.deepEqual(berkasTerhapus, [], 'tidak boleh ada berkas yang dihapus');
    assert.equal(jejak.deleteManyDipanggil, 0);
    sandbox.restoreAll();
  });

  await t.test('Path 8-2 : bukan pemilik dan bukan admin -> Error "Not authorized"', async () => {
    const pemilik = newId();
    const paper = fakePaperDoc({ ownerId: pemilik });
    const { sandbox, berkasTerhapus, jejak } = setup(paper, [fakeArtifactDoc()]);

    await assert.rejects(
      () => deletePaper(paper._id, fakeUser({ role: 'dosen' })), // id pengguna berbeda
      /Not authorized to delete this paper/
    );
    assert.equal(paper.deleteOneCalled, 0, 'dokumen paper tidak boleh dihapus');
    assert.deepEqual(berkasTerhapus, [], 'berkas fisik tidak boleh disentuh');
    assert.equal(jejak.deleteManyDipanggil, 0);
    sandbox.restoreAll();
  });

  await t.test('Path 8-3 : pemilik, tanpa artefak -> berkas paper dan dokumen dihapus', async () => {
    const pemilik = newId();
    const paper = fakePaperDoc({ ownerId: pemilik, filePath: 'uploads/papers/paperFile-9.pdf' });
    const { sandbox, berkasTerhapus, jejak } = setup(paper, []);

    const hasil = await deletePaper(paper._id, fakeUser({ id: pemilik, role: 'dosen' }));

    assert.equal(hasil, paper);
    assert.deepEqual(berkasTerhapus, ['uploads/papers/paperFile-9.pdf']);
    assert.equal(jejak.deleteManyDipanggil, 1);
    assert.equal(paper.deleteOneCalled, 1);
    sandbox.restoreAll();
  });

  await t.test('Path 8-4 : artefak bertipe file -> berkas artefak ikut dihapus', async () => {
    const pemilik = newId();
    const paper = fakePaperDoc({ ownerId: pemilik, filePath: 'uploads/papers/p.pdf' });
    const artefak = [
      fakeArtifactDoc({ sourceType: 'file', filePath: 'uploads/artifacts/a1.csv' }),
      fakeArtifactDoc({ sourceType: 'file', filePath: 'uploads/artifacts/a2.zip' }),
    ];
    const { sandbox, berkasTerhapus, jejak } = setup(paper, artefak);

    await deletePaper(paper._id, fakeUser({ id: pemilik, role: 'dosen' }));

    assert.deepEqual(berkasTerhapus, [
      'uploads/artifacts/a1.csv',
      'uploads/artifacts/a2.zip',
      'uploads/papers/p.pdf',
    ]);
    assert.equal(jejak.deleteManyDipanggil, 1);
    assert.equal(paper.deleteOneCalled, 1);
    sandbox.restoreAll();
  });

  await t.test('Path 8-5 : artefak bertipe link -> tidak ada berkas artefak yang dihapus', async () => {
    const pemilik = newId();
    const paper = fakePaperDoc({ ownerId: pemilik, filePath: 'uploads/papers/p.pdf' });
    const { sandbox, berkasTerhapus, jejak } = setup(paper, [
      fakeArtifactDoc({ sourceType: 'link' }),
    ]);

    await deletePaper(paper._id, fakeUser({ id: pemilik, role: 'dosen' }));

    assert.deepEqual(berkasTerhapus, ['uploads/papers/p.pdf']);
    assert.equal(jejak.deleteManyDipanggil, 1, 'dokumen artefak tetap harus dihapus dari basis data');
    sandbox.restoreAll();
  });

  await t.test('Path 8-5b : artefak file tanpa metadata berkas (condition coverage N8) -> dilewati', async () => {
    const pemilik = newId();
    const paper = fakePaperDoc({ ownerId: pemilik, filePath: 'uploads/papers/p.pdf' });
    const artefakRusak = fakeArtifactDoc({ sourceType: 'file', filePath: null });
    const { sandbox, berkasTerhapus } = setup(paper, [artefakRusak]);

    await deletePaper(paper._id, fakeUser({ id: pemilik, role: 'dosen' }));

    assert.deepEqual(berkasTerhapus, ['uploads/papers/p.pdf']);
    sandbox.restoreAll();
  });

  await t.test('Path 8-6 : admin bukan pemilik dan paper tanpa berkas -> tetap terhapus', async () => {
    const paper = fakePaperDoc({ ownerId: newId(), filePath: null });
    const { sandbox, berkasTerhapus, jejak } = setup(paper, []);

    await deletePaper(paper._id, fakeUser({ role: 'admin' }));

    assert.deepEqual(berkasTerhapus, [], 'tidak ada berkas fisik untuk dihapus');
    assert.equal(jejak.deleteManyDipanggil, 1);
    assert.equal(paper.deleteOneCalled, 1, 'admin berwenang menghapus paper milik pengguna lain');
    sandbox.restoreAll();
  });
});
