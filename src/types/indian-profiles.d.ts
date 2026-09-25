declare module '@/public/indian-profiles-and-projects.json' {
  interface Department {
    department: string;
    roles: string[];
  }

  interface DepartmentData {
    filmCrewDepartmentsAndRoles: Department[];
  }

  const data: DepartmentData;
  export = data;
}
