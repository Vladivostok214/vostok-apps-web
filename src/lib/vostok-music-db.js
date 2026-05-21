/**
 * Vostok Music Database (VMDB)
 * Centralized Authority for Musical Theory & Physical Mapping
 * Vostok Labs • 2026
 */

export const SCALE_INTERVALS = {
  // --- DIATONIC MODES ---
  MAJOR: [0, 2, 4, 5, 7, 9, 11],
  DORIAN: [0, 2, 3, 5, 7, 9, 10],
  PHRYGIAN: [0, 1, 3, 5, 7, 8, 10],
  LYDIAN: [0, 2, 4, 6, 7, 9, 11],
  MIXOLYDIAN: [0, 2, 4, 5, 7, 9, 10],
  AEOLIAN: [0, 2, 3, 5, 7, 8, 10],
  LOCRIAN: [0, 1, 3, 5, 6, 8, 10],

  // --- HARMONIC & MELODIC ---
  HARMONIC_MINOR: [0, 2, 3, 5, 7, 8, 11],
  MELODIC_MINOR: [0, 2, 3, 5, 7, 9, 11],
  PHRYGIAN_DOMINANT: [0, 1, 4, 5, 7, 8, 10],

  // --- PENTATONICS ---
  PENTATONIC_MAJOR: [0, 2, 4, 7, 9],
  PENTATONIC_MINOR: [0, 3, 5, 7, 10],
  BLUES_MINOR: [0, 3, 5, 6, 7, 10]
};

export const INSTRUMENTS = {
  GUITAR: { 
    name: 'Guitarra', 
    tuning: [64, 59, 55, 50, 45, 40], // E4, B3, G3, D3, A2, E2 (Standard)
    defaultOctaves: 2,
    threshold: 0.15 
  },
  BASS: { 
    name: 'Bajo', 
    tuning: [43, 38, 33, 28], // G2, D2, A1, E1
    defaultOctaves: 1,
    threshold: 0.10 
  },
  VOICE: { 
    name: 'Voz', 
    tuning: [], 
    defaultOctaves: 1,
    threshold: 0.20 
  }
};

export const TUNINGS = {
  GUITAR: {
    STANDARD: { name: 'Standard E', strings: [64, 59, 55, 50, 45, 40], labels: ['1E', '2B', '3G', '4D', '5A', '6E'] },
    DROP_D: { name: 'Drop D', strings: [64, 59, 55, 50, 45, 38], labels: ['1E', '2B', '3G', '4D', '5A', '6D'] },
    DADGAD: { name: 'DADGAD', strings: [62, 57, 55, 50, 45, 38], labels: ['1D', '2A', '3G', '4D', '5A', '6D'] },
    OPEN_G: { name: 'Open G', strings: [62, 59, 55, 50, 43, 38], labels: ['1D', '2B', '3G', '4D', '5G', '6D'] },
    HALF_STEP_DOWN: { name: 'Eb Standard', strings: [63, 58, 54, 49, 44, 39], labels: ['1Eb', '2Bb', '3Gb', '4Db', '5Ab', '6Eb'] }
  },
  BASS: {
    STANDARD: { name: 'Standard', strings: [43, 38, 33, 28], labels: ['1G', '2D', '3A', '4E'] },
    DROP_D: { name: 'Drop D', strings: [43, 38, 33, 26], labels: ['1G', '2D', '3A', '4D'] },
    FIVE_STRING: { name: '5-String', strings: [43, 38, 33, 28, 23], labels: ['1G', '2D', '3A', '4E', '5B'] }
  },
  UKULELE: {
    STANDARD: { name: 'Standard', strings: [69, 64, 60, 67], labels: ['1A', '2E', '3C', '4G'] },
    LOW_G: { name: 'Low G', strings: [69, 64, 60, 55], labels: ['1A', '2E', '3C', '4G'] }
  }
};

export const ALTERNATIVE_TUNINGS = TUNINGS.GUITAR; // Backward compatibility for guitar logic

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * MIDI Mathematics
 */
export const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

export const freqToMidi = (freq) => {
  if (freq <= 0) return { midi: -1, cents: 0 };
  const midiDouble = 12 * Math.log2(freq / 440) + 69;
  const midi = Math.round(midiDouble);
  const cents = Math.round((midiDouble - midi) * 100);
  return { midi, cents };
};

export const getNoteInfo = (midi) => {
  const name = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return { name, octave, full: `${name}${octave}` };
};
