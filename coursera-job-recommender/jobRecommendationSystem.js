// jobRecommendationSystem.js

// ============ 1. REQUIRE STATEMENTS ============
const readline = require("readline");
const { HfInference } = require("@huggingface/inference");
const jobPostings = require("./jobPostings");

// WARNING: API key is hard-coded only for this assignment.
// Do NOT commit this key to any public repository.
const hf = new HfInference("hf_myapikey");

// ============ 2. SIMPLE IN-MEMORY "VECTOR DB" ============
class InMemoryVectorStore {
  constructor() {
    this.vectors = []; // { id, embedding, metadata }
  }

  upsert(id, embedding, metadata) {
    const existingIndex = this.vectors.findIndex((v) => v.id === id);
    if (existingIndex !== -1) {
      this.vectors[existingIndex] = { id, embedding, metadata };
    } else {
      this.vectors.push({ id, embedding, metadata });
    }
  }

  query(queryEmbedding, topK = 4) {
    const withScores = this.vectors.map((item) => ({
      ...item,
      score: cosineSimilarity(queryEmbedding, item.embedding),
    }));
    return withScores.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}

// ============ 3. HELPER FUNCTIONS ============

// processing data (Checkpoint: processing data)
function processingData(job) {
  const responsibilities = Array.isArray(job.jobResponsibilities)
    ? job.jobResponsibilities.join("; ")
    : job.jobResponsibilities || "";

  const qualifications = Array.isArray(job.preferredQualifications)
    ? job.preferredQualifications.join("; ")
    : job.preferredQualifications || "";

  return `
    Title: ${job.jobTitle}
    Company: ${job.company}
    Location: ${job.location}
    Type: ${job.jobType}
    Salary: ${job.salary}
    Description: ${job.jobDescription}
    Responsibilities: ${responsibilities}
    Preferred Qualifications: ${qualifications}
  `;
}

// Checkpoint: generateEmbeddings()
async function generateEmbeddings(text) {
  const result = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
  });

  return Array.isArray(result[0]) ? result[0] : result;
}

function cosineSimilarity(a, b) {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Checkpoint: classifyText()
// Uses facebook/bart-large-mnli and the request() method,
// matching the Coursera rubric example.
async function classifyText(text, labels) {
  const response = await hf.request({
    model: "facebook/bart-large-mnli",
    inputs: text,
    parameters: { candidate_labels: labels },
  });
  return response;
}

// Helper used for recommendations based on embeddings.
async function classifyUserText(userText, vectorStore) {
  const queryEmbedding = await generateEmbeddings(userText);
  const topMatches = vectorStore.query(queryEmbedding, 4);
  return topMatches.map((match) => match.metadata);
}

// ============ 4. MAIN FUNCTION (Checkpoint) ============

async function main() {
  // Ensure each jobId is unique using a Set and while loop,
  // as required in the Coursera rubric.
  const uniqueIds = new Set();
  jobPostings.forEach((job, index) => {
    while (uniqueIds.has(job.jobId.toString())) {
      job.jobId = `${job.jobId}_${index}`;
    }
    uniqueIds.add(job.jobId.toString());
  });

  // Build the "vector DB" once from the job postings.
  const vectorStore = new InMemoryVectorStore();

  for (const job of jobPostings) {
    const jobText = processingData(job);
    const embedding = await generateEmbeddings(jobText);
    vectorStore.upsert(job.jobId, embedding, job);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    "Describe the job you are looking for (title, skills, location, etc.): ",
    async (answer) => {
      try {
        const recommendations = await classifyUserText(
          answer,
          vectorStore
        );

        console.log("\nRecommended Jobs:");
        recommendations.forEach((job, index) => {
          console.log(
            `Top ${index + 1} Recommended Job Title ==> ${job.jobTitle}`
          );
        });

        console.log(
          "\n(Use this console output for your Part 1 screenshot.)"
        );
      } catch (error) {
        console.error("Error generating recommendations:", error.message);
      } finally {
        rl.close();
      }
    }
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
  processingData,
  generateEmbeddings,
  classifyText,
  classifyUserText,
  InMemoryVectorStore,
};

