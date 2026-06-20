import fs from "fs";
import path from "path";

function searchInDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== "node_modules" && file !== ".git" && file !== ".lovable" && file !== "dist") {
        searchInDir(fullPath, query);
      }
    } else {
      const content = fs.readFileSync(fullPath, "utf8");
      if (content.includes(query)) {
        console.log(`Found "${query}" in: ${fullPath}`);
      }
    }
  }
}

searchInDir(process.cwd(), "naming-kingdom");
