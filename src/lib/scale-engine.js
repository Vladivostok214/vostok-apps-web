/**
 * Vostok Scale Engine
 * Specialized Logic for Scale Generation and Fretboard Mapping
 */
import { SCALE_INTERVALS, midiToFreq, getNoteInfo } from './vostok-music-db';

/**
 * Generates a challenge sequence
 */
export const generateChallenge = (rootMidi, scaleKey, octaves = 1, isGuitar = false) => {
  const intervals = SCALE_INTERVALS[scaleKey];
  if (!intervals) throw new Error(`Scale ${scaleKey} not found.`);

  const sequence = [];
  for (let oct = 0; oct < octaves; oct++) {
    for (let i = 0; i < intervals.length; i++) {
      const midi = rootMidi + (oct * 12) + intervals[i];
      sequence.push({ midi, freq: midiToFreq(midi), ...getNoteInfo(midi) });
    }
  }

  const finalMidi = rootMidi + (octaves * 12);
  sequence.push({ midi: finalMidi, freq: midiToFreq(finalMidi), ...getNoteInfo(finalMidi) });

  // Guitar Box Extension (Completing the pattern)
  if (isGuitar && scaleKey.includes('PENTATONIC') && octaves === 2) {
    const extensionMidi = finalMidi + intervals[1];
    sequence.push({ midi: extensionMidi, freq: midiToFreq(extensionMidi), ...getNoteInfo(extensionMidi) });
  }

  return sequence;
};

/**
 * SMART FRETBOARD MAPPING (Box-Aware)
 * Prioritizes standard guitar box ergonomics (4-5 fret window).
 */
export const mapNotesToFretboard = (notes, tuning = [64, 59, 55, 50, 45, 40]) => {
  // 1. Identify the 'Home' fret based on the root note on the 6th string
  const rootNote = notes[0];
  const rootFret = rootNote.midi - tuning[5]; // Standard 6th string start
  
  // Define the target box window (usually 5 frets wide)
  const windowStart = Math.max(0, rootFret - 1); 
  const windowEnd = windowStart + 5;

  let lastString = 6;

  return notes.map((note, index) => {
    const positions = [];
    tuning.forEach((stringRoot, i) => {
      const fret = note.midi - stringRoot;
      if (fret >= 0 && fret <= 20) {
        positions.push({ string: i + 1, fret });
      }
    });

    // Strategy: 
    // A. Priority 1: Position is within the target box window.
    // B. Priority 2: Minimize string jumps (stay on current or go to next string).
    // C. Priority 3: Minimize fret jumps.
    
    const sortedPos = positions.sort((a, b) => {
      const inWindowA = a.fret >= windowStart && a.fret <= windowEnd;
      const inWindowB = b.fret >= windowStart && b.fret <= windowEnd;

      if (inWindowA && !inWindowB) return -1;
      if (!inWindowA && inWindowB) return 1;

      // If both in window or both out, minimize string jump
      const stringJumpA = Math.abs(a.string - lastString);
      const stringJumpB = Math.abs(b.string - lastString);
      if (stringJumpA !== stringJumpB) return stringJumpA - stringJumpB;

      // Lastly, minimize fret jump
      return Math.abs(a.fret - rootFret) - Math.abs(b.fret - rootFret);
    });

    const bestPos = sortedPos[0];
    lastString = bestPos.string;
    
    return { ...note, positions: [bestPos] };
  });
};
