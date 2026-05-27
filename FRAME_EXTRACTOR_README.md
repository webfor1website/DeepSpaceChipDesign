# Video Frame Extraction Tool

Extracts 20 frames per second from any video URL using ffmpeg.

## Requirements

- Python 3.6+
- ffmpeg installed on your system

### Installing ffmpeg

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

## Usage

### Basic usage (20 fps, default):
```bash
python extract_frames.py "https://example.com/video.mp4"
```

### Custom frames per second:
```bash
python extract_frames.py "https://example.com/video.mp4" --fps 30
```

### Custom output directory:
```bash
python extract_frames.py "https://example.com/video.mp4" --output my_frames
```

### Full options:
```bash
python extract_frames.py "VIDEO_URL" --fps 20 --output frames --video-output input_video.mp4
```

## Arguments

- `url` (required): Video URL to extract frames from
- `--fps`: Frames per second (default: 20)
- `--output`: Output directory for frames (default: frames)
- `--video-output`: Temporary video file name (default: input_video.mp4)

## Output

Frames are saved as PNG files in the specified output directory with naming pattern:
```
frame_0001.png
frame_0002.png
frame_0003.png
...
```

## Example

```bash
python extract_frames.py "https://www.example.com/video.mp4" --fps 20 --output extracted_frames
```

This will:
1. Download the video from the URL
2. Extract frames at 20 fps using ffmpeg
3. Save frames to the `extracted_frames` directory
4. Clean up the temporary video file
