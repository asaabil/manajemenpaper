/**
 * =============================================================================
 * MODUL UJI 1 & 2 - Registrasi dan Login Pengguna
 * Unit yang diuji : src/services/auth.service.js
 *                   -> registerUser(userData)
 *                   -> loginUser(email, password)
 *                   -> generateToken(user)
 * Metode          : White Box Testing - Basis Path Testing
 *
 * MODUL 1 : registerUser
 *   Predicate node : 1  (IF userExists)
 *   Cyclomatic Complexity V(G) = 1 + 1 = 2
 *   Jalur independen:
 *     Path 1-1 : 1 -> 2 -> 3 -> 4 -> 8        (email sudah terdaftar / gagal)
 *     Path 1-2 : 1 -> 2 -> 3 -> 5 -> 6 -> 8   (email belum terdaftar / sukses)
 *
 * MODUL 2 : loginUser
 *   Predicate node : 1  (IF !user OR !matchPassword)  -- keputusan majemuk
 *   Cyclomatic Complexity V(G) = 1 + 1 = 2
 *   Jalur independen:
 *     Path 2-1 : 1 -> 2 -> 3 -> 4 -> 6        (kredensial salah / exception)
 *     Path 2-2 : 1 -> 2 -> 3 -> 5 -> 6        (kredensial benar / user)
 *   Tambahan condition coverage pada keputusan majemuk node 3:
 *     - kondisi kiri  benar (user tidak ditemukan)
 *     - kondisi kanan benar (user ada, password tidak cocok)
 * =============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';

import User from '../../src/models/User.js';
import env from '../../src/config/env.js';
import { registerUser, loginUser, generateToken } from '../../src/services/auth.service.js';
import { createSandbox, newId } from '../helpers/doubles.js';

/** Membuat dokumen User asli (tanpa menyentuh database) dengan hash bcrypt nyata. */
const buildUserDoc = (plainPassword, overrides = {}) => {
  const doc = new User({
    name: 'Akmal',
    email: 'akmal@example.com',
    passwordHash: bcrypt.hashSync(plainPassword, 10),
    role: 'dosen',
    ...overrides,
  });
  return doc;
};

test('MODUL 1 - Basis Path registerUser', async (t) => {
  await t.test('Path 1-1 : email sudah terdaftar -> Error "User already exists"', async () => {
    const sandbox = createSandbox();
    let createCalled = 0;
    sandbox.patch(User, {
      findOne: async ({ email }) => ({ _id: newId(), email }),
      create: async () => {
        createCalled += 1;
        return {};
      },
    });

    await assert.rejects(
      () => registerUser({ name: 'Akmal', email: 'akmal@example.com', password: 'rahasia123' }),
      /User already exists/
    );
    // Bukti jalur: cabang gagal tidak boleh sampai memanggil User.create
    assert.equal(createCalled, 0);
    sandbox.restoreAll();
  });

  await t.test('Path 1-2 : email belum terdaftar -> user baru dibuat', async () => {
    const sandbox = createSandbox();
    let payloadDiterima = null;
    sandbox.patch(User, {
      findOne: async () => null,
      create: async (payload) => {
        payloadDiterima = payload;
        return { _id: newId(), ...payload };
      },
    });

    const user = await registerUser({
      name: 'Akmal',
      email: 'akmal@example.com',
      password: 'rahasia123',
      affiliation: 'Universitas Brawijaya',
      role: 'dosen',
    });

    assert.ok(user._id, 'user baru harus memiliki _id');
    assert.equal(user.name, 'Akmal');
    assert.equal(user.role, 'dosen');
    assert.equal(user.affiliation, 'Universitas Brawijaya');
    // Password polos dipetakan ke field passwordHash lalu di-hash oleh hook pre-save model
    assert.equal(payloadDiterima.passwordHash, 'rahasia123');
    assert.equal(payloadDiterima.password, undefined);
    sandbox.restoreAll();
  });
});

test('MODUL 2 - Basis Path loginUser', async (t) => {
  await t.test('Path 2-1a : email tidak terdaftar -> Error "Invalid email or password"', async () => {
    const sandbox = createSandbox();
    sandbox.patch(User, { findOne: async () => null });

    await assert.rejects(
      () => loginUser('tidakada@example.com', 'rahasia123'),
      /Invalid email or password/
    );
    sandbox.restoreAll();
  });

  await t.test('Path 2-1b : password salah -> Error "Invalid email or password"', async () => {
    const sandbox = createSandbox();
    sandbox.patch(User, { findOne: async () => buildUserDoc('rahasia123') });

    await assert.rejects(
      () => loginUser('akmal@example.com', 'passwordSalah'),
      /Invalid email or password/
    );
    sandbox.restoreAll();
  });

  await t.test('Path 2-2 : kredensial benar -> objek user dikembalikan', async () => {
    const sandbox = createSandbox();
    const doc = buildUserDoc('rahasia123');
    sandbox.patch(User, { findOne: async () => doc });

    const user = await loginUser('akmal@example.com', 'rahasia123');
    assert.equal(user.email, 'akmal@example.com');
    assert.equal(user.role, 'dosen');
    sandbox.restoreAll();
  });
});

test('MODUL 2B - generateToken menyisipkan sub, email, dan role', () => {
  const sandbox = createSandbox();
  sandbox.patch(env, { jwtSecret: 'secret-uji-unit', jwtExpiresIn: '1h' });

  const id = newId();
  const token = generateToken({ _id: id, email: 'akmal@example.com', role: 'dosen' });
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());

  assert.equal(payload.sub, id.toString());
  assert.equal(payload.email, 'akmal@example.com');
  assert.equal(payload.role, 'dosen');
  assert.ok(payload.exp > payload.iat, 'token harus memiliki masa kedaluwarsa');
  sandbox.restoreAll();
});
