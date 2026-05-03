import pytesseract
from PIL import Image
import os

import os

pytesseract.pytesseract.tesseract_cmd = os.getenv("TESSERACT_PATH", "tesseract")

def extract_text(file_path: str):
    image = Image.open(file_path)
    text = pytesseract.image_to_string(image)
    return text