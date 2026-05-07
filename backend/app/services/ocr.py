import os
import logging
import traceback
import time

import pytesseract

from PIL import (
    Image,
    ImageFilter,
    ImageOps,
    ImageEnhance,
)

# =========================================================
# OPTIONAL PDF SUPPORT
# =========================================================

try:
    from pdf2image import convert_from_path
    PDF_SUPPORT = True
except Exception:
    PDF_SUPPORT = False


logger = logging.getLogger(__name__)

# =========================================================
# TESSERACT CONFIG
# =========================================================

pytesseract.pytesseract.tesseract_cmd = os.getenv(
    "TESSERACT_PATH",
    "tesseract"
)

# =========================================================
# OCR CONFIG
# =========================================================

SUPPORTED_IMAGE_TYPES = {".png", ".jpg", ".jpeg"}
SUPPORTED_PDF_TYPES   = {".pdf"}

# PSM 6 = Assume uniform block of text (good for single-column)
# PSM 3 = Fully automatic page segmentation (good for mixed layouts)
# We try PSM 6 first; if output is sparse, retry with PSM 3.
OCR_CONFIG_PRIMARY   = r"--oem 3 --psm 6"
OCR_CONFIG_FALLBACK  = r"--oem 3 --psm 3"

# Minimum character count to accept PSM 6 result without retrying
OCR_MIN_CHARS = 100


# =========================================================
# IMAGE PREPROCESSING
# Improvement: threshold raised from 150→140 (less aggressive),
# added mild contrast enhancement before thresholding.
# This recovers faint text that the old threshold clipped.
# =========================================================

def preprocess_image(image: Image.Image) -> Image.Image:
    """
    Improve OCR accuracy using preprocessing.
    Safe changes vs original:
    - Contrast enhancement added before thresholding
    - Threshold lowered from 150 → 140 (less aggressive clipping)
    """
    try:
        # Convert to grayscale
        image = image.convert("L")

        # Mild contrast boost (helps faint printed text)
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.5)

        # Auto-contrast normalization
        image = ImageOps.autocontrast(image)

        # Sharpen edges
        image = image.filter(ImageFilter.SHARPEN)

        # Binarize — 140 recovers slightly more text than 150
        image = image.point(lambda x: 0 if x < 140 else 255, "1")

        return image

    except Exception as e:
        logger.error(f"[OCR] Image preprocessing failed: {str(e)}")
        return image


# =========================================================
# OCR FROM IMAGE
# Improvement: dual-PSM strategy — retry with PSM 3 if
# PSM 6 yields too little text (sparse/multi-column layouts).
# =========================================================

def extract_text_from_image(image: Image.Image) -> str:
    """
    Extract OCR text from PIL image.
    Uses PSM 6 → PSM 3 fallback for sparse results.
    """
    try:
        processed = preprocess_image(image)

        # Primary attempt: PSM 6 (uniform block)
        text = pytesseract.image_to_string(processed, config=OCR_CONFIG_PRIMARY)
        cleaned = text.strip()

        # If result is sparse, retry with PSM 3 (auto-segment)
        if len(cleaned) < OCR_MIN_CHARS:
            logger.info("[OCR] PSM 6 result sparse, retrying with PSM 3")
            text_alt = pytesseract.image_to_string(processed, config=OCR_CONFIG_FALLBACK)
            cleaned_alt = text_alt.strip()
            if len(cleaned_alt) > len(cleaned):
                cleaned = cleaned_alt
                logger.info(f"[OCR] PSM 3 improved result: {len(cleaned)} chars")

        logger.info(f"[OCR] Extracted {len(cleaned)} characters from image")
        return cleaned

    except Exception as e:
        logger.error(f"[OCR] Image OCR failed: {str(e)}")
        logger.error(traceback.format_exc())
        return ""


# =========================================================
# OCR FROM PDF
# =========================================================

def extract_text_from_pdf(file_path: str) -> str:
    """
    Convert PDF pages to images and run OCR.
    """
    if not PDF_SUPPORT:
        raise Exception(
            "PDF support not installed. "
            "Install pdf2image + poppler."
        )

    try:
        t_start = time.time()
        images = convert_from_path(file_path, dpi=300)

        all_text = []

        for index, image in enumerate(images):
            logger.info(f"[OCR] Processing PDF page {index + 1}/{len(images)}")
            page_text = extract_text_from_image(image)
            if page_text:
                all_text.append(page_text)

        combined = "\n\n".join(all_text)
        elapsed  = round(time.time() - t_start, 2)

        logger.info(
            f"[OCR] PDF extraction complete: "
            f"{len(combined)} chars from {len(images)} pages in {elapsed}s"
        )

        return combined.strip()

    except Exception as e:
        logger.error(f"[OCR] PDF OCR failed: {str(e)}")
        logger.error(traceback.format_exc())
        raise


# =========================================================
# MAIN OCR ENTRY
# =========================================================

def extract_text(file_path: str) -> str:
    """
    Main OCR extraction pipeline.
    Supports: PDF, PNG, JPG, JPEG
    """
    if not os.path.exists(file_path):
        logger.error(f"[OCR] File not found: {file_path}")
        return ""

    extension = os.path.splitext(file_path)[1].lower()

    try:
        logger.info(f"[OCR] Starting extraction: {os.path.basename(file_path)} ({extension})")

        if extension in SUPPORTED_PDF_TYPES:
            return extract_text_from_pdf(file_path)

        elif extension in SUPPORTED_IMAGE_TYPES:
            image = Image.open(file_path)
            return extract_text_from_image(image)

        else:
            logger.warning(f"[OCR] Unsupported file type: {extension}")
            return ""

    except Exception as e:
        logger.error(f"[OCR] Extraction failed: {str(e)}")
        logger.error(traceback.format_exc())
        return ""
