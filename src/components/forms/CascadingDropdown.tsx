"use client";
import { useState, useEffect } from "react";

interface CascadingProps {
  onSelect: (data: { deptId: string; programId: string }) => void;
}

export default function CascadingDropdown({ onSelect }: CascadingProps) {
  const [depts, setDepts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedProg, setSelectedProg] = useState("");

  useEffect(() => {
    fetch("/api/admin/dept").then(res => res.json()).then(setDepts);
  }, []);

  useEffect(() => {
    if (selectedDept) {
      fetch(`/api/admin/program?deptId=${selectedDept}`)
        .then(res => res.json())
        .then(setPrograms);
    } else {
      setPrograms([]);
    }
    setSelectedProg("");
  }, [selectedDept]);

  useEffect(() => {
    onSelect({ deptId: selectedDept, programId: selectedProg });
  }, [selectedDept, selectedProg]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">Select Department</label>
        <select 
          className="w-full p-2 border rounded bg-white"
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
        >
          <option value="">-- Choose Dept --</option>
          {depts.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">Select Program</label>
        <select 
          className="w-full p-2 border rounded bg-white disabled:bg-slate-100"
          disabled={!selectedDept}
          value={selectedProg}
          onChange={(e) => setSelectedProg(e.target.value)}
        >
          <option value="">-- Choose Program --</option>
          {programs.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>
    </div>
  );
}