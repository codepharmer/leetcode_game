import { BLUEPRINT_LEVELS } from "../src/lib/blueprint/levels.js";
for (const id of ["q-9", "q-10"]) {
  const l = BLUEPRINT_LEVELS.find((x) => String(x.id) === id);
  console.log(id, l?.templateId, (l?.slots || []).join(","));
}
const l3 = BLUEPRINT_LEVELS.find((x) => String(x.id) === "3");
console.log("base-3", l3?.templateId, (l3?.slots || []).join(","));
