/**
 * =============================================================================
 * MODUL UJI 6 - Rekonstruksi Data Artefak dari Request Body
 * Unit yang diuji : src/services/paper.service.js -> reconstructArtifacts(body)
 * Metode          : White Box Testing - Basis Path Testing
 *
 * Unit ini menormalkan dua format masukan yang berbeda menjadi satu struktur
 * seragam: (a) format array JSON, dan (b) format flat multipart/form-data
 * bergaya `artifacts[0][type]`.
 *
 *   Predicate node : 5
 *     N3  : IF body.artifacts ada AND Array.isArray(body.artifacts)  (majemuk)
 *     N4  : LOOP setiap elemen pada format array
 *     N6  : IF artifact.type AND artifact.sourceType                 (majemuk)
 *     N10 : LOOP setiap indeks pada format flat
 *     N12 : IF type bernilai truthy
 *   Cyclomatic Complexity V(G) = 5 + 1 = 6
 *
 *   Jalur independen:
 *     Path 6-1 : 1 -> 2 -> 3 -> 4 -> 9  -> 14          (format array, tanpa elemen)
 *     Path 6-2 : 1 -> 2 -> 3 -> 4 -> 5  -> 6 -> 7 -> 4 -> 9 -> 14 (array, elemen valid)
 *     Path 6-3 : 1 -> 2 -> 3 -> 4 -> 5  -> 6 -> 8 -> 4 -> 9 -> 14 (array, elemen dilewati)
 *     Path 6-4 : 1 -> 2 -> 3 -> 10 -> 14              (format flat, tanpa indeks)
 *     Path 6-5 : 1 -> 2 -> 3 -> 10 -> 11 -> 12 -> 13 -> 10 -> 14  (flat, indeks valid)
 *     Path 6-6 : 1 -> 2 -> 3 -> 10 -> 11 -> 12 -> 10 -> 14        (flat, indeks dilewati)
 * =============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { reconstructArtifacts } from '../../src/services/paper.service.js';
import { createSandbox } from '../helpers/doubles.js';

// Unit ini menulis jejak diagnostik ke console; dibungkam agar laporan uji bersih.
const sandbox = createSandbox();
test.before(() => sandbox.muteConsole());
test.after(() => sandbox.restoreAll());

test('MODUL 6 - Basis Path reconstructArtifacts', async (t) => {
  await t.test('Path 6-1 : format array kosong -> daftar artefak kosong', () => {
    assert.deepEqual(reconstructArtifacts({ artifacts: [] }), []);
  });

  await t.test('Path 6-2 : format array dengan elemen lengkap -> dipetakan penuh', () => {
    const hasil = reconstructArtifacts({
      artifacts: [
        { type: 'dataset', name: 'Data Latih', sourceType: 'file', value: undefined },
        { type: 'source_code', name: 'Repo', sourceType: 'link', value: 'github.com/akmal/repo' },
      ],
    });

    assert.equal(hasil.length, 2);
    assert.deepEqual(hasil[0], {
      index: 0,
      type: 'dataset',
      name: 'Data Latih',
      sourceType: 'file',
      value: undefined,
      existingId: null,
    });
    assert.deepEqual(hasil[1], {
      index: 1,
      type: 'source_code',
      name: 'Repo',
      sourceType: 'link',
      value: 'github.com/akmal/repo',
      existingId: null,
    });
  });

  await t.test('Path 6-2b : nama artefak kosong -> dinormalkan menjadi string kosong', () => {
    const hasil = reconstructArtifacts({
      artifacts: [{ type: 'dataset', sourceType: 'link', value: 'a.com' }],
    });
    assert.equal(hasil[0].name, '');
  });

  await t.test('Path 6-3a : elemen tanpa type -> dilewati (node 6 bernilai false)', () => {
    const hasil = reconstructArtifacts({
      artifacts: [
        { name: 'Tanpa Tipe', sourceType: 'link', value: 'a.com' },
        { type: 'source_code', name: 'Valid', sourceType: 'link', value: 'b.com' },
      ],
    });
    assert.equal(hasil.length, 1);
    assert.equal(hasil[0].type, 'source_code');
    assert.equal(hasil[0].index, 1, 'indeks asli harus dipertahankan');
  });

  await t.test('Path 6-3b : elemen tanpa sourceType (condition coverage N6 kanan) -> dilewati', () => {
    const hasil = reconstructArtifacts({
      artifacts: [{ type: 'dataset', name: 'Tanpa Sumber', value: 'a.com' }],
    });
    assert.deepEqual(hasil, []);
  });

  await t.test('Path 6-4a : body tanpa properti artifacts -> daftar kosong', () => {
    assert.deepEqual(reconstructArtifacts({ title: 'Paper', abstract: 'Abstrak' }), []);
    assert.deepEqual(reconstructArtifacts({}), []);
  });

  await t.test('Path 6-4b : artifacts bukan array (condition coverage N3 kanan) -> jatuh ke format flat', () => {
    // Nilai truthy namun bukan array: kondisi kiri true, kondisi kanan false.
    const hasil = reconstructArtifacts({
      artifacts: 'bukan-array',
      'artifacts[0][type]': 'dataset',
      'artifacts[0][sourceType]': 'link',
      'artifacts[0][value]': 'zenodo.org/1',
    });
    assert.equal(hasil.length, 1);
    assert.equal(hasil[0].type, 'dataset');
    assert.equal(hasil[0].sourceType, 'link');
  });

  await t.test('Path 6-5 : format flat dengan indeks valid -> dipetakan dan diurutkan', () => {
    const hasil = reconstructArtifacts({
      title: 'Paper',
      'artifacts[2][type]': 'source_code',
      'artifacts[2][name]': 'Kode',
      'artifacts[2][sourceType]': 'link',
      'artifacts[2][value]': 'github.com/akmal/repo',
      'artifacts[0][type]': 'dataset',
      'artifacts[0][name]': 'Dataset',
      'artifacts[0][sourceType]': 'file',
      'artifacts[0][existingId]': '507f1f77bcf86cd799439011',
    });

    assert.equal(hasil.length, 2);
    assert.deepEqual(
      hasil.map((a) => a.index),
      [0, 2],
      'indeks harus terurut naik'
    );
    assert.equal(hasil[0].existingId, '507f1f77bcf86cd799439011');
    assert.equal(hasil[1].existingId, null, 'existingId absen dinormalkan menjadi null');
  });

  await t.test('Path 6-6 : format flat dengan type kosong -> dilewati (node 12 bernilai false)', () => {
    const hasil = reconstructArtifacts({
      'artifacts[0][type]': '',
      'artifacts[0][sourceType]': 'link',
      'artifacts[0][value]': 'a.com',
      'artifacts[1][type]': 'source_code',
      'artifacts[1][sourceType]': 'link',
      'artifacts[1][value]': 'b.com',
    });
    assert.equal(hasil.length, 1);
    assert.equal(hasil[0].index, 1);
  });

  await t.test('Batas : kunci yang tidak cocok pola regex diabaikan seluruhnya', () => {
    const hasil = reconstructArtifacts({
      'artifacts[x][type]': 'dataset',
      'artifacts[][type]': 'dataset',
      'artifact[0][type]': 'dataset',
      'artifacts[0][typeX]': 'dataset',
    });
    assert.deepEqual(hasil, []);
  });

  await t.test('Batas : objek dengan prototipe null (hasil parser multipart) tetap terbaca', () => {
    const body = Object.create(null);
    body['artifacts[0][type]'] = 'dataset';
    body['artifacts[0][sourceType]'] = 'link';
    body['artifacts[0][value]'] = 'zenodo.org/1';

    const hasil = reconstructArtifacts(body);
    assert.equal(hasil.length, 1);
    assert.equal(hasil[0].value, 'zenodo.org/1');
  });
});
