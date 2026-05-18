(() => {
    const uploadBtn = document.getElementById('uploadBtn');
    const audioFileInput = document.getElementById('audioFileInput');
    const uploadStatusDiv = document.getElementById('uploadStatus');
    const uploadMessageDiv = document.getElementById('uploadMessage');

    if (!uploadBtn || !audioFileInput || !uploadStatusDiv || !uploadMessageDiv) return;

    const state = (window.appState = window.appState || {});
    const STORAGE_KEYS = {
        lastAudioId: 'widi.lastAudioId',
    };
    const AUDIO_DB = {
        name: 'widi_audio_storage',
        version: 1,
        store: 'audio',
    };
    const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

    const openAudioDb = () => new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
            reject(new Error('IndexedDB is not available in this browser.'));
            return;
        }
        const request = indexedDB.open(AUDIO_DB.name, AUDIO_DB.version);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(AUDIO_DB.store)) {
                const store = db.createObjectStore(AUDIO_DB.store, { keyPath: 'id' });
                store.createIndex('createdAt', 'createdAt');
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    const saveAudioEntry = async (file) => {
        const id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : `audio_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const entry = {
            id,
            name: file.name,
            source: 'upload',
            size: file.size,
            type: file.type || 'audio/wav',
            durationMs: null,
            createdAt: new Date().toISOString(),
            blob: file,
        };

        const db = await openAudioDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(AUDIO_DB.store, 'readwrite');
            tx.oncomplete = () => {
                db.close();
                resolve(entry);
            };
            tx.onerror = () => {
                db.close();
                reject(tx.error);
            };
            tx.objectStore(AUDIO_DB.store).put(entry);
        });
    };

    async function uploadAudioFile(file) {
        try {
            uploadBtn.disabled = true;
            uploadStatusDiv.classList.remove('error', 'success');
            uploadStatusDiv.classList.add('show');
            uploadMessageDiv.textContent = 'Saving file locally...';

            if (file.size > MAX_AUDIO_BYTES) {
                throw new Error('File too large. Please choose a smaller upload.');
            }

            const entry = await saveAudioEntry(file);
            localStorage.setItem(STORAGE_KEYS.lastAudioId, entry.id);

            state.audioFileForTranscription = file;
            state.audioEntryId = entry.id;
            if (typeof window.setAudioFileForTranscription === 'function') {
                window.setAudioFileForTranscription(file);
            }

            uploadStatusDiv.classList.add('success');
            uploadMessageDiv.textContent = `✓ File saved locally: ${file.name}`;
            uploadBtn.disabled = false;
            audioFileInput.value = '';
        } catch (error) {
            console.error('Upload error:', error);
            uploadStatusDiv.classList.add('error');
            uploadMessageDiv.textContent = `✗ Upload failed: ${error.message}`;
            uploadBtn.disabled = false;
        }
    }

    audioFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            uploadAudioFile(file);
        }
    });

    uploadBtn.addEventListener('click', () => {
        audioFileInput.click();
    });
})();
