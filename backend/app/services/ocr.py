import pytesseract
from PIL import Image
import os
import tempfile

# Optional: for PDF support
try:
    from pdf2image import convert_from_path
    PDF_SUPPORT = True
except:
    PDF_SUPPORT = False

# Set Tesseract path
pytesseract.pytesseract.tesseract_cmd = os.getenv("TESSERACT_PATH", "tesseract")


def preprocess_image(image: Image.Image) -> Image.Image:
    """Improve OCR accuracy"""
    image = image.convert("L")  # grayscale
    image = image.point(lambda x: 0 if x < 140 else 255)  # threshold
    return image


def extract_text_from_image(image: Image.Image) -> str:
    image = preprocess_image(image)

    custom_config = r'--oem 3 --psm 4 --psm 11 '

    text = pytesseract.image_to_string(image, config=custom_config)
    return text.strip()


def extract_text(file_path: str) -> str:
    try:
        if file_path.lower().endswith(".pdf"):
            if not PDF_SUPPORT:
                raise Exception("PDF support not installed (pip install pdf2image)")

            images = convert_from_path(file_path)

            full_text = ""
            for img in images:
                full_text += extract_text_from_image(img) + "\n"

            return full_text.strip()

        else:
            image = Image.open(file_path)
            return extract_text_from_image(image)

    except Exception as e:
        return f"[OCR ERROR] {str(e)}"