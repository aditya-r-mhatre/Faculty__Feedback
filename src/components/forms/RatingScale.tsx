"use client";

interface RatingProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
}

export default function RatingScale({ label, value, onChange }: RatingProps) {
  return (
    <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <label className="block text-slate-700 font-medium mb-3">{label}</label>
      <div className="flex justify-between items-center gap-2">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`w-12 h-12 rounded-full font-bold transition-all border-2 
              ${value === num 
                ? "bg-indigo-600 text-white border-indigo-600 scale-110 shadow-md" 
                : "bg-white text-slate-400 border-slate-200 hover:border-indigo-400 hover:text-indigo-400"
              }`}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-slate-400 px-1">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}