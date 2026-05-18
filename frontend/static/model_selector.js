(() => {
    const modelSelect = document.getElementById('modelSelect');
    if (!modelSelect) return;

    const state = (window.appState = window.appState || {});
    const STORAGE_KEY = 'widi.selectedModel';
    const defaultModel = localStorage.getItem(STORAGE_KEY)
        || modelSelect.dataset.defaultModel
        || modelSelect.options[0]?.value
        || 'transkun';
    const fallbackModels = [
        { value: 'transkun', label: 'Transkun' },
        { value: 'onsets_and_frames', label: 'Onsets and Frames' },
    ];

    if (modelSelect.options.length === 0) {
        fallbackModels.forEach((model) => {
            const option = document.createElement('option');
            option.value = model.value;
            option.textContent = model.label;
            modelSelect.appendChild(option);
        });
    }

    let selectedModel = defaultModel || modelSelect.value;
    if ([...modelSelect.options].some((option) => option.value === selectedModel)) {
        modelSelect.value = selectedModel;
    } else {
        selectedModel = modelSelect.value;
    }

    state.selectedModel = selectedModel === 'onsets' ? 'onsets_and_frames' : selectedModel;
    window.selectedModel = state.selectedModel;
    localStorage.setItem(STORAGE_KEY, state.selectedModel);

    modelSelect.addEventListener('change', (event) => {
        const value = event.target.value;
        state.selectedModel = value === 'onsets' ? 'onsets_and_frames' : value;
        window.selectedModel = state.selectedModel;
        localStorage.setItem(STORAGE_KEY, state.selectedModel);
    });
})();
