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
    return ascii_txt