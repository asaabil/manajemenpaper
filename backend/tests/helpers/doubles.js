/**
 * Test doubles (stub & spy) untuk Pengujian Unit White Box.
 *
 * Tujuan berkas ini adalah mengisolasi unit yang diuji dari dependensi
 * eksternal (MongoDB dan file system), sehingga pengujian murni menelusuri
 * alur logika (jalur independen) pada kode sumber yang sebenarnya.
 *
 * Teknik yang dipakai: mengganti method statis pada Mongoose Model dan
 * method pada prototype Document, lalu memulihkannya kembali setelah
 * pengujian selesai. Dengan cara ini kode sumber di src/ tidak perlu diubah.
 */

import mongoose from 'mongoose';
import fs from 'fs';

/** Membuat ObjectId baru (dipakai sebagai id palsu yang tetap valid). */
export const newId = () => new mongoose.Types.ObjectId();

/**
 * Mengganti sekumpulan properti pada sebuah objek (Model / prototype / fs)
 * dan mengembalikan fungsi untuk memulihkan kondisi semula.
 */
export function patch(target, replacements) {
  const originals = new Map();
  for (const [key, value] of Object.entries(replacements)) {
    originals.set(key, Object.getOwnPropertyDescriptor(target, key));
    target[key] = value;
  }
  return function restore() {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(target, key, descriptor);
      else delete target[key];
    }
  };
}

/** Kumpulan restore-function agar pemulihan bisa dilakukan sekaligus. */
export function createSandbox() {
  const restores = [];
  return {
    patch(target, replacements) {
      restores.push(patch(target, replacements));
    },
    /** Membungkam console.log/console.error agar keluaran pengujian bersih. */
    muteConsole() {
      restores.push(patch(console, { log: () => {}, error: () => {} }));
    },
    /**
     * Mengganti fs.unlink dengan spy in-memory.
     * @returns {string[]} daftar path yang diminta untuk dihapus
     */
    spyUnlink() {
      const deleted = [];
      restores.push(
        patch(fs, {
          unlink: (targetPath, cb) => {
            deleted.push(targetPath);
            if (typeof cb === 'function') cb(null);
          },
        })
      );
      return deleted;
    },
    restoreAll() {
      while (restores.length) restores.pop()();
    },
  };
}

/** Objek `res` Express palsu yang merekam status dan body JSON. */
export function fakeRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
}

/** Objek `req.user` palsu hasil autentikasi. */
export function fakeUser({ id = newId(), role = 'mahasiswa' } = {}) {
  return { _id: id, role };
}

/** Objek file hasil multer palsu. */
export function fakeFile(fieldname, overrides = {}) {
  return {
    fieldname,
    path: `uploads/${fieldname.replace(/\[|\]/g, '')}.bin`,
    filename: `${fieldname.replace(/\[|\]/g, '')}.bin`,
    mimetype: 'application/pdf',
    size: 1024,
    ...overrides,
  };
}

/**
 * Query-chain Mongoose palsu: mendukung .populate().skip().limit().sort()
 * dan tetap bisa di-await. Setiap pemanggilan method direkam pada `calls`.
 */
export function fakeQuery(result, calls = []) {
  const chain = {
    calls,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  for (const method of ['populate', 'skip', 'limit', 'sort', 'lean', 'select']) {
    chain[method] = (...args) => {
      calls.push([method, ...args]);
      return chain;
    };
  }
  return chain;
}

/** Dokumen Paper palsu (plain object) beserta spy untuk deleteOne(). */
export function fakePaperDoc({ ownerId = newId(), filePath = 'uploads/papers/a.pdf' } = {}) {
  const doc = {
    _id: newId(),
    owner: ownerId,
    title: 'Paper Uji',
    viewCount: 0,
    downloadCount: 0,
    versions: [],
    file: filePath ? { path: filePath, filename: 'a.pdf', mimetype: 'application/pdf', size: 10 } : undefined,
    deleteOneCalled: 0,
    saveCalled: 0,
  };
  doc.deleteOne = async () => {
    doc.deleteOneCalled += 1;
    return doc;
  };
  doc.save = async () => {
    doc.saveCalled += 1;
    return doc;
  };
  return doc;
}

/** Dokumen Artifact palsu (plain object) beserta spy untuk deleteOne(). */
export function fakeArtifactDoc({ sourceType = 'file', filePath = 'uploads/artifacts/a.csv' } = {}) {
  const doc = {
    _id: newId(),
    sourceType,
    type: 'dataset',
    name: 'Artefak Uji',
    deleteOneCalled: 0,
  };
  if (sourceType === 'file' && filePath) {
    doc.file = { path: filePath, filename: 'a.csv', mimetype: 'text/csv', size: 10 };
  }
  doc.deleteOne = async () => {
    doc.deleteOneCalled += 1;
    return doc;
  };
  doc.save = async () => doc;
  return doc;
}
