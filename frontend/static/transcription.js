(() => {
    const convertBtn = document.getElementById('convertBtn');
    const transcriptionStatusDiv = document.getElementById('transcriptionStatus');
    const transcriptionMessageDiv = document.getElementById('transcriptionMessage');

    if (!convertBtn || !transcriptionStatusDiv || !transcriptionMessageDiv) return;

    const state = (window.appState = window.appState || {});
    const STORAGE_KEYS = {
        selectedModel: 'widi.selectedModel',
        lastAudioId: 'widi.lastAudioId',
        apiUrl: 'widi.apiUrl',
    };
    const AUDIO_DB = {
        name: 'widi_audio_storage',
        version: 1,
        store: 'audio',
    };
    const getApiUrl = () => {
        const fromRuntime = (window.__WIDI_RUNTIME__ && typeof window.__WIDI_RUNTIME__.apiBaseUrl === 'string')
            ? window.__WIDI_RUNTIME__.apiBaseUrl.trim()
            : '';
        const fromEnv = (window.__WIDI_ENV__ && typeof window.__WIDI_ENV__.API_URL === 'string')
            ? window.__WIDI_ENV__.API_URL.trim()
            : '';
        const fromStorage = localStorage.getItem(STORAGE_KEYS.apiUrl) || '';
        const base = state.apiUrl || fromStorage || fromRuntime || fromEnv || 'http://localhost:8000';
        return base.replace(/\/+$/, '');
    };
    const API_URL = getApiUrl();

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

    const loadAudioEntry = async (id) => {
        if (!id) return null;
        const db = await openAudioDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(AUDIO_DB.store, 'readonly');
            const req = tx.objectStore(AUDIO_DB.store).get(id);
            req.onsuccess = () => {
                db.close();
                resolve(req.result || null);
            };
            req.onerror = () => {
                db.close();
                reject(req.error);
            };
        });
    };

    function setTranscriptionMessage(message, type = '') {
        transcriptionStatusDiv.classList.remove('error', 'success', 'loading');
        transcriptionStatusDiv.classList.add('show');

        if (type) {
            transcriptionStatusDiv.classList.add(type);
        }

        transcriptionMessageDiv.textContent = message;
    }

    window.setTranscriptionMessage = setTranscriptionMessage;

    async function transcribeAudio() {
        if (window.midiMenu) {
            window.midiMenu.clearMidiDownload();
        }

        let audioFile = state.audioFileForTranscription;
        if (!audioFile) {
            const entryId = state.audioEntryId || localStorage.getItem(STORAGE_KEYS.lastAudioId);
            const entry = await loadAudioEntry(entryId);
            if (entry && entry.blob) {
                audioFile = new File([entry.blob], entry.name, { type: entry.type || entry.blob.type || 'audio/wav' });
                state.audioFileForTranscription = audioFile;
            }
        }
        if (!audioFile) {
            setTranscriptionMessage(
                'No audio file selected yet. The upload component must provide the file first.',
                'error'
            );
            return;
        }

        const storedModel = state.selectedModel || window.selectedModel || localStorage.getItem(STORAGE_KEYS.selectedModel) || 'transkun';
        const modelName = storedModel === 'onsets' ? 'onsets_and_frames' : storedModel;

        const formData = new FormData();
        formData.append('audio', audioFile, audioFile.name || 'input.wav');
        formData.append('model', modelName);

        convertBtn.disabled = true;
        setTranscriptionMessage('Converting audio to MIDI...', 'loading');

        try {
            const response = await fetch(`${API_URL}/transcribe`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                let errorMessage = 'Transcription failed.';

                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorMessage;
                } catch {
                    errorMessage = await response.text();
                }

                throw new Error(errorMessage);
            }

            const midiBlob = await response.blob();
            if (window.midiMenu) {
                window.midiMenu.setMidiBlob(
                    midiBlob,
                    state.selectedModel || window.selectedModel || 'transkun'
                );
            }

            setTranscriptionMessage('✓ MIDI generated successfully.', 'success');
        } catch (error) {
            console.error('Transcription error:', error);
            setTranscriptionMessage(`✗ Error: ${error.message}`, 'error');
        } finally {
            convertBtn.disabled = false;
        }
    }

    convertBtn.addEventListener('click', transcribeAudio);
})();
