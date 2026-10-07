/**
 * =============================================================================
 * MODUL UJI 9 & 10 - Kendali Visibilitas Reading List Berbasis Peran
 * Unit yang diuji : src/services/readingList.service.js
 *                   -> createReadingList(listData, user)
 *                   -> updateReadingList(id, listData, user)
 * Metode          : White Box Testing - Basis Path Testing
 *
 * Aturan bisnis yang diuji: hanya pengguna dengan peran 'dosen' atau 'admin'
 * yang boleh membuat reading list publik. Peran 'mahasiswa' selalu dipaksa
 * menjadi privat, sekalipun request mengirim isPublic bernilai true.
 *
 * MODUL 9 : createReadingList
 *   Predicate node : 3
 *     N2 : requestedPublic = (isPublic === true OR isPublic === 'true')  (majemuk)
 *     N3 : canBePublic     = (role === 'dosen' OR role === 'admin')      (majemuk)
 *     N4 : finalIsPublic   = canBePublic ? requestedPublic : false
 *   Cyclomatic Complexity V(G) = 3 + 1 = 4
 *   Jalur independen:
 *     Path 9-1 : dosen/admin + minta publik  -> tersimpan publik
 *     Path 9-2 : dosen/admin + minta privat  -> tersimpan privat
 *     Path 9-3 : mahasiswa  + minta publik   -> DIPAKSA privat
 *     Path 9-4 : mahasiswa  + minta privat   -> tersimpan privat
 *
 * MODUL 10 : updateReadingList
 *   Predicate node : 6
 *     N3  : IF reading list tidak ditemukan
 *     N5  : IF bukan pemilik
 *     N7  : IF listData.isPublic !== undefined
 *     N8  : requestedPublic (majemuk)
 *     N9  : canBePublic (majemuk)
 *     N10 : finalIsPublic (ternary)
 *   Cyclomatic Complexity V(G) = 6 + 1 = 7
 * =============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import ReadingList from '../../src/models/ReadingList.js';
import { createReadingList, updateReadingList } from '../../src/services/readingList.service.js';
import { createSandbox, fakeUser, newId } from '../helpers/doubles.js';

/** Menyadap ReadingList.create dan mengembalikan payload yang diterima. */
function setupCreate() {
  const sandbox = createSandbox();
  const jejak = { payload: null };
  sandbox.patch(ReadingList, {
    create: async (payload) => {
      jejak.payload = payload;
      return { _id: newId(), ...payload };
    },
  });
  return { sandbox, jejak };
}

/** Menyadap ReadingList.findById dengan dokumen palsu yang merekam save(). */
function setupUpdate(doc) {
  const sandbox = createSandbox();
  sandbox.patch(ReadingList, { findById: async () => doc });
  return { sandbox };
}

function fakeListDoc(ownerId) {
  const doc = {
    _id: newId(),
    owner: ownerId,
    name: 'Daftar Bacaan Lama',
    description: 'Deskripsi lama',
    isPublic: false,
    items: [],
    saveCalled: 0,
  };
  doc.save = async () => {
    doc.saveCalled += 1;
    return doc;
  };
  return doc;
}

test('MODUL 9 - Basis Path createReadingList', async (t) => {
  await t.test('Path 9-1 : dosen meminta publik -> tersimpan publik', async () => {
    const { sandbox, jejak } = setupCreate();
    const user = fakeUser({ role: 'dosen' });

    const hasil = await createReadingList(
      { name: 'Referensi Skripsi', description: 'Kumpulan paper', isPublic: true },
      user
    );

    assert.equal(hasil.isPublic, true);
    assert.equal(jejak.payload.owner, user._id);
    assert.equal(jejak.payload.name, 'Referensi Skripsi');
    sandbox.restoreAll();
  });

  await t.test('Path 9-1b : admin meminta publik dengan string "true" -> tersimpan publik', async () => {
    const { sandbox } = setupCreate();
    // Body multipart/form-data mengirim boolean sebagai string; kondisi kanan
    // pada node 2 yang menangani kasus ini.
    const hasil = await createReadingList({ name: 'Kurasi Admin', isPublic: 'true' }, fakeUser({ role: 'admin' }));
    assert.equal(hasil.isPublic, true);
    sandbox.restoreAll();
  });

  await t.test('Path 9-2 : dosen meminta privat -> tersimpan privat', async () => {
    const { sandbox } = setupCreate();
    const hasil = await createReadingList({ name: 'Draft Pribadi', isPublic: false }, fakeUser({ role: 'dosen' }));
    assert.equal(hasil.isPublic, false);
    sandbox.restoreAll();
  });

  await t.test('Path 9-3 : mahasiswa meminta publik -> DIPAKSA menjadi privat', async () => {
    const { sandbox, jejak } = setupCreate();

    const hasil = await createReadingList(
      { name: 'Bacaan Kuliah', isPublic: true },
      fakeUser({ role: 'mahasiswa' })
    );

    assert.equal(hasil.isPublic, false, 'mahasiswa tidak berhak membuat daftar publik');
    assert.equal(jejak.payload.isPublic, false, 'nilai yang dikirim ke basis data harus sudah dipaksa false');
    sandbox.restoreAll();
  });

  await t.test('Path 9-3b : mahasiswa meminta publik via string "true" -> DIPAKSA privat', async () => {
    const { sandbox } = setupCreate();
    const hasil = await createReadingList({ name: 'Bacaan', isPublic: 'true' }, fakeUser({ role: 'mahasiswa' }));
    assert.equal(hasil.isPublic, false);
    sandbox.restoreAll();
  });

  await t.test('Path 9-4 : mahasiswa meminta privat / tanpa isPublic -> tersimpan privat', async () => {
    const { sandbox } = setupCreate();
    const mahasiswa = fakeUser({ role: 'mahasiswa' });

    assert.equal((await createReadingList({ name: 'A', isPublic: false }, mahasiswa)).isPublic, false);
    assert.equal((await createReadingList({ name: 'B' }, mahasiswa)).isPublic, false);
    // Nilai truthy yang bukan true / 'true' tetap dianggap permintaan privat
    assert.equal((await createReadingList({ name: 'C', isPublic: 'yes' }, mahasiswa)).isPublic, false);
    sandbox.restoreAll();
  });
});

