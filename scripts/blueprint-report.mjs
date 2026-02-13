import { BLUEPRINT_LEVELS } from "../src/lib/blueprint/levels.js";
import { buildBlueprintCoverageReport, formatBlueprintCoverageReport } from "../src/lib/blueprint/coverageReport.js";

const report = buildBlueprintCoverageReport(BLUEPRINT_LEVELS);
console.log(formatBlueprintCoverageReport(report));
