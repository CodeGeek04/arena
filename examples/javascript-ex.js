function simpleRandom(state) {
  state = (state * 1103515245 + 12345) & 0x7fffffff;
  return state;
}

function generateSequence(length, state) {
  const bases = "ACGT";
  let sequence = "";
  for (let i = 0; i < length; i++) {
    state = simpleRandom(state);
    sequence += bases[state % 4];
  }
  return sequence;
}

function processSequences(count, length) {
  let totalGC = 0;
  let patternCount = 0;
  const pattern = "GATTACA";
  let state = 0;

  for (let i = 0; i < count; i++) {
    const seq = generateSequence(length, state);
    totalGC += seq.split("").filter((c) => c === "G" || c === "C").length;
    let pos = -1;
    while ((pos = seq.indexOf(pattern, pos + 1)) !== -1) {
      patternCount++;
    }
  }

  return {
    gcContent: totalGC / (count * length),
    patternFrequency: patternCount / count,
  };
}

const SEQUENCE_COUNT = 100000;
const SEQUENCE_LENGTH = 1000;

const result = processSequences(SEQUENCE_COUNT, SEQUENCE_LENGTH);

console.log(
  `Processed ${SEQUENCE_COUNT} sequences of length ${SEQUENCE_LENGTH}`
);
console.log(`Average GC content: ${result.gcContent.toFixed(4)}`);
console.log(`Average GATTACA frequency: ${result.patternFrequency.toFixed(4)}`);
