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
import glob
from pathlib import Path
from datetime import datetime
from PIL import Image


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


def frames_to_pdf(frames_dir, source_filename="video"):
    """Convert extracted frames to multi-page PDF(s)"""
    print(f"\nConverting frames to PDF...")
    
    # Get all PNG files sorted by filename
    png_files = sorted(glob.glob(os.path.join(frames_dir, "frame_*.png")))
    
    if not png_files:
        print("No PNG frames found to convert")
        return
    
    print(f"Found {len(png_files)} frames")
    
    # Estimate size and split if needed (25MB limit)
    max_size_mb = 25
    current_size = 0
    current_frames = []
    pdf_count = 0
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    for frame_path in png_files:
        frame_size = os.path.getsize(frame_path) / (1024 * 1024)  # Convert to MB
        
        # Check if adding this frame would exceed limit
        if current_size + frame_size > max_size_mb and current_frames:
            # Save current batch
            pdf_count += 1
            save_pdf(current_frames, pdf_count, source_filename, timestamp)
            current_size = 0
            current_frames = []
        
        current_frames.append(frame_path)
        current_size += frame_size
    
    # Save remaining frames
    if current_frames:
        pdf_count += 1
        save_pdf(current_frames, pdf_count, source_filename, timestamp)
    
    print(f"\n✓ PDF conversion complete")
    print(f"✓ Created {pdf_count} PDF file(s)")
    print(f"✓ Average frames per PDF: {len(png_files) // pdf_count if pdf_count > 0 else 0}")
    print(f"✓ Estimated size per PDF: ~{max_size_mb} MB")


def save_pdf(frames, part_num, source_filename, timestamp):
    """Save a batch of frames to a PDF file"""
    output_path = f"{source_filename}_part{part_num}.pdf"
    
    # Open first image to get dimensions
    img = Image.open(frames[0])
    width, height = img.size
    
    # Create PDF with captions
    pdf_images = []
    for frame_path in frames:
        img = Image.open(frame_path)
        
        # Add caption to image
        captioned = add_caption(img, source_filename, timestamp)
        pdf_images.append(captioned)
    
    # Save as PDF
    pdf_images[0].save(
        output_path,
        save_all=True,
        append_images=pdf_images[1:],
        save_format='PDF',
        resolution=100.0
    )
    
    file_size = os.path.getsize(output_path) / (1024 * 1024)
    print(f"  Created: {output_path} ({len(frames)} frames, {file_size:.2f} MB)")


def add_caption(img, source_filename, timestamp):
    """Add caption to image with source filename and timestamp"""
    from PIL import ImageDraw, ImageFont
    
    # Convert to RGB if necessary
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Create a copy to avoid modifying original
    img_copy = img.copy()
    draw = ImageDraw.Draw(img_copy)
    
    # Try to use a default font
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
    
    # Add caption at bottom
    caption = f"{source_filename} - {timestamp}"
    text_bbox = draw.textbbox((0, 0), caption, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    
    # Draw semi-transparent background for caption
    caption_height = 30
    overlay = Image.new('RGBA', (img_copy.width, caption_height), (0, 0, 0, 180))
    img_copy.paste(overlay, (0, img_copy.height - caption_height), overlay)
    
    # Draw text
    text_x = (img_copy.width - text_width) // 2
    text_y = img_copy.height - caption_height + 5
    draw.text((text_x, text_y), caption, fill=(255, 255, 255), font=font)
    
    return img_copy


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
        print("- Pillow (for PDF conversion): pip install Pillow")
        sys.exit(1)
    
    url = sys.argv[1]
    fps = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    
    # Extract frames first
    if extract_frames(url, fps):
        # Convert frames to PDF
        frames_dir = os.path.abspath("frames")
        source_filename = os.path.splitext(os.path.basename(url))[0] if '://' not in url else "video"
        frames_to_pdf(frames_dir, source_filename)
