// Lab 7 - Part 2: Persistent Store using atomic file writes
// Based on the lab 7 reference architecture (02-persistent-api/store.js)
// Features: Atomic temp-file + rename, recursive directory creation, serialized write queue.

const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

function createStore(file, initialData = []) {
  let writeQueue = Promise.resolve();

  async function loadFromFile() {
    try {
      const content = await fs.readFile(file, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File does not exist yet; create it with initial data
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, JSON.stringify(initialData, null, 2), 'utf8');
        return initialData;
      }
      throw error;
    }
  }

  async function list() {
    await writeQueue; // Ensure all pending writes have completed
    return loadFromFile();
  }

  function edit(change) {
    const operation = writeQueue.then(async () => {
      const current = await loadFromFile();
      const result = await change(current);
      if (result && result.changed) {
        const toSave = result.data !== undefined ? result.data : current;
        await fs.mkdir(path.dirname(file), { recursive: true });
        const temp = `${file}.${randomUUID()}.tmp`;
        try {
          await fs.writeFile(temp, JSON.stringify(toSave, null, 2), 'utf8');
          await fs.rename(temp, file);
        } catch (error) {
          await fs.rm(temp, { force: true }).catch(() => {});
          throw error;
        }
      }
      return result ? result.value : null;
    });

    // Keep queue chain alive even if one operation throws
    writeQueue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  return { list, edit, filePath: file };
}

module.exports = { createStore };
