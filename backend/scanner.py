import zipfile
import os

def scan_folder(zip_path):
    """
    Scans the uploaded ZIP file.
    Returns a JSON object with file names and dummy scan results.
    """
    if not os.path.exists(zip_path):
        raise FileNotFoundError(f"{zip_path} does not exist")

    results = []

    # Only handle ZIP files for now
    if zip_path.endswith('.zip'):
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Extract to a temporary folder
            extract_dir = zip_path + "_extracted"
            os.makedirs(extract_dir, exist_ok=True)
            zip_ref.extractall(extract_dir)

            # List all files and give dummy scan results
            for root, _, files in os.walk(extract_dir):
                for f in files:
                    file_path = os.path.join(root, f)
                    results.append({
                        "file": os.path.relpath(file_path, extract_dir),
                        "status": "clean"  # you can implement real scan logic here
                    })
    else:
        raise ValueError("Only ZIP files are supported")

    return {"results": results}
