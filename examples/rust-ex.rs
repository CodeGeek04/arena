struct SimpleRng {
    state: u32,
}

impl SimpleRng {
    fn new() -> Self {
        SimpleRng { state: 0 }
    }

    fn next(&mut self) -> u32 {
        self.state = self.state.wrapping_mul(1103515245).wrapping_add(12345);
        self.state & 0x7fffffff
    }
}

fn generate_sequence(length: usize, rng: &mut SimpleRng) -> String {
    let bases = b"ACGT";
    (0..length)
        .map(|_| bases[rng.next() as usize % 4] as char)
        .collect()
}

fn process_sequences(count: usize, length: usize) -> (f64, f64) {
    let mut total_gc = 0;
    let mut pattern_count = 0;
    let pattern = "GATTACA";
    let mut rng = SimpleRng::new();

    for _ in 0..count {
        let seq = generate_sequence(length, &mut rng);
        total_gc += seq.chars().filter(|&c| c == 'G' || c == 'C').count();
        pattern_count += seq.matches(pattern).count();
    }

    (
        total_gc as f64 / (count * length) as f64,
        pattern_count as f64 / count as f64,
    )
}

fn main() {
    let sequence_count = 100000;
    let sequence_length = 1000;

    let (gc_content, pattern_frequency) = process_sequences(sequence_count, sequence_length);

    println!("Processed {} sequences of length {}", sequence_count, sequence_length);
    println!("Average GC content: {:.4}", gc_content);
    println!("Average GATTACA frequency: {:.4}", pattern_frequency);
}