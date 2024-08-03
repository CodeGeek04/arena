#include <iostream>
#include <string>
#include <algorithm>
#include <iomanip>
#include <cstdint>

uint32_t simple_random(uint32_t& state) {
    state = state * 1103515245 + 12345;
    return state & 0x7fffffff;
}

std::string generate_sequence(int length, uint32_t& state) {
    static const char bases[] = "ACGT";
    std::string sequence(length, ' ');
    for (int i = 0; i < length; ++i) {
        sequence[i] = bases[simple_random(state) % 4];
    }
    return sequence;
}

std::pair<double, double> process_sequences(int count, int length) {
    long long total_gc = 0;
    int pattern_count = 0;
    const std::string pattern = "GATTACA";
    uint32_t state = 0;

    for (int i = 0; i < count; ++i) {
        std::string seq = generate_sequence(length, state);
        total_gc += std::count_if(seq.begin(), seq.end(), [](char c) { return c == 'G' || c == 'C'; });
        
        size_t pos = 0;
        while ((pos = seq.find(pattern, pos)) != std::string::npos) {
            ++pattern_count;
            pos += pattern.length();
        }
    }

    return {
        static_cast<double>(total_gc) / (count * length),
        static_cast<double>(pattern_count) / count
    };
}

int main() {
    const int SEQUENCE_COUNT = 100000;
    const int SEQUENCE_LENGTH = 1000;

    auto [gc_content, pattern_frequency] = process_sequences(SEQUENCE_COUNT, SEQUENCE_LENGTH);

    std::cout << "Processed " << SEQUENCE_COUNT << " sequences of length " << SEQUENCE_LENGTH << std::endl;
    std::cout << "Average GC content: " << std::fixed << std::setprecision(4) << gc_content << std::endl;
    std::cout << "Average GATTACA frequency: " << std::fixed << std::setprecision(4) << pattern_frequency << std::endl;

    return 0;
}