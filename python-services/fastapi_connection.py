from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import PlainTextResponse, FileResponse
import cv2
import numpy as np
from .image_preprocessing import resize_and_pad, convert_edge_image, convert_ascii_image
import shutil
import os

app = FastAPI()

@app.post("/ascii-art", response_class=PlainTextResponse)
async def ascii_art(
    file: UploadFile = File(...),
    pad_color: int = Form(0)
):
    # Save uploaded file temporarily
    temp_path = "temp_image"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    image = cv2.imread(temp_path)
    os.remove(temp_path)
    if image is None:
        return "Invalid image"
    resized = resize_and_pad(image, pad_color=pad_color)
    edges = convert_edge_image(resized)
    ascii_txt = convert_ascii_image(edges)

    # Save the ASCII art to a text file for debugging
    debug_dir = r"c:/image_debug"
    os.makedirs(debug_dir, exist_ok=True)
    # Use the uploaded filename if available, else 'temp_image'
    base_name = getattr(file, 'filename', 'temp_image')
    debug_file = os.path.join(debug_dir, os.path.basename(base_name) + "_ascii.txt")
    with open(debug_file, "w") as f:
        f.write(ascii_txt)

    return ascii_txt