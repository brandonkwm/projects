import express from "express";
import * as investigationsStore from "../store/investigations.js";
import * as runStore from "../store/runs.js";

const router = express.Router();

router.post("/:proposalId/accept", (req, res) => {
  try {
    const { proposalId } = req.params;
    const proposal = investigationsStore.getProposal(proposalId);
    if (!proposal) return res.status(404).json({ error: "Proposal not found" });
    if (proposal.status !== "pending") return res.status(409).json({ error: `Proposal already ${proposal.status}` });

    investigationsStore.setProposalDecision(proposalId, "accepted");

    const updatedBreak = runStore.resolveOrphanBreakAsMatch(proposal.runId, proposal.breakId, {
      candidateRow: proposal.candidate?.row ?? null,
    });

    // MVP: if override failed (shouldn't), still keep the human decision stored.
    res.json({ proposal: investigationsStore.getProposal(proposalId), updatedBreak });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to accept proposal" });
  }
});

router.post("/:proposalId/reject", (req, res) => {
  try {
    const { proposalId } = req.params;
    const proposal = investigationsStore.getProposal(proposalId);
    if (!proposal) return res.status(404).json({ error: "Proposal not found" });
    if (proposal.status !== "pending") return res.status(409).json({ error: `Proposal already ${proposal.status}` });

    investigationsStore.setProposalDecision(proposalId, "rejected");
    res.json({ proposal: investigationsStore.getProposal(proposalId) });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to reject proposal" });
  }
});

export default router;

