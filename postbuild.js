const fs = require("fs");

// Create .nojekyll file to prevent GitHub Pages from ignoring _next folder
fs.writeFileSync("./out/.nojekyll", "");
console.log("✅ .nojekyll file created");

// CNAME for custom domain
fs.writeFileSync("./out/CNAME", "actattendance.aarifshaik.me");
console.log("✅ CNAME file created");

console.log("✅ Postbuild complete");
