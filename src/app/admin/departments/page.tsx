import Link from "next/link";
import { Layers, Users } from "lucide-react";

export default function DepartmentsHub() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Page Heading */}
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">
        Departments
      </h1>
      <p className="text-sm text-gray-600 mb-8">
        Configure and manage departments.
      </p>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Create / Edit Departments */}
        <Link href="/admin/setup-dept" className="group">
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition border border-gray-100 h-full">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Layers size={22} />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Create / Edit Departments
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Add new departments or modify existing department details.
                </p>

                <div className="mt-4 text-sm font-medium text-indigo-600 group-hover:underline">
                  Open Setup →
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* View Departments */}
        <Link href="/admin/view-departments" className="group">
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition border border-gray-100 h-full">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
                <Users size={22} />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  View Departments
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  View all departments and their details.
                </p>

                <div className="mt-4 text-sm font-medium text-indigo-600 group-hover:underline">
                  View List →
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
