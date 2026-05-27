#!/usr/bin/env python3
"""
Video Frame Extraction Tool - Automated
Just enter a URL, it downloads, extracts frames, and opens the folder
Supports YouTube URLs via yt-dlp
"""

import os
import sys
import subprocess
import urllib.request
from pathlib import Path


def download_video(url, output_path):
    """Download video from URL (supports YouTube via yt-dlp)"""
    # Check if it's a YouTube URL
    if 'youtube.com' in url or 'youtu.be' in url:
        print(f"YouTube URL detected, using yt-dlp...")
        try:
            cmd = ['yt-dlp', '-o', output_path, url]
            subprocess.run(cmd, check=True)
            print(f"Video downloaded: {os.path.getsize(output_path)} bytes")
            return True
        except subprocess.CalledProcessError:
            print("Error: yt-dlp failed. Install with: pip install yt-dlp")
            return False
        except FileNotFoundError:
            print("Error: yt-dlp not found. Install with: pip install yt-dlp")
            return False
    
    # Direct video file download
    print(f"Downloading video from: {url}")
    try:
        urllib.request.urlretrieve(url, output_path)
        print(f"Video downloaded: {os.path.getsize(output_path)} bytes")
        return True
    except Exception as e:
        print(f"Error downloading: {e}")
        print("For local files, just drag and drop the video file onto this script")
        return False


def extract_frames(url, fps=20):
    """Download video, extract frames, and open folder"""
    # Create frames folder in current directory
    frames_dir = os.path.abspath("frames")
    Path(frames_dir).mkdir(parents=True, exist_ok=True)
    
    # Download video
    video_path = "temp_video.mp4"
    if not download_video(url, video_path):
        return False
    
    # Extract frames
    print(f"Extracting frames at {fps} fps...")
    output_pattern = os.path.join(frames_dir, "frame_%04d.png")
    cmd = ["ffmpeg", "-i", video_path, "-vf", f"fps={fps}", output_pattern]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        print(f"Frames extracted to: {frames_dir}")
        
        # Count frames
        frame_count = len([f for f in os.listdir(frames_dir) if f.endswith('.png')])
        print(f"Total frames: {frame_count}")
        
        # Clean up video
        os.remove(video_path)
        
        # Create simple HTML viewer
        create_viewer(frames_dir, frame_count)
        
        # Open folder
        if os.name == 'nt':  # Windows
            os.startfile(frames_dir)
        elif os.name == 'posix':  # Mac/Linux
            subprocess.run(['open', frames_dir] if sys.platform == 'darwin' else ['xdg-open', frames_dir])
        
        print(f"\n✓ Done! Frames folder opened")
        print(f"✓ HTML viewer created: {os.path.join(frames_dir, 'viewer.html')}")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"Error: ffmpeg not found or failed")
        print("Install ffmpeg: brew install ffmpeg (Mac) or apt install ffmpeg (Linux)")
        return False
    except FileNotFoundError:
        print("Error: ffmpeg not found. Install ffmpeg first.")
        return False


def create_viewer(frames_dir, frame_count):
    """Create simple HTML viewer for frames"""
    html = f"""<!DOCTYPE html>
<html>
<head><title>Frame Viewer</title></head>
<body style="background:#000; margin:0; padding:20px;">
<h1 style="color:#fff; text-align:center;">Extracted Frames ({frame_count} total)</h1>
<div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">
"""
    for i in range(1, frame_count + 1):
        html += f'<img src="frame_{i:04d}.png" style="max-width:200px; height:auto;">'
    
    html += """</div>
</body>
</html>"""
    
    with open(os.path.join(frames_dir, "viewer.html"), 'w') as f:
        f.write(html)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_frames.py <video_url_or_file>")
        print("Example: python extract_frames.py https://www.youtube.com/watch?v=VIDEO_ID")
        print("         python extract_frames.py https://example.com/video.mp4")
        print("         python extract_frames.py C:\\path\\to\\video.mp4")
        print("\nRequirements:")
        print("- Python 3.6+")
        print("- ffmpeg (for frame extraction)")
        print("- yt-dlp (for YouTube videos): pip install yt-dlp")
        sys.exit(1)
    
    url = sys.argv[1]
    fps = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    
    extract_frames(url, fps)
