from fastapi import FastAPI, Path, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, computed_field
import json
from typing import Annotated, Literal, Dict, Any, List
from pathlib import Path as SysPath
from fastapi.middleware.cors import CORSMiddleware


DATA_FILE = SysPath("patients.json")

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # Allowed frontend origins
    allow_credentials=True,
    allow_methods=["*"],            # GET, POST, PUT, DELETE...
    allow_headers=["*"],            # Custom headers
)


class Patient(BaseModel):
    id: Annotated[str, Field(..., description="ID of the patient", example="P001")]
    name: Annotated[str, Field(..., description="Name of the patient")]
    gender: Annotated[
        Literal["male", "female", "other"], Field(..., description="Gender of the patient")
    ]
    city: Annotated[str, Field(..., description="City where the patient lives")]
    age: Annotated[int, Field(..., gt=0, lt=120, description="Age of the patient")]
    height: Annotated[float, Field(..., gt=0, description="Height in meters")]
    weight: Annotated[float, Field(..., gt=0, description="Weight in kg")]

    @computed_field
    def bmi(self) -> float:
        return round(self.weight / (self.height ** 2), 2)

    @computed_field
    def verdict(self) -> str:
        if self.bmi < 18.5:
            return "underweight"
        elif self.bmi < 25:
            return "normal"
        elif self.bmi < 30:
            return "overweight"
        else:
            return "obese"


def load_data() -> Dict[str, Any]:
    """Load JSON data. Return empty dict if file missing or invalid."""
    if not DATA_FILE.exists():
        return {}
    try:
        with DATA_FILE.open("r", encoding="utf-8") as f:
            data = json.load(f)
            if not isinstance(data, dict):
                return {}
            return data
    except (json.JSONDecodeError, OSError):
        return {}


def save_data(data: Dict[str, Any]) -> None:
    """Save data dict to JSON file (pretty printed)."""
    with DATA_FILE.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)


@app.get("/")
def hello():
    return {"message": "hello world"}


@app.get("/about")
def about():
    return {"message": "the message is about"}


@app.get("/view")
def view():
    """Return all patients as a dict {id: patient_dict}"""
    return load_data()


@app.get("/patient/{patient_id}")
def view_patient(
    patient_id: str = Path(..., description="Id of the patient in the db", example="P001")
):
    data = load_data()
    patient = data.get(patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@app.get("/sort", response_model=List[Dict[str, Any]])
def sort_patients(
    sort_by: str = Query(
        ...,
        description="Field to sort by. One of: height, weight, bmi",
        example="bmi",
    ),
    order: str = Query("asc", description="sort order: asc or desc", example="asc"),
):
    valid_fields = ["height", "weight", "bmi"]
    if sort_by not in valid_fields:
        raise HTTPException(status_code=400, detail=f"invalid field, select from {valid_fields}")

    if order not in ["asc", "desc"]:
        raise HTTPException(status_code=400, detail="Invalid order, select from ['asc','desc']")

    data = load_data()
    # Ensure we sort a list of patient dicts
    patients_list = list(data.values())

    # Sorting: handle missing or non-numeric values by treating as 0
    def key_fn(item: Dict[str, Any]):
        val = item.get(sort_by, 0)
        try:
            return float(val)
        except (TypeError, ValueError):
            return 0.0

    reverse = order == "desc"
    sorted_data = sorted(patients_list, key=key_fn, reverse=reverse)
    return sorted_data


@app.post("/created", status_code=201)
def create_patient(patient: Patient):
    # load existing data
    data = load_data()

    # check if the patient already exists
    if patient.id in data:
        raise HTTPException(status_code=400, detail="Patient already exists")

    # include computed fields (bmi, verdict) when saving
    # model_dump with compute=True includes computed_field results
    patient_dict = patient.model_dump(mode="json")

    # save the record
    data[patient.id] = patient_dict
    save_data(data)

    return JSONResponse(status_code=201, content={"message": "Patient Created Successfully"})

@app.put('/edit/{patient_id}')
def update_patient(patient_id: str, patient_update: PatientsUpdate):

    data = load_data()

    if patient_id not in data:
        raise HTTPException(status_code=404, detail='Patient not found')
    
    existing_patient_info = data[patient_id]

    update_patient_info = patient_update.model_dump(exclude_unset=True)

    for key, value in update_patient_info.items():
        existing_patient_info[key] = value

    #existing_patient_info -> pydantic object -> update bmi + verdict -> pydantic object -> dict
    existing_patient_info['id'] = patient_id
    patient_pydantic_object = Patient(**existing_patient_info)

    patient_pydantic_object.model_dump(exclude='id')
    #add this dict to data
    data[patient_id] = existing_patient_info

    #save the data
    save_data(data)

    return JSONResponse(status_code=200, content={'message':'patient updated'})


@app.delete('/delete/{patient_id}')
def delete_patient(patient_id: str):
    #load data
    data = load_data()

    if patient_id not in data:
        return HTTPException(status_code=200, detail='Patient not found')
    
    del data[patient_id]

    #save the data
    save_data(data)

    return JSONResponse(status_code=200, content={'message':'patient deleted'})