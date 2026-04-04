"use client";

import { useEffect, useState } from "react";
import {
  getQuestionAnswers,
  addQuestionAnswer,
  updateQuestionAnswer,
  deleteQuestionAnswer,
} from "@/lib/store";
import type { QuestionAnswer } from "@/types";

const COMMON_QUESTIONS = [
  { key: "work_authorization", question: "Work authorization / Visa status" },
  { key: "salary_expectation", question: "Salary expectation (or range)" },
  { key: "notice_period", question: "Notice period" },
  { key: "how_heard", question: "How did you hear about us?" },
  { key: "linkedin_url", question: "LinkedIn profile URL" },
  { key: "portfolio_url", question: "Portfolio / personal site URL" },
];

export default function QAPage() {
  const [list, setList] = useState<QuestionAnswer[]>([]);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editA, setEditA] = useState("");

  useEffect(() => {
    setList(getQuestionAnswers());
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ.trim() || !newA.trim()) return;
    addQuestionAnswer(newQ.trim(), newA.trim());
    setList(getQuestionAnswers());
    setNewQ("");
    setNewA("");
  };

  const handleAddCommon = (question: string, key: string) => {
    const existing = list.find(
      (q) => q.key === key || q.question_text.toLowerCase() === question.toLowerCase()
    );
    if (existing) return;
    addQuestionAnswer(question, "", key);
    setList(getQuestionAnswers());
  };

  const startEdit = (item: QuestionAnswer) => {
    setEditingId(item.id);
    setEditA(item.answer_text);
  };

  const saveEdit = () => {
    if (editingId && editA !== undefined) {
      updateQuestionAnswer(editingId, { answer_text: editA });
      setList(getQuestionAnswers());
    }
    setEditingId(null);
    setEditA("");
  };

  const handleDelete = (id: string) => {
    deleteQuestionAnswer(id);
    setList(getQuestionAnswers());
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-800">Common Q&A</h1>
      <p className="text-sm text-stone-500">
        Add answers to questions that appear on many application forms. The macro will use these to fill matching fields.
      </p>

      <div>
        <h2 className="mb-2 text-sm font-medium text-stone-700">Quick add common questions</h2>
        <div className="flex flex-wrap gap-2">
          {COMMON_QUESTIONS.map(({ key, question }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleAddCommon(question, key)}
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
            >
              + {question}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
        <input
          type="text"
          value={newQ}
          onChange={(e) => setNewQ(e.target.value)}
          placeholder="Question"
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
        <input
          type="text"
          value={newA}
          onChange={(e) => setNewA(e.target.value)}
          placeholder="Answer"
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {list.length === 0 ? (
          <li className="text-sm text-stone-500">No Q&A yet. Add common questions above or use the form.</li>
        ) : (
          list.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-stone-200 bg-white p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-800">{item.question_text}</p>
                {editingId === item.id ? (
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      value={editA}
                      onChange={(e) => setEditA(e.target.value)}
                      className="min-w-0 flex-1 rounded border border-stone-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="text-sm text-green-600 hover:underline"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-stone-600">
                    {item.answer_text || <span className="italic text-stone-400">No answer yet</span>}
                  </p>
                )}
                {item.key && (
                  <p className="mt-0.5 text-xs text-stone-400">key: {item.key}</p>
                )}
              </div>
              {editingId !== item.id && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="text-sm text-stone-500 hover:text-stone-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
