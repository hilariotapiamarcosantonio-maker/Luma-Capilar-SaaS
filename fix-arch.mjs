import fs from "fs";

const filesToServerOnly = [
  "src/lib/google-sheets.ts",
  "src/lib/crm-data/get-capilar-data.ts",
];

const pagesToNodeRuntime = [
  "src/app/page.tsx",
  "src/app/admin/page.tsx",
  "src/app/promotor/page.tsx",
  "src/app/chofer/page.tsx",
  "src/app/cobrador/page.tsx",
];

for (const file of filesToServerOnly) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, "utf8");
    if (!content.includes('import "server-only"')) {
      fs.writeFileSync(file, 'import "server-only";\n' + content, "utf8");
    }
  }
}

for (const file of pagesToNodeRuntime) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, "utf8");
    if (!content.includes('export const runtime = "nodejs";')) {
      content = content.replace(
        'export const dynamic = "force-dynamic";',
        'export const runtime = "nodejs";\nexport const dynamic = "force-dynamic";'
      );
      fs.writeFileSync(file, content, "utf8");
    }
  }
}

console.log("Capilar arch fix applied");
