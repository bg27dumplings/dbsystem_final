export type StudentStatus = "active" | "frozen";

export type StudentSession = {
  studentId: number;
  studentNo: string;
  name: string;
  status: StudentStatus;
};

export type DemoStudentRecord = StudentSession & {
  email: string;
  passwordHash: string;
};
