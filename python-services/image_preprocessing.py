import cv2
import numpy as np
glasses_resolution  = (640, 200)

def resize_image(image, resolution=glasses_resolution):
    """
    Resize the image to the specified resolution while maintaining the aspect ratio.
    """
    height, width = image.shape[:2]
    aspect_ratio = width / height
    new_width = resolution[0]
    new_height = int(new_width / aspect_ratio)
    
    resized_image = cv2.resize(image, (new_width, new_height))
    return resized_image

def resize_and_pad(image, resolution=(100, 32), pad_color=0):
    """
    Resize image to fit within resolution, preserving aspect ratio.
    Pad as needed to fill the resolution.
    Default output is 100 chars wide, 32 lines tall (adjust as needed for your glasses).
    """
    target_w, target_h = resolution
    h, w = image.shape[:2]
    scale = min(target_w / w, target_h / h)
    new_w, new_h = int(w * scale), int(h * scale)
    resized = cv2.resize(image, (new_w, new_h))

    # Create new image and paste resized into center
    result = np.full((target_h, target_w, 3), pad_color, dtype=np.uint8)
    y_offset = (target_h - new_h) // 2
    x_offset = (target_w - new_w) // 2
    result[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = resized
    return result

def convert_edge_image(image):
    """
    Convert the image to grayscale, enhance contrast with histogram, and apply Canny edge detection.
    """
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    equ = cv2.equalizeHist(gray_image)
    edges = cv2.Canny(equ, 100, 200)
    return edges

def convert_ascii_image(image, ascii_chars=" ,:;+*?%#@S"):
    """
    Convert the image to ASCII art.
    """
    image = image.astype(np.float32)  # Ensure image is in uint8 format
    height, width = image.shape
    ascii_image = ""
    for i in range(height):
        for j in range(width):
            pixel_value = image[i, j]
            ascii_index = np.int16(pixel_value * (len(ascii_chars) - 1) // 255)
            ascii_image += ascii_chars[ascii_index]
        ascii_image += "\n"
    return ascii_image

if __name__ == "__main__":
    # path to image
    path = "C:/Users/arash/OneDrive/Pictures/IMG_1329.jpg"
    # path = "C:/Users/arash/OneDrive/Pictures/IMG_1331.jpg"
    # path = "C:/Users/arash/OneDrive/Pictures/Screenshots/Screenshot 2025-05-31 124509.png"
    # path = "C:/Users/arash/OneDrive/Pictures/IMG_7724.jpg"

    output_file = "ascii_art.txt"
    image = cv2.imread(path)
    # Use new default resolution for ASCII art (100x32)
    resized_image = resize_and_pad(image)
    edge_image = convert_edge_image(resized_image)
    # save the edge image
    cv2.imwrite("edge_image.jpg", edge_image)
    ascii_art = convert_ascii_image(edge_image)

    # Save the ASCII art to a text file
    with open(output_file, "w") as file:
        file.write(ascii_art)
