import { startAnalysisWorker } from "./analysis.worker";
import { startClipWorker } from "./clip.worker";

console.log("Starting workers...");
startAnalysisWorker();
startClipWorker();
console.log("Workers running. Press Ctrl+C to stop.");
