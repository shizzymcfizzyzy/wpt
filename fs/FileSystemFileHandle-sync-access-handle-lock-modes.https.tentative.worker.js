importScripts('/resources/testharness.js');
importScripts('resources/sandboxed-fs-test-helpers.js');
importScripts('resources/test-helpers.js');

'use strict';

const SAH_MODES = ['readwrite', 'read-only', 'readwrite-unsafe'];

const LOCK_ACCESS = {
  SHARED: 'shared',
  EXCLUSIVE: 'exclusive',
};
const LOCK_WRITE_PERMISSION = {
  NOT_WRITABLE: 'not writable',
  WRITABLE: 'writable',
};

async function testLockAccess(t, fileHandle, sahMode) {
  const syncHandle1 =
      await createSAHWithCleanup(t, fileHandle, {mode: sahMode});

  let access;
  try {
    const syncHandle2 =
        await fileHandle.createSyncAccessHandle({mode: sahMode});
    syncHandle2.close();
    access = LOCK_ACCESS.SHARED;
  } catch (e) {
    access = LOCK_ACCESS.EXCLUSIVE;
    assert_throws_dom('NoModificationAllowedError', () => {
      throw e;
    });
  }
  syncHandle1.close();

  // Can open another sync access handle after other handles have closed.
  const syncHandle3 = await fileHandle.createSyncAccessHandle({mode: sahMode});
  syncHandle3.close();

  return access;
}

async function testLockWritePermission(t, fileHandle, sahMode) {
  const syncHandle = await createSAHWithCleanup(t, fileHandle, {mode: sahMode});

  let permission;
  const writeBuffer = new TextEncoder().encode('Hello Storage Foundation');
  try {
    syncHandle.write(writeBuffer, {at: 0});
    permission = LOCK_WRITE_PERMISSION.WRITABLE;
  } catch (e) {
    permission = LOCK_WRITE_PERMISSION.NOT_WRITABLE;
    assert_throws_dom('NoModificationAllowedError', () => {
      throw e;
    });
  }
  // truncate and flush should throw a NoModificationAllowedError if an only if
  // write threw a NoModificationAllowedError.
  if (permission == LOCK_WRITE_PERMISSION.WRITABLE) {
    syncHandle.truncate(0);
    syncHandle.flush();
  } else {
    assert_throws_dom(
        'NoModificationAllowedError', () => syncHandle.truncate(0));
    assert_throws_dom('NoModificationAllowedError', () => syncHandle.flush());
  }

  return permission;
}

// Adds tests for expected behaviors of an access handle created in `sahMode`
// mode.
function lockPropertyTests(
    sahMode, expectedLockAccess, expectedLockWritePermission) {
  const createSAHLock = createSAHWithCleanupFactory({mode: sahMode});

  directory_test(async (t, rootDir) => {
    const [fileHandle] = await createFileHandles(rootDir, 'OPFS.test');

    const syncHandle = await createSAHLock(t, fileHandle);
    const {mode} = syncHandle;
    assert_equals(mode, sahMode);
  }, `An access handle in ${sahMode} mode has a mode property equal to` +
    ` ${sahMode}`);

  directory_test(async (t, rootDir) => {
    const [fileHandle] = await createFileHandles(rootDir, 'OPFS.test');
    assert_equals(
        await testLockAccess(t, fileHandle, sahMode), expectedLockAccess);
  }, `An access handle in ${sahMode} mode takes a lock that is` +
    ` ${expectedLockAccess}`);

  directory_test(async (t, rootDir) => {
    const [fileHandle] = await createFileHandles(rootDir, 'OPFS.test');
    assert_equals(
        await testLockWritePermission(t, fileHandle, sahMode),
        expectedLockWritePermission);
  }, `An access handle in ${sahMode} mode is ${expectedLockWritePermission}`);

  // Test interaction with other access handle modes.
  for (const mode of SAH_MODES) {
    const tests = {
      sameFile: `When there's an open access handle in ${sahMode} mode on a` +
          ` file, cannot open another access handle in ${mode} on that same` +
          ` file`,
      diffFile: `When there's an open access handle in ${sahMode} mode on a` +
          ` file, can open another access handle in ${mode} on a different` +
          ` file`,
      acquireAfterClose: `After an access handle in ${sahMode} mode on a file` +
          ` has been closed, can open another access handle in ${mode} on the` +
          ` same file`,
      multiAcquireAfterClose: `After all access handles in ${sahMode} mode on` +
          ` a file has been closed, can open another access handle in ${mode}` +
          ` on the same file`,
    };

    // Delete tests depending on which access handle modes are being tested
    // against each other.
    const testingAgainstSelf = mode === sahMode;
    const testingExclusiveLock = expectedLockAccess === 'exclusive';
    if (testingAgainstSelf && !testingExclusiveLock) {
      delete tests.sameFile;
    }
    if (!testingExclusiveLock) {
      delete tests.acquireAfterClose;
    }
    if (testingExclusiveLock || testingAgainstSelf) {
      delete tests.multiAcquireAfterClose;
    }

    crossLockTests(
        createSAHLock, createSAHWithCleanupFactory({mode: mode}), tests);
  }
}

directory_test(async (t, rootDir) => {
  const [fileHandle] = await createFileHandles(rootDir, 'OPFS.test');

  const syncHandle = await createSAHWithCleanup(t, fileHandle);
  assert_equals(syncHandle.mode, 'readwrite');
}, 'A sync access handle opens in readwrite mode by default');

lockPropertyTests(
    'readwrite', LOCK_ACCESS.EXCLUSIVE, LOCK_WRITE_PERMISSION.WRITABLE);
lockPropertyTests(
    'read-only', LOCK_ACCESS.SHARED, LOCK_WRITE_PERMISSION.NOT_WRITABLE);
lockPropertyTests(
    'readwrite-unsafe', LOCK_ACCESS.SHARED, LOCK_WRITE_PERMISSION.WRITABLE);

done();
