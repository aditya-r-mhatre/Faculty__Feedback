"use client";
import Link from "next/link";
import { Users, BookOpen, Layers, GitBranch, ClipboardList, ArrowRight } from "lucide-react";
import { useState } from "react";

async function promoteAll(): Promise<any> {
  const res = await fetch('/api/admin/promote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
  return res.json();
}

export default function AdminDashboard() {
  const [promoting, setPromoting] = useState(false);
  const navCards = [
    { title: "Manage Students", desc: "Search, edit student details", icon: <Users />, href: "/admin/manage-students", color: "bg-blue-500" },
    { title: "Faculty Directory", desc: "Add and manage faculty", icon: <Users />, href: "/admin/faculty-directory", color: "bg-blue-600" },
    { title: "Course Directory", desc: "Add and manage courses", icon: <BookOpen />, href: "/admin/course-directory", color: "bg-orange-500" },
    { title: "Departments", desc: "Setup Departments", icon: <Layers />, href: "/admin/departments", color: "bg-purple-500" },
    { title: "Analytics", desc: "View feedback analytics with filters", icon: <ClipboardList />, href: "/admin/analytics", color: "bg-indigo-500" },
    { title: "Feedback Forms", desc: "Create & Manage Feedback Questionnaires", icon: <ClipboardList />, href: "/admin/manage-forms", color: "bg-rose-500" },
    { title: "View Forms", desc: "List, filter and toggle form status", icon: <ClipboardList />, href: "/admin/view-forms", color: "bg-rose-600" },
  ];

  return (
    <div className="space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Admin Command Center</h1>
        <p className="text-slate-500">Configure academic structure and manage evaluation forms.</p>
        <div className="mt-4">
          <button
            disabled={promoting}
            onClick={async () => {
              if (!confirm('Promote students one year up for all students? This action cannot be easily undone.')) return;
              try {
                setPromoting(true);
                const result = await promoteAll();
                alert('Promotion complete: ' + JSON.stringify(result.results || result));
              } catch (e) {
                console.error(e);
                alert('Promotion failed');
              } finally { setPromoting(false); }
            }}
            className="mt-2 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {promoting ? 'Promoting...' : 'Promote Students'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {navCards.map((card, idx) => (
          <Link href={card.href} key={idx} className="group">
            <div className="h-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1">
              <div className={`${card.color} text-white p-3 rounded-lg w-fit mb-4`}>
                {card.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                {card.title}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{card.desc}</p>
              <div className="mt-4 flex items-center text-xs font-bold text-indigo-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Manage Module <ArrowRight size={14} className="ml-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}