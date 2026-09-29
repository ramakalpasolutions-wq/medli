// prisma/seedDefaultTests.js
const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  // Check if a path was passed via CLI (e.g. node seedDefaultTests.js ~/Downloads/tests.xlsx)
  const cliPath = process.argv[2];
  let filePath = '';

  if (cliPath && fs.existsSync(cliPath)) {
    filePath = path.resolve(cliPath);
  } else if (fs.existsSync(path.join(__dirname, 'default_tests.xlsx'))) {
    filePath = path.join(__dirname, 'default_tests.xlsx');
  } else {
    // Try to find any xlsx file in prisma/ directory
    const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
    if (files.length > 0) {
      filePath = path.join(__dirname, files[0]);
    }
  }

  if (!filePath || !fs.existsSync(filePath)) {
    console.error('\n❌ Excel file not found!');
    console.log('👉 Please do one of the following:');
    console.log('   1. Copy your Excel file to: ./prisma/default_tests.xlsx');
    console.log('   2. OR run with file path: node prisma/seedDefaultTests.js "/path/to/your/file.xlsx"\n');
    process.exit(1);
  }

  console.log(`📖 Reading tests from: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`📊 Found ${rows.length} rows inside Excel file. Seed starting...`);
  if (rows.length > 0) {
    console.log('Detected columns:', Object.keys(rows[0]));
  }

  let upsertedCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    // Flexible column header mapping
    const name = String(row['Test Name'] || row['test_name'] || row['name'] || row['Name'] || '').trim();
    let code = String(row['Test Code'] || row['test_code'] || row['code'] || row['Code'] || '').trim().toUpperCase();
    const category = String(row['Category'] || row['category'] || 'General Diagnostic').trim();
    const price = parseFloat(row['Suggested Price'] || row['Price'] || row['price'] || row['mrp'] || row['MRP'] || 0);
    const sampleType = String(row['Sample Type'] || row['sample_type'] || row['sampleType'] || 'Blood').trim();
    const instructions = row['Instructions'] || row['preparationInstructions'] || row['Instructions/Notes'] || null;

    // Fallback: Generate code if missing
    if (!code && name) {
      code = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
    }

    const parametersRaw = String(row['Parameters'] || row['parameters'] || '');
    const parameters = parametersRaw
      ? parametersRaw.split(',').map(p => p.trim()).filter(Boolean)
      : [];

    const tatValue = parseInt(row['TAT Value'] || row['tat'] || row['Turnaround Time'] || 12, 10);
    const tatUnit = String(row['TAT Unit'] || 'hours').toLowerCase().includes('day') ? 'days' : 'hours';

    if (!name || !code) {
      skippedCount++;
      continue;
    }

    try {
      await prisma.testTemplate.upsert({
        where: { code },
        update: {
          name,
          category,
          parameters,
          suggestedPrice: price,
          sampleType,
          preparationInstructions: instructions,
          turnaroundTime: {
            value: isNaN(tatValue) ? 12 : tatValue,
            unit: tatUnit
          }
        },
        create: {
          name,
          code,
          category,
          parameters,
          suggestedPrice: price,
          sampleType,
          preparationInstructions: instructions,
          turnaroundTime: {
            value: isNaN(tatValue) ? 12 : tatValue,
            unit: tatUnit
          }
        }
      });
      upsertedCount++;
    } catch (err) {
      console.error(`⚠️ Failed to upsert test "${code}":`, err.message);
      skippedCount++;
    }
  }

  console.log(`\n✅ Template Seeding Complete!`);
  console.log(`   - Upserted: ${upsertedCount}`);
  console.log(`   - Skipped: ${skippedCount}`);

  // Auto-sync into all existing labs
  const labs = await prisma.lab.findMany({ select: { id: true, name: true } });
  const allTemplates = await prisma.testTemplate.findMany({ where: { isActive: true } });

  console.log(`\n🔗 Syncing templates to ${labs.length} existing labs...`);
  let syncedCount = 0;

  for (const lab of labs) {
    for (const tpl of allTemplates) {
      const existingTest = await prisma.test.findFirst({
        where: { labId: lab.id, code: tpl.code }
      });

      if (!existingTest) {
        await prisma.test.create({
          data: {
            labId: lab.id,
            templateId: tpl.id,
            name: tpl.name,
            code: tpl.code,
            category: tpl.category,
            parameters: tpl.parameters,
            price: tpl.suggestedPrice,
            sampleType: tpl.sampleType,
            preparationInstructions: tpl.preparationInstructions,
            turnaroundTime: tpl.turnaroundTime,
            isActive: false, // Inactive by default, lab activates on dashboard
            isCustom: false
          }
        });
        syncedCount++;
      }
    }
  }

  console.log(`🚀 All done! Synced ${syncedCount} tests across ${labs.length} labs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });