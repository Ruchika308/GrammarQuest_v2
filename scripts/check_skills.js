import fs from 'fs';
import path from 'path';

const scratchDir = 'C:\\Users\\Ruchitesh\\.gemini\\antigravity\\brain\\a4df519e-b8d5-436c-a785-e6ddee855e69\\scratch';

try {
  const missingNames = JSON.parse(fs.readFileSync(path.join(scratchDir, 'missing_names.json'), 'utf-8'));
  const qBank = missingNames.Question_Bank;
  const skills = {};
  qBank.forEach(q => {
    skills[q.skill] = (skills[q.skill] || 0) + 1;
  });
  console.log('Distinct skills in question bank:', skills);
} catch (e) {
  console.error(e);
}
