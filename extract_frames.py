#!/usr/bin/env python3
"""
Video Frame Extraction Tool
Extracts 20 frames per second from any video URL using ffmpeg
"""

import os
import sys
import subprocess
import urllib.request
import argparse
from pathlib import Path


def download_video(url, output_path):
    """Download video from URL to local file"""
    print(f"Downloading video from: {url}")
    print(f"Saving to: {os.path.abspath(output_path)}")
    try:
        urllib.request.urlretrieve(url, output_path)
        print(f"Video downloaded successfully to: {output_path}")
        print(f"File size: {os.path.getsize(output_path)} bytes")
        return True
    except Exception as e:
        print(f"Error downloading video: {e}")
        print(f"Note: This script only works with direct video file URLs (MP4, AVI, etc.)")
        print(f"For YouTube or streaming videos, use yt-dlp to download first")
        return False


def extract_frames(video_path, output_dir, fps=20):
    """Extract frames from video using ffmpeg"""
    # Create output directory if it doesn't exist
    output_dir = os.path.abspath(output_dir)
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    print(f"Output directory (absolute path): {output_dir}")
    
    # Build ffmpeg command
    output_pattern = os.path.join(output_dir, "frame_%04d.png")
    cmd = [
        "ffmpeg",
        "-i", video_path,
        "-vf", f"fps={fps}",
        output_pattern
    ]
    
    print(f"Extracting frames at {fps} fps...")
    print(f"Command: {' '.join(cmd)}")
    
    try:
        subprocess.run(cmd, check=True)
        print(f"Frames extracted successfully to {output_dir}")
        
        # Count extracted frames
        frame_count = len([f for f in os.listdir(output_dir) if f.endswith('.png')])
        print(f"Total frames extracted: {frame_count}")
        print(f"Frame files are in: {output_dir}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error extracting frames: {e}")
        return False
    except FileNotFoundError:
        print("Error: ffmpeg not found. Please install ffmpeg first.")
        print("Install with: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Extract 20 frames per second from video URL using ffmpeg"
    )
    parser.add_argument("url", help="Video URL to extract frames from")
    parser.add_argument("--fps", type=int, default=20, help="Frames per second (default: 20)")
    parser.add_argument("--output", default="frames", help="Output directory for frames (default: frames)")
    parser.add_argument("--video-output", default="input_video.mp4", help="Temporary video file name (default: input_video.mp4)")
    
    args = parser.parse_args()
    
    # Download video
    if not download_video(args.url, args.video_output):
        sys.exit(1)
    
    # Extract frames
    if extract_frames(args.video_output, args.output, args.fps):
        # Clean up downloaded video
        try:
            os.remove(args.video_output)
            print(f"Cleaned up temporary video file: {args.video_output}")
        except:
            pass
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
