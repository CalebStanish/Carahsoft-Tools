from fastapi import FastAPI
from pydantic import BaseModel
from pathlib import Path
import pandas as pd

app = FastAPI()

class SKURequest(BaseModel):
    pricing: str
    source: str
    skus: list[str]

@app.post("/search")
def search_skus(data: SKURequest):
    # Match source to proper sheet
    sheet_map = {
        "Standard": "Standard Pricing",
        "GovCloud": "Datadog for Government Pricing"
    }
    sheet_name = sheet_map.get(data.source)
    if not sheet_name:
        return []

    # Access Excel in same folder as script
    file_path = Path(__file__).parent / "DATADOG PRICELIST - Calebs Version.xlsx"
    if not file_path.exists():
        return [{"error": "Excel file not found"}]

    df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)

    results = []
    for idx, row in df.iterrows():
        if any(str(row[col]).strip() in data.skus for col in [11, 12, 13]):
            results.append({
                "sku": str(row[0]),  # Column A
                "description": f"{row[4]}, Annual Rate Reflected",  # Column E
                "ondemand_price": str(df.iloc[idx - 1, 5]) if idx > 0 else "",  # Previous row, column F
                "annual_price": str(row[6])  # Column G
            })

    return results