test('MODUL 10 - Basis Path updateReadingList', async (t) => {
  await t.test('Path 10-1 : reading list tidak ditemukan -> Error "Reading list not found"', async () => {
    const { sandbox } = setupUpdate(null);
    await assert.rejects(
      () => updateReadingList(newId(), { name: 'Baru' }, fakeUser({ role: 'dosen' })),
      /Reading list not found/
    );
    sandbox.restoreAll();
  });

  await t.test('Path 10-2 : bukan pemilik -> Error "Not authorized"', async () => {
    const doc = fakeListDoc(newId());
    const { sandbox } = setupUpdate(doc);

    await assert.rejects(
      () => updateReadingList(doc._id, { name: 'Baru' }, fakeUser({ role: 'dosen' })),
      /Not authorized to update this reading list/
    );
    assert.equal(doc.saveCalled, 0, 'dokumen tidak boleh disimpan saat otorisasi gagal');
    sandbox.restoreAll();
  });

  await t.test('Path 10-3 : isPublic tidak dikirim -> visibilitas tidak berubah', async () => {
    const pemilik = newId();
    const doc = fakeListDoc(pemilik);
    doc.isPublic = true;
    const { sandbox } = setupUpdate(doc);

    const hasil = await updateReadingList(
      doc._id,
      { name: 'Nama Baru', description: 'Deskripsi baru' },
      fakeUser({ id: pemilik, role: 'dosen' })
    );

    assert.equal(hasil.name, 'Nama Baru');
    assert.equal(hasil.description, 'Deskripsi baru');
    assert.equal(hasil.isPublic, true, 'visibilitas lama harus dipertahankan');
    assert.equal(doc.saveCalled, 1);
    sandbox.restoreAll();
  });

  await t.test('Path 10-4 : pemilik dosen mengubah menjadi publik -> diizinkan', async () => {
    const pemilik = newId();
    const doc = fakeListDoc(pemilik);
    const { sandbox } = setupUpdate(doc);

    const hasil = await updateReadingList(doc._id, { isPublic: true }, fakeUser({ id: pemilik, role: 'dosen' }));
    assert.equal(hasil.isPublic, true);
    sandbox.restoreAll();
  });

  await t.test('Path 10-5 : pemilik dosen mengubah menjadi privat -> diizinkan', async () => {
    const pemilik = newId();
    const doc = fakeListDoc(pemilik);
    doc.isPublic = true;
    const { sandbox } = setupUpdate(doc);

    const hasil = await updateReadingList(doc._id, { isPublic: false }, fakeUser({ id: pemilik, role: 'dosen' }));
    assert.equal(hasil.isPublic, false);
    sandbox.restoreAll();
  });

  await t.test('Path 10-6 : pemilik mahasiswa mengubah menjadi publik -> DIPAKSA privat', async () => {
    const pemilik = newId();
    const doc = fakeListDoc(pemilik);
    const { sandbox } = setupUpdate(doc);

    const hasil = await updateReadingList(
      doc._id,
      { isPublic: true },
      fakeUser({ id: pemilik, role: 'mahasiswa' })
    );

    assert.equal(hasil.isPublic, false, 'eskalasi visibilitas oleh mahasiswa harus ditolak');
    sandbox.restoreAll();
  });

  await t.test('Path 10-7 : pemilik admin dengan string "true" -> menjadi publik', async () => {
    const pemilik = newId();
    const doc = fakeListDoc(pemilik);
    const { sandbox } = setupUpdate(doc);

    const hasil = await updateReadingList(doc._id, { isPublic: 'true' }, fakeUser({ id: pemilik, role: 'admin' }));
    assert.equal(hasil.isPublic, true);
    sandbox.restoreAll();
  });
});
