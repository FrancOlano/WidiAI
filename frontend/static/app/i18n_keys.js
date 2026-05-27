export const SUPPORTED_LANGS = Object.freeze(['en', 'es', 'ca']);

export function normalizeLang(value) {
  const lang = String(value || '').trim().toLowerCase();
  if (lang === 'es' || lang === 'ca') return lang;
  return 'en';
}

const KEY_TABLE = Object.freeze({
  en: Object.freeze({
    'status.model_switched': 'Model switched to {model}. Press Convert to re-transcribe the same audio.',
    'status.score_view_enabled': 'Score view enabled. You can edit notes directly on the staff.',
    'status.roll_view_enabled': 'Piano roll view enabled.',
    'status.edit_mode_enabled': 'Edit mode enabled. Use the visual guide for roll and score shortcuts.',
    'status.edit_mode_disabled': 'Edit mode disabled.',
    'status.finger_suggestions_enabled_smart': 'Finger suggestions enabled (smart auto algorithm).',
    'status.finger_labels_enabled_manual': 'Finger labels enabled in manual mode.',
    'status.finger_labels_disabled': 'Finger labels disabled.',
    'status.smart_finger_enabled': 'Smart finger suggestion enabled.',
    'status.manual_fingering_enabled': 'Manual fingering mode enabled.',
    'status.compare_running': 'Running model comparison…',
    'status.comparing_model': 'Comparing: {model}…',
    'status.compare_finished_errors': 'Comparison finished with errors in both models.',
    'status.compare_finished_partial': 'Comparison finished. {count}/2 model(s) produced MIDI.',
    'status.compare_model_completed': '{model} comparison completed.',
    'status.compare_model_failed': '{model} comparison failed.',
    'status.select_audio_first': 'Select or record an audio file first.',

    'settings.playback_profile': 'Playback Profile',
    'settings.playback_profile.help': 'Choose articulation feel for preview and MIDI playback.',
    'settings.playback_profile.natural': 'Natural',
    'settings.playback_profile.studio': 'Studio',
    'settings.playback_profile.dry': 'Dry',
  }),
  es: Object.freeze({
    'status.model_switched': 'Modelo cambiado a {model}. Pulsa Convert para transcribir de nuevo el mismo audio.',
    'status.score_view_enabled': 'Vista de partitura activada. Puedes editar notas directamente en el pentagrama.',
    'status.roll_view_enabled': 'Vista de piano roll activada.',
    'status.edit_mode_enabled': 'Modo edición activado. Usa la guía visual para atajos de roll y partitura.',
    'status.edit_mode_disabled': 'Modo edición desactivado.',
    'status.finger_suggestions_enabled_smart': 'Sugerencias de dedos activadas (algoritmo auto inteligente).',
    'status.finger_labels_enabled_manual': 'Etiquetas de dedos activadas en modo manual.',
    'status.finger_labels_disabled': 'Etiquetas de dedos desactivadas.',
    'status.smart_finger_enabled': 'Sugerencia de dedos inteligente activada.',
    'status.manual_fingering_enabled': 'Modo de digitación manual activado.',
    'status.compare_running': 'Ejecutando comparación de modelos…',
    'status.comparing_model': 'Comparando: {model}…',
    'status.compare_finished_errors': 'La comparación terminó con errores en ambos modelos.',
    'status.compare_finished_partial': 'Comparación terminada. {count}/2 modelo(s) generaron MIDI.',
    'status.compare_model_completed': 'Comparación de {model} completada.',
    'status.compare_model_failed': 'Comparación de {model} fallida.',
    'status.select_audio_first': 'Selecciona o graba un audio primero.',

    'settings.playback_profile': 'Perfil de reproducción',
    'settings.playback_profile.help': 'Elige el carácter de articulación para preescucha y reproducción MIDI.',
    'settings.playback_profile.natural': 'Natural',
    'settings.playback_profile.studio': 'Studio',
    'settings.playback_profile.dry': 'Seco',
  }),
  ca: Object.freeze({
    'status.model_switched': 'Model canviat a {model}. Prem Convert per transcriure de nou el mateix àudio.',
    'status.score_view_enabled': 'Vista de partitura activada. Pots editar notes directament al pentagrama.',
    'status.roll_view_enabled': 'Vista de piano roll activada.',
    'status.edit_mode_enabled': 'Mode edició activat. Fes servir la guia visual per a dreceres de roll i partitura.',
    'status.edit_mode_disabled': 'Mode edició desactivat.',
    'status.finger_suggestions_enabled_smart': 'Suggeriments de dits activats (algoritme auto intel·ligent).',
    'status.finger_labels_enabled_manual': 'Etiquetes de dits activades en mode manual.',
    'status.finger_labels_disabled': 'Etiquetes de dits desactivades.',
    'status.smart_finger_enabled': 'Suggeriment de dits intel·ligent activat.',
    'status.manual_fingering_enabled': 'Mode de digitació manual activat.',
    'status.compare_running': 'Executant comparació de models…',
    'status.comparing_model': 'Comparant: {model}…',
    'status.compare_finished_errors': 'La comparació ha acabat amb errors en tots dos models.',
    'status.compare_finished_partial': 'Comparació acabada. {count}/2 model(s) han generat MIDI.',
    'status.compare_model_completed': 'Comparació de {model} completada.',
    'status.compare_model_failed': 'Comparació de {model} fallida.',
    'status.select_audio_first': 'Selecciona o grava un àudio primer.',

    'settings.playback_profile': 'Perfil de reproducció',
    'settings.playback_profile.help': 'Tria el caràcter d’articulació per a la previsualització i reproducció MIDI.',
    'settings.playback_profile.natural': 'Natural',
    'settings.playback_profile.studio': 'Studio',
    'settings.playback_profile.dry': 'Sec',
  }),
});

export function translateKey(langValue, key, vars = {}, fallback = '') {
  const lang = normalizeLang(langValue);
  const source = KEY_TABLE[lang] || KEY_TABLE.en;
  const english = KEY_TABLE.en || {};
  let text = source[key] || english[key] || fallback || key;
  Object.keys(vars || {}).forEach(varKey => {
    text = text.split(`{${varKey}}`).join(String(vars[varKey]));
  });
  return text;
}
