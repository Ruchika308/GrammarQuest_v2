import fs from "fs";
import path from "path";

// Function to read API key from environment or .env.local file
function getApiKey() {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/GEMINI_API_KEY=(.*)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

const MILESTONES_SPECS = [
  {
    id: "MN",
    name: "Missing Names",
    concept: "Common Nouns",
    objective: "Identify people, places, animals and things.",
    vocab: `Animals: dog, cat, cow, horse, lion, tiger, rabbit, bird, fish, monkey.
People: teacher, doctor, farmer, driver, chef, nurse, pilot, student, friend, police officer.
Places: school, hospital, park, market, library, zoo, farm, garden, museum, beach.
Things: book, chair, table, pencil, bag, bottle, clock, ball, bicycle, computer.`,
    imagePrefix: "mn"
  },
  {
    id: "SN",
    name: "Special Names",
    concept: "Proper Nouns",
    objective: "Identify special names (which require capital letters).",
    vocab: `People: Aarav, Priya, Rahul, Ananya, Arjun, Diya, Kabir, Meera.
Cities: Delhi, Mumbai, Jaipur, Chennai, Kolkata, Pune, Hyderabad, Lucknow.
Countries: India, Japan, Australia, Brazil, Canada, Nepal.
Rivers: Ganga, Yamuna, Godavari, Narmada.
Monuments: Taj Mahal, Red Fort, Qutub Minar, India Gate, Gateway of India, Charminar.
Festivals: Diwali, Holi, Eid, Christmas.`,
    imagePrefix: "sn"
  },
  {
    id: "OM",
    name: "One & Many",
    concept: "Regular Plurals",
    objective: "Convert singular nouns into regular plural nouns (e.g. s, es, ies).",
    vocab: `Regular plurals only: book -> books, cat -> cats, tree -> trees, bus -> buses, box -> boxes, baby -> babies, toy -> toys, class -> classes, brush -> brushes, bench -> benches. Do NOT use irregular plurals like children, men, teeth.`,
    imagePrefix: "om"
  },
  {
    id: "SP",
    name: "Strange Plurals",
    concept: "Irregular Plurals",
    objective: "Identify irregular plural forms.",
    vocab: `Irregular plurals only: child -> children, man -> men, woman -> women, mouse -> mice, tooth -> teeth, foot -> feet, person -> people, goose -> geese.`,
    imagePrefix: "sp"
  },
  {
    id: "TT",
    name: "Team Trouble",
    concept: "Collective Nouns",
    objective: "Identify group names.",
    vocab: `Collective nouns: team, class, family, group, flock, herd, bunch, crowd, crew, pack, swarm.`,
    imagePrefix: "tt"
  },
  {
    id: "MW",
    name: "Magic Workshop",
    concept: "Material Nouns",
    objective: "Identify materials things are made from.",
    vocab: `Material nouns: gold, silver, wood, glass, iron, cotton, plastic, steel, wool, paper.`,
    imagePrefix: "mw"
  },
  {
    id: "FT",
    name: "Family Tree",
    concept: "Gender Nouns",
    objective: "Identify masculine and feminine noun forms.",
    vocab: `Gender noun pairs: king / queen, boy / girl, uncle / aunt, actor / actress, prince / princess, lion / lioness, hero / heroine, nephew / niece.`,
    imagePrefix: "ft"
  },
  {
    id: "IT",
    name: "Invisible Treasures",
    concept: "Abstract Nouns",
    objective: "Identify ideas, feelings and qualities.",
    vocab: `Abstract nouns: love, honesty, kindness, friendship, joy, bravery, wisdom, peace, hope, patience.`,
    imagePrefix: "it"
  },
  {
    id: "OI",
    name: "Ownership Island",
    concept: "Possessive Nouns",
    objective: "Identify ownership / possessive nouns.",
    vocab: `Possessive nouns: Riya's book, Rahul's bag, The dog's tail, The teacher's desk, The girl's bicycle, The boy's cap, Aarav's pencil, The cat's toy.`,
    imagePrefix: "oi"
  }
];

// Call Gemini API to generate questions for a specific milestone
async function generateMilestoneQuestions(apiKey: string, spec: typeof MILESTONES_SPECS[number]): Promise<any[]> {
  const prompt = `You are an expert elementary English curriculum designer. Generate exactly 40 unique, high-quality MCQ questions for the milestone: "${spec.name}" (ID: ${spec.id}).

Context:
- Path Name: Noun Kingdom
- Milestone ID: ${spec.id}
- Concept: ${spec.concept}
- Learning Objective: ${spec.objective}
- Audience: Age 7–12, Indian context (use Indian names/places like Aarav, Priya, Delhi, Taj Mahal).
- Image Prefix: ${spec.imagePrefix}

Vocabulary/Examples Pool:
\n${spec.vocab}\n

CRITICAL REQUIREMENTS:
1. Generate exactly 40 questions.
2. Skill distribution:
   - "recognition" = 12 questions
   - "classification" = 10 questions
   - "application" = 10 questions
   - "transfer" = 8 questions
3. Difficulty distribution:
   - "explorer" (easy) = 16 questions
   - "detective" (medium) = 16 questions
   - "creator" (hard) = 8 questions
4. Answer Randomization: The correct answers must be evenly distributed across option_a, option_b, option_c, and option_d (approx. 25% or 10 questions each).
5. Output format: Return a JSON object with a single field "questions" which is an array of objects.
6. Fields:
   - "question_id": Formatted as ${spec.id}-[skillPrefix]-001 to 040 (e.g. ${spec.id}-R-001 for recognition, ${spec.id}-C-001 for classification, ${spec.id}-A-001 for application, ${spec.id}-T-001 for transfer)
   - "path_id": always "noun_kingdom"
   - "milestone_id": always "${spec.id}"
   - "concept": always "${spec.concept.toLowerCase().replace(/\\s+/g, '_')}"
   - "learning_objective": always "${spec.objective}"
   - "skill": one of ["recognition", "classification", "application", "transfer"]
   - "difficulty": one of ["explorer", "detective", "creator"]
   - "question_type": always "mcq"
   - "theme": a simple tag representing the theme (e.g., animal, place, thing)
   - "prompt": Short, simple prompt suitable for children. Avoid advanced terminology.
   - "image_url": must be a filename e.g. "${spec.imagePrefix}_[name].png" (e.g. "${spec.imagePrefix}_dog.png")
   - "option_a", "option_b", "option_c", "option_d": believable distractors (e.g. all option choices belong to the same category so it's not too obvious, but only one is correct).
   - "correct_answer": must contain the EXACT text of the correct option choice.
   - "explanation": child-friendly explanation (max 12 words).
   - "tags": comma-separated tags.

Response MUST be a JSON object matching the JSON schema. Do not include markdown tags.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          questions: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                question_id: { type: "STRING" },
                path_id: { type: "STRING" },
                milestone_id: { type: "STRING" },
                concept: { type: "STRING" },
                learning_objective: { type: "STRING" },
                skill: { type: "STRING", enum: ["recognition", "classification", "application", "transfer"] },
                difficulty: { type: "STRING", enum: ["explorer", "detective", "creator"] },
                question_type: { type: "STRING" },
                theme: { type: "STRING" },
                prompt: { type: "STRING" },
                image_url: { type: "STRING" },
                option_a: { type: "STRING" },
                option_b: { type: "STRING" },
                option_c: { type: "STRING" },
                option_d: { type: "STRING" },
                correct_answer: { type: "STRING" },
                explanation: { type: "STRING" },
                tags: { type: "STRING" }
              },
              required: [
                "question_id", "path_id", "milestone_id", "concept", "learning_objective", 
                "skill", "difficulty", "question_type", "theme", "prompt", "image_url", 
                "option_a", "option_b", "option_c", "option_d", "correct_answer", 
                "explanation", "tags"
              ]
            }
          }
        },
        required: ["questions"]
      }
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const responseData = await response.json();
  const jsonText = responseData.candidates[0].content.parts[0].text;
  const parsed = JSON.parse(jsonText);
  return parsed.questions;
}

export async function generateAllQuestions() {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    console.error("\n[Error] GEMINI_API_KEY is not configured in .env.local");
    console.error("Please add your key to .env.local to run the LLM question bank generator.\n");
    process.exit(1);
  }

  console.log("Generating Noun Kingdom Question Bank using Gemini API (360 questions in total)...");
  const allQuestions: any[] = [];

  for (const spec of MILESTONES_SPECS) {
    console.log(`Generating 40 questions for Milestone ${spec.id} (${spec.name})...`);
    let attempts = 0;
    while (attempts < 3) {
      try {
        const milestoneQuestions = await generateMilestoneQuestions(apiKey, spec);
        console.log(`Successfully generated ${milestoneQuestions.length} questions for ${spec.id}.`);
        allQuestions.push(...milestoneQuestions);
        break;
      } catch (err) {
        attempts++;
        console.warn(`Attempt ${attempts} failed for milestone ${spec.id}. Retrying...`, err);
        if (attempts === 3) throw err;
      }
    }
  }

  console.log(`Finished generating all ${allQuestions.length} questions!`);
  return allQuestions;
}
