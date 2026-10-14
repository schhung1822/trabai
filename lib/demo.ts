import { newId } from "./random";
import {
  DEFAULT_SETTINGS,
  type ClassRoom,
  type Gender,
  type PersistedState,
  type Student,
} from "./types";

const DEMO_NAMES: [string, Gender][] = [
  ["Nguyễn Văn An", "male"],
  ["Trần Thị Bích Ngọc", "female"],
  ["Lê Minh Khôi", "male"],
  ["Phạm Thu Hà", "female"],
  ["Hoàng Gia Bảo", "male"],
  ["Vũ Ngọc Diệp", "female"],
  ["Đặng Quốc Huy", "male"],
  ["Bùi Khánh Linh", "female"],
  ["Đỗ Hải Nam", "male"],
  ["Ngô Phương Thảo", "female"],
  ["Dương Anh Tuấn", "male"],
  ["Lý Mai Anh", "female"],
  ["Phan Đức Thịnh", "male"],
  ["Trịnh Bảo Châu", "female"],
  ["Võ Thanh Sơn", "male"],
  ["Đinh Tuyết Nhi", "female"],
  ["Mai Hoàng Long", "male"],
  ["Tạ Yến Vy", "female"],
  ["Cao Nhật Minh", "male"],
  ["Nguyễn Thị Hồng Nhung", "female"],
];

export function createDemoStudents(): Student[] {
  return DEMO_NAMES.map(([name, gender], i) => ({
    id: newId("hs"),
    no: i + 1,
    name,
    gender,
    present: true,
  }));
}

export function createDemoClass(): ClassRoom {
  return {
    id: newId("lop"),
    name: "Lớp demo 10A1",
    students: createDemoStudents(),
    calledIds: [],
    cycle: 1,
  };
}

export function createInitialState(): PersistedState {
  const cls = createDemoClass();
  return {
    version: 1,
    classes: [cls],
    activeClassId: cls.id,
    templateId: "ufo-pho",
    settings: { ...DEFAULT_SETTINGS },
    history: [],
    pendingTurn: null,
  };
}
