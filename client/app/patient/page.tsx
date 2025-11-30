"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function PatientUI() {
  // SORT STATES
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("height");
  const [order, setOrder] = useState("asc");

  // SINGLE SEARCH STATES
  const [patientId, setPatientId] = useState("");
  const [singlePatient, setSinglePatient] = useState<any>(null);
  const [error, setError] = useState("");

  // UPDATE STATES
  const [updateData, setUpdateData] = useState({
    name: "",
    city: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
  });

  // ----------------------------------------
  // FETCH SORTED PATIENTS
  // ----------------------------------------
  const fetchSortedPatients = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/sort", {
        params: { sort_by: sortBy, order: order },
      });
      setPatients(res.data);
    } catch (err) {
      console.error("Error fetching sorted:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSortedPatients();
  }, [sortBy, order]);

  // ----------------------------------------
  // SEARCH PATIENT BY ID
  // ----------------------------------------
  const handleSearch = async () => {
    if (!patientId) {
      setError("Enter a valid patient ID.");
      return;
    }

    setError("");
    setSinglePatient(null);
    setLoading(true);

    try {
      const res = await axios.get(`http://127.0.0.1:8000/patient/${patientId}`);
      setSinglePatient(res.data);

      // Fill update form with existing data
      setUpdateData({
        name: res.data.name,
        city: res.data.city,
        age: res.data.age,
        gender: res.data.gender,
        height: res.data.height,
        weight: res.data.weight,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Patient not found.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // HANDLE UPDATE INPUTS
  // ----------------------------------------
  const handleUpdateChange = (e: any) => {
    const { name, value } = e.target;
    setUpdateData((prev) => ({ ...prev, [name]: value }));
  };

  // ----------------------------------------
  // UPDATE PATIENT (PUT)
  // ----------------------------------------
  const updatePatient = async () => {
    try {
      await axios.put(`http://127.0.0.1:8000/edit/${patientId}`, updateData);
      alert("Patient updated successfully!");
    } catch (err) {
      alert("Failed to update patient.");
    }
  };

  // ----------------------------------------
  // DELETE PATIENT (DELETE)
  // ----------------------------------------
  const deletePatient = async () => {
    if (!confirm(`Delete patient ${patientId}?`)) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/delete/${patientId}`);
      alert("Patient deleted successfully!");
      setSinglePatient(null);
      setPatientId("");
    } catch (err) {
      alert("Deletion failed.");
    }
  };

  // ----------------------------------------
  // UI SECTION
  // ----------------------------------------
  return (
    <div className="p-10">
      {/* PAGE TITLE */}
      <h1 className="text-3xl font-bold mb-8">Patient Management Dashboard</h1>

      {/* ========================== SEARCH ========================== */}
      <div className="p-6 border rounded bg-gray-50 mb-10">
        <h2 className="text-xl font-bold mb-4">Search Patient by ID</h2>

        <div className="flex gap-3 mb-5">
          <input
            type="text"
            placeholder="Enter patient ID, e.g. P001"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="border px-4 py-2 rounded w-full"
          />

          <button
            onClick={handleSearch}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Search
          </button>
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        {singlePatient && (
          <div className="border p-6 bg-white rounded shadow mb-6">
            <h3 className="text-2xl font-bold mb-3">{singlePatient.name}</h3>

            <p><strong>City:</strong> {singlePatient.city}</p>
            <p><strong>Age:</strong> {singlePatient.age}</p>
            <p><strong>Gender:</strong> {singlePatient.gender}</p>
            <p><strong>Height:</strong> {singlePatient.height}</p>
            <p><strong>Weight:</strong> {singlePatient.weight}</p>
            <p><strong>BMI:</strong> {singlePatient.bmi}</p>

            <p className="mt-2">
              <strong>Verdict:</strong>{" "}
              <span className="text-blue-700 font-semibold">
                {singlePatient.verdict}
              </span>
            </p>
          </div>
        )}

        {/* ========== UPDATE + DELETE SECTION ========== */}
        {singlePatient && (
          <div className="border p-6 bg-white rounded shadow">

            <h2 className="text-lg font-bold mb-4">Edit Patient Details</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                name="name"
                value={updateData.name}
                onChange={handleUpdateChange}
                className="border p-2 rounded"
                placeholder="Name"
              />

              <input
                name="city"
                value={updateData.city}
                onChange={handleUpdateChange}
                className="border p-2 rounded"
                placeholder="City"
              />

              <input
                type="number"
                name="age"
                value={updateData.age}
                onChange={handleUpdateChange}
                className="border p-2 rounded"
                placeholder="Age"
              />

              <select
                name="gender"
                value={updateData.gender}
                onChange={handleUpdateChange}
                className="border p-2 rounded"
              >
                <option value="">Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>

              <input
                type="number"
                name="height"
                value={updateData.height}
                onChange={handleUpdateChange}
                className="border p-2 rounded"
                placeholder="Height (m)"
              />

              <input
                type="number"
                name="weight"
                value={updateData.weight}
                onChange={handleUpdateChange}
                className="border p-2 rounded"
                placeholder="Weight (kg)"
              />
            </div>

            <button
              onClick={updatePatient}
              className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
            >
              Update Patient
            </button>

            <button
              onClick={deletePatient}
              className="bg-red-600 text-white w-full py-2 rounded hover:bg-red-700 mt-4"
            >
              Delete Patient
            </button>

          </div>
        )}
      </div>

      {/* ========================== SORTING ========================== */}
      <div className="mb-10 p-6 border rounded bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Sort Patients</h2>

        <div className="flex gap-4 items-center mb-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="height">Height</option>
            <option value="weight">Weight</option>
            <option value="bmi">BMI</option>
          </select>

          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>

          <button
            onClick={fetchSortedPatients}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Apply
          </button>
        </div>

        {loading && <p>Loading...</p>}

        {!loading &&
          patients.map((p: any, i) => (
            <div
              key={i}
              className="border p-4 mb-3 bg-white rounded shadow-sm"
            >
              <h3 className="font-bold text-lg mb-1">{p.name}</h3>
              <p><strong>Height:</strong> {p.height}</p>
              <p><strong>Weight:</strong> {p.weight}</p>
              <p><strong>BMI:</strong> {p.bmi}</p>
              <p><strong>Verdict:</strong> {p.verdict}</p>
            </div>
          ))}
      </div>

    </div>
  );
}
