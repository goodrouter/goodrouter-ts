import * as fs from "fs";
import * as path from "path";
import { projectRoot } from "../utils/index.js";

export function loadTemplates(name: string) {
    const filePath = path.join(projectRoot, "fixtures", name + ".txt");
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const fileContent = fs.readFileSync(filePath, "utf8");

    const templates = fileContent.
        split("\n").
        map(line => line.trim()).
        filter(line => line.length > 0);

    return templates;
}
