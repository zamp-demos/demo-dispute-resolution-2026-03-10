# Merchant Dispute Resolution — Knowledge Base

## Overview
Uber Eats merchant dispute resolution process using AI agents to investigate disputes, evaluate evidence from Salesforce and Stripe, and recommend outcomes based on policy rules.

## 7-Step Process
1. Pick case from queue (priority-based)
2. Review merchant profile, order, delivery, customer risk, merchant statement
3. Verify payment/refund data in Stripe
4. Assess evidence and apply decision tree
5. HITL checkpoint — human approval required
6. Process resolution (reverse/uphold/escalate)
7. Flag accounts, close case with audit trail

## Decision Tree Rules
**Rule #1 - Reverse Adjustment (Merchant Wins)**
- Customer refund rate >10% AND
- Merchant accuracy >95% AND
- Normal delivery (on-time, no route issues)
- Outcome: Return funds to merchant, flag customer for fraud

**Rule #2 - Uphold Adjustment (Customer Wins)**
- Merchant accuracy <90% AND
- Clean customer history (<10% refund rate)
- Outcome: Customer keeps refund, note merchant accuracy concern

**Rule #3 - Platform Absorbs Cost**
- Delivery >20 min late OR
- Route deviation OR
- No proof of delivery
- Outcome: Platform covers cost, neither party penalized

**Rule #4 - Escalate to Tier 2**
- Mixed/conflicting evidence OR
- Dispute amount >$100 with unclear liability OR
- Complex multi-factor cases
- Outcome: Package all evidence for senior analyst review

## Key Thresholds
- **Fraud flag**: Customer refund rate >10%
- **Pattern fraud**: 3+ identical claim types in 90 days
- **Merchant credibility**: >95% accuracy = high, <90% = systemic issues
- **High-value customer**: 50+ lifetime orders
- **Escalation trigger**: Dispute amount >$100
- **Delivery fault**: >20 minutes late from ETA

## Evidence Assessment Framework
**Merchant Credibility Factors:**
- Partner tier (Platinum > Gold > Silver)
- Order accuracy rate (%)
- Prior dispute history and outcomes
- Statement specificity and evidence provided

**Customer Credibility Factors:**
- Lifetime refund rate (%)
- Refund pattern concentration (same claim type repeatedly)
- 90-day refund count and dollar amount
- Account age and order volume

**Delivery Factors:**
- On-time vs late (actual vs ETA)
- Route deviations or unscheduled stops
- Proof of delivery photo quality
- Driver notes and behavior flags

## HITL Checkpoint Protocol
The agent NEVER executes financial actions without human approval. At Step 5, the agent:
1. Presents full investigation summary
2. Shows all evidence artifacts (tables, PDFs)
3. Recommends an outcome with reasoning
4. Lists the specific policy rule that applies
5. Waits for human to approve, override, or escalate

Human reviewer options:
- Approve agent recommendation
- Override with different outcome
- Request additional investigation
- Escalate to MLRO/Tier 2 regardless of agent recommendation

## Systems Used
**Salesforce Service Cloud**: Case queue, merchant/customer profiles, order details, delivery data, case management

**Stripe Dashboard**: Payment verification, refund history, payout impact analysis

## Artifact Types
- **Tables**: Merchant profiles, order comparisons, customer risk, payment summaries
- **PDFs**: Comprehensive investigation reports with full evidence chain
- **Decision Cards**: HITL approval interfaces with recommendation + options

## Post-Resolution Actions
**Confirmed False Positive (Reverse):**
- Refund returned to merchant
- Customer account flagged for pattern fraud if thresholds exceeded
- Case closed with audit trail

**Confirmed True (Uphold):**
- Customer keeps refund
- Merchant accuracy concern noted if <90%
- May trigger merchant partnership review

**Escalated:**
- Full evidence package sent to Tier 2
- Specific questions flagged for senior analyst
- Case remains open with "Pending Tier 2" status

## Common Dispute Scenarios
**Missing Items**: Items claimed not delivered despite order completion
**Wrong Order**: Customer received different items than ordered
**Quality Issues**: Food arrived cold, damaged, or inedible
**Late Delivery**: Significant delay beyond ETA causing food quality issues
**Catering Disputes**: High-value corporate orders with business meeting impact

## Fraud Indicators
- Refund rate consistently above 10%
- 8+ claims of same type (e.g., "missing items")
- 5+ refund requests in 90-day window
- High-value orders followed immediately by dispute
- Pattern of claiming cheaper items missing (staying under review thresholds)

## Contact & Escalation
For questions about this process, contact Dispute Operations team.
For policy clarifications, consult Compliance & Risk team.
For technical issues with Salesforce/Stripe integrations, contact Platform Engineering.
