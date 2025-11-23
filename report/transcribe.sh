#!/usr/bin/env bash

# Audio Transcription Script using Whisper
# Usage: ./transcribe.sh <audio_file> [language] [model]
#
# Arguments:
#   audio_file: Path to the audio/video file to transcribe
#   language: (Optional) Language code, default: fi (Finnish)
#   model: (Optional) Whisper model size, default: large-v3
#          Options: tiny, base, small, medium, large-v2, large-v3

set -euo pipefail

# Check if file argument is provided
if [ $# -lt 1 ]; then
    echo "Usage: $0 <audio_file> [language] [model]"
    echo "Example: $0 recording.webm fi large-v3"
    exit 1
fi

AUDIO_FILE="$1"
LANGUAGE="${2:-fi}"
MODEL="${3:-large-v3}"

# Check if file exists
if [ ! -f "$AUDIO_FILE" ]; then
    echo "Error: File '$AUDIO_FILE' not found"
    exit 1
fi

# Get the directory of the audio file
OUTPUT_DIR="$(dirname "$AUDIO_FILE")"

echo "Transcribing: $AUDIO_FILE"
echo "Language: $LANGUAGE"
echo "Model: $MODEL"
echo "Output directory: $OUTPUT_DIR"
echo ""

# Run whisper transcription
nix run nixpkgs#whisper-ctranslate2 -- \
    "$AUDIO_FILE" \
    --model "$MODEL" \
    --language "$LANGUAGE" \
    --output_dir "$OUTPUT_DIR" \
    --output_format txt

echo ""
echo "Transcription complete!"
