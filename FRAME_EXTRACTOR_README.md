# Video Frame Extraction Tool

Extracts 20 frames per second from any video URL using ffmpeg and converts frames to multi-page PDF.

## Requirements

- Python 3.6+
- ffmpeg installed on your system
- yt-dlp (for YouTube videos): `pip install yt-dlp`
- Pillow (for PDF conversion): `pip install Pillow`

### Installing Dependencies

**ffmpeg:**

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html and add to PATH

**Python packages:**
```bash
pip install yt-dlp Pillow
```

## Usage

### Basic usage (20 fps, default):
```bash
python extract_frames.py "https://example.com/video.mp4"
```

### Custom frames per second:
```bash
python extract_frames.py "https://example.com/video.mp4" 30
```

### YouTube video:
```bash
python extract_frames.py "https://www.youtube.com/watch?v=VIDEO_ID"
```

### Local file:
```bash
python extract_frames.py "C:\path\to\video.mp4"
```

## Full Pipeline

The tool now automatically:
1. Downloads the video from the URL
2. Extracts frames at specified fps using ffmpeg
3. Saves frames to the `frames` directory
4. Converts frames to multi-page PDF(s)
5. Splits PDFs if size would exceed 25MB
6. Adds source filename and timestamp as caption on each page
7. Opens the frames folder automatically

## Output

**Frames:**
PNG files in the `frames` directory with naming pattern:
```
frame_0001.png
frame_0002.png
frame_0003.png
...
```

**PDFs:**
Multi-page PDF files with naming pattern:
```
video_part1.pdf
video_part2.pdf
...
```

Each PDF includes:
- All frames as pages
- Caption with source filename and timestamp on each page
- Automatic splitting at 25MB limit

## Example

```bash
python extract_frames.py "https://www.youtube.com/watch?v=SBjQ9tuuTJQ" 20
```

This will:
1. Download the YouTube video using yt-dlp
2. Extract frames at 20 fps using ffmpeg
3. Save frames to the `frames` directory
4. Convert frames to PDF(s) with captions
5. Clean up the temporary video file
6. Open the frames folder

Output summary:
```
✓ PDF conversion complete
✓ Created 2 PDF file(s)
✓ Average frames per PDF: 150
✓ Estimated size per PDF: ~25 MB
```
